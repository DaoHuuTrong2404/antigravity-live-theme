param(
    [switch]$NoStartup,
    [switch]$Rebuild,
    [switch]$Relaunch
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceRoot = Split-Path -Parent $ScriptDir
$SkillInstallDir = Join-Path $HOME '.gemini\config\skills\antigravity-custom-theme'

# If run from Downloads/Desktop/cloned folder, sync into ~/.gemini/config/skills/antigravity-custom-theme
# so Antigravity discovers the skill AND deleting Downloads never breaks the background daemon.
$NormSource = [System.IO.Path]::GetFullPath($SourceRoot).TrimEnd('\')
$NormTarget = [System.IO.Path]::GetFullPath($SkillInstallDir).TrimEnd('\')

if ($NormSource -ieq $NormTarget) {
    $RepoRoot = $SourceRoot
} else {
    Write-Host "[install-win] Installing skill & daemon into $SkillInstallDir ..."
    New-Item -ItemType Directory -Force -Path $SkillInstallDir | Out-Null
    foreach ($sub in @('daemon', 'dist', 'engine', 'references', 'scripts', 'themes')) {
        $srcSub = Join-Path $SourceRoot $sub
        $dstSub = Join-Path $SkillInstallDir $sub
        if (Test-Path $srcSub) {
            if (Test-Path $dstSub) { Remove-Item -Recurse -Force $dstSub }
            Copy-Item -Recurse -Force $srcSub $dstSub
        }
    }
    foreach ($file in @('SKILL.md', 'README.md', 'LICENSE', '.gitignore', 'CAI-DAT-1-CHAM.bat', 'GO-CAI-DAT.bat')) {
        $srcFile = Join-Path $SourceRoot $file
        if (Test-Path $srcFile) {
            Copy-Item -Force $srcFile (Join-Path $SkillInstallDir $file)
        }
    }
    $RepoRoot = $SkillInstallDir
}

$DaemonJs = Join-Path $RepoRoot 'daemon\theme_daemon.js'
$PayloadJs = Join-Path $RepoRoot 'dist\theme_payload.js'
$BuildPy = Join-Path $RepoRoot 'scripts\build_payload.py'
$PidFile = Join-Path $RepoRoot 'daemon.pid'
$VbsPath = Join-Path $RepoRoot 'silent-start.vbs'

# 1. Verify Node.js >= 22
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCmd) {
    Write-Error "Node.js not found in PATH. Please install Node.js >= 22 (https://nodejs.org) first."
}
$NodeExe = $NodeCmd.Source
$NodeMajor = [int]((& $NodeExe -p "process.versions.node.split('.')[0]").Trim())
if ($NodeMajor -lt 22) {
    Write-Error "Node.js >= 22 is required (found v$NodeMajor at $NodeExe). Download LTS from https://nodejs.org."
}

# 2. Build payload only if missing or -Rebuild requested (pre-built dist/theme_payload.js ships in repo)
if ($Rebuild -or -not (Test-Path $PayloadJs)) {
    $PyCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $PyCmd) { $PyCmd = Get-Command python3 -ErrorAction SilentlyContinue }
    if (-not $PyCmd) {
        Write-Error "dist/theme_payload.js is missing and Python was not found to build it."
    }
    Write-Host "[install-win] Compiling dist/theme_payload.js..."
    & $PyCmd.Source $BuildPy
    if ($LASTEXITCODE -ne 0) {
        Write-Error "build_payload.py failed with exit code $LASTEXITCODE."
    }
}

# 3. Ensure Antigravity shortcuts pass --remote-debugging-port=0 --remote-allow-origins=*
$WshShell = New-Object -ComObject WScript.Shell
$CandidateShortcuts = @(
    (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Antigravity.lnk'),
    (Join-Path $HOME 'Desktop\Antigravity.lnk'),
    (Join-Path $HOME 'OneDrive\Desktop\Antigravity.lnk'),
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Antigravity.lnk'),
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Antigravity\Antigravity.lnk'),
    (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\Antigravity.lnk')
) | Select-Object -Unique

$FoundAgyExe = Join-Path $env:LOCALAPPDATA 'Programs\antigravity\Antigravity.exe'
foreach ($lnk in $CandidateShortcuts) {
    if ($lnk -and (Test-Path $lnk)) {
        try {
            $sc = $WshShell.CreateShortcut($lnk)
            if ($sc.TargetPath -and (Test-Path $sc.TargetPath)) {
                $FoundAgyExe = $sc.TargetPath
            }
            $argsNow = [string]$sc.Arguments
            $changed = $false
            if ($argsNow -notmatch '--remote-debugging-port') {
                $argsNow = ("--remote-debugging-port=0 " + $argsNow).Trim()
                $changed = $true
            }
            if ($argsNow -notmatch '--remote-allow-origins') {
                $argsNow = ($argsNow + " --remote-allow-origins=*").Trim()
                $changed = $true
            }
            if ($changed) {
                $sc.Arguments = $argsNow
                $sc.Save()
                Write-Host "[install-win] Patched CDP flags on shortcut: $lnk"
            }
        } catch {
            Write-Warning "[install-win] Could not update shortcut $lnk : $_"
        }
    }
}

# 4. Stop previous daemon instance if running
if (Test-Path $PidFile) {
    $OldPidText = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    $OldPid = 0
    if ([int]::TryParse(($OldPidText -as [string]), [ref]$OldPid) -and $OldPid -gt 0) {
        $ExistingProc = Get-Process -Id $OldPid -ErrorAction SilentlyContinue
        if ($ExistingProc -and $ExistingProc.ProcessName -eq 'node') {
            Write-Host "[install-win] Stopping previous daemon (PID $OldPid)..."
            Stop-Process -Id $OldPid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 350
        }
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

# 5. Generate silent-start.vbs dynamically & register Startup shortcut
$EscapedNode = $NodeExe.Replace('"', '""')
$EscapedDaemon = $DaemonJs.Replace('"', '""')
$VbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "$($RepoRoot.Replace('"', '""'))"
WshShell.Run """$EscapedNode"" ""$EscapedDaemon""", 0, False
"@
Set-Content -Path $VbsPath -Value $VbsContent -Encoding ASCII

if (-not $NoStartup) {
    $StartupDir = [Environment]::GetFolderPath('Startup')
    $ShortcutPath = Join-Path $StartupDir 'AntigravityCustomTheme.lnk'
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = 'wscript.exe'
    $Shortcut.Arguments = """$VbsPath"""
    $Shortcut.WorkingDirectory = $RepoRoot
    $Shortcut.WindowStyle = 7
    $Shortcut.Description = 'Antigravity Custom Theme & Live Motion Daemon'
    $Shortcut.Save()
    Write-Host "[install-win] Startup auto-launch registered: $ShortcutPath"
}

Write-Host "[install-win] Starting background theme daemon..."
Start-Process -FilePath 'wscript.exe' -ArgumentList """$VbsPath""" -WorkingDirectory $RepoRoot

$DaemonReady = $false
for ($i = 0; $i -lt 16; $i++) {
    Start-Sleep -Milliseconds 250
    if (Test-Path $PidFile) {
        $NewPidText = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
        $NewPid = 0
        if ([int]::TryParse(($NewPidText -as [string]), [ref]$NewPid) -and $NewPid -gt 0) {
            if (Get-Process -Id $NewPid -ErrorAction SilentlyContinue) {
                Write-Host "[install-win] Daemon active (PID $NewPid)."
                $DaemonReady = $true
                break
            }
        }
    }
}

if (-not $DaemonReady) {
    Write-Warning "[install-win] Daemon did not write daemon.pid in time. Check $RepoRoot\daemon.log."
    exit 1
}

# 6. Check if Antigravity needs a full restart (including hidden System Tray process) to open DevToolsActivePort
$PortFileA = Join-Path $env:APPDATA 'antigravity\DevToolsActivePort'
$PortFileB = Join-Path $env:APPDATA 'Antigravity\DevToolsActivePort'
$HasPort = (Test-Path $PortFileA) -or (Test-Path $PortFileB)

if ($Relaunch -and (Test-Path $FoundAgyExe)) {
    Write-Host "[install-win] Restarting Antigravity cleanly (closing System Tray process) with CDP enabled..."
    & taskkill.exe /F /IM Antigravity.exe 2>$null | Out-Null
    Start-Sleep -Milliseconds 1400
    Start-Process -FilePath $FoundAgyExe -ArgumentList '--remote-debugging-port=0 --remote-allow-origins=*'
    Write-Host "[install-win] Antigravity relaunched! Theme & 6-Stage Boot OS will appear automatically."
} elseif (-not $HasPort) {
    Write-Host ""
    Write-Host "[install-win] NOTE: Antigravity is running without CDP (or closed)." -ForegroundColor Yellow
    Write-Host "  Run with -Relaunch (or double-click CAI-DAT-1-CHAM.bat) to restart Antigravity from System Tray automatically!" -ForegroundColor Cyan
}

exit 0
