@echo off
chcp 65001 >nul
title Antigravity Live Theme — Cai Dat 1 Cham (Tawa Winter Live)
echo ================================================================
echo   ANTIGRAVITY LIVE THEME ^& 6-STAGE BOOT OS (1-CLICK INSTALLER)
echo ================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-win.ps1" -Relaunch
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [LOI] Cai dat chua thanh cong. Kiem tra da cai Node.js ^>= 22 chua ^(https://nodejs.org^).
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [HOAN TAT] Da cai theme + tu khoi dong cung Windows + bat lai Antigravity!
timeout /t 4
