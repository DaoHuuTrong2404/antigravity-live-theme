(() => {
	if (typeof window.__AGY_LIVE_CLEANUP__ === "function") {
		try {
			window.__AGY_LIVE_CLEANUP__();
		} catch (e) {}
	}

	const THEMES = /*__THEMES_PLACEHOLDER__*/ {};
	const THEME_KEYS = Object.keys(THEMES);
	const DEFAULT_THEME_KEY = THEME_KEYS[0] || "Default";

	const STORAGE_THEME = "agy_theme_v3";
	const STORAGE_BUBBLE = "agy_bubble_v3";
	const STORAGE_INPUT = "agy_input_v3";
	const STORAGE_DIMMING = "agy_dimming_v3";
	const STORAGE_WP_ENABLED = "agy_wp_enabled_v3";
	const STORAGE_CUSTOM_WP = "agy_custom_wp_v3";
	const STORAGE_PARTICLES = "agy_particles_v1";
	const STORAGE_MOTION = "agy_motion_v1";
	const STORAGE_BLINK = "agy_blink_v1";
	const STORAGE_IRIS = "agy_iris_v1";
	const STORAGE_BOOT_MODE = "agy_boot_mode_v1";
	const STORAGE_BOOT_SOUND = "agy_boot_sound_v1";
	const STORAGE_OP_NAME = "agy_op_name_v1";
	const STORAGE_OP_UID = "agy_op_uid_v1";
	const STORAGE_GREETING = "agy_greeting_v1";
	const STORAGE_HAS_VIDEO = "agy_has_custom_video_v1";
	const SESSION_BOOT_DONE = "agy_boot_played_v1";

	const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

	const AGY_LOGO_SVG = (size = 44, cls = "") => `
    <svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="agyBootGrad" x1="12" y1="54" x2="52" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="36%" stop-color="#38bdf8"/>
          <stop offset="68%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#ef4444"/>
        </linearGradient>
      </defs>
      <path class="agy-logo-ribbon" d="M12 52 C18 48, 23 30, 28 14 C29.5 9.5, 34.5 9.5, 36 14 C41 30, 46 48, 52 52 C47 52, 42.5 44, 38.5 35 C35.5 28.5, 28.5 28.5, 25.5 35 C21.5 44, 17 52, 12 52 Z" fill="url(#agyBootGrad)"/>
    </svg>
  `;

	const MINI_NEKO_SVG = `
    <svg width="24" height="22" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11 L7 3 L12 8 Q14 7.5 16 8 L21 3 L23 11 Q25 14 24 19 Q22 23 14 23 Q6 23 4 19 Q3 14 5 11 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2"/>
      <path d="M7.2 5.2 L6.2 9.5 L10.2 8.2 Z" fill="#f472b6" opacity="0.75"/>
      <path d="M20.8 5.2 L21.8 9.5 L17.8 8.2 Z" fill="#38bdf8" opacity="0.75"/>
      <circle cx="10.2" cy="14.8" r="1.4" fill="#db2777"/>
      <circle cx="17.8" cy="14.8" r="1.4" fill="#d97706"/>
      <path d="M12.2 17.3 Q13.1 18.6 14 17.5 Q14.9 18.6 15.8 17.3" stroke="#334155" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="8" cy="16.8" r="1.3" fill="#fbcfe8" opacity="0.8"/>
      <circle cx="20" cy="16.8" r="1.3" fill="#fbcfe8" opacity="0.8"/>
    </svg>
  `;

	const INPUT_STYLES = {
		sync: {
			label: "Synced Ornament Frame",
			desc: "Follows the active theme borders & decorative SVG ornament",
		},
		double_gold: {
			label: "Amber Gold Double Border",
			desc: "Warm metallic double border with corner filigree",
		},
		glass: {
			label: "Translucent Crystal Glass",
			desc: "Lets more of your animated backdrop shine through",
		},
		minimal: {
			label: "Minimal Clean",
			desc: "Sleek subtle border without top decorative stickers",
		},
	};

	// --- IndexedDB helper for large custom .mp4 / .webm live wallpapers ---
	const IDB_NAME = "agy_custom_theme_media_v1";
	const IDB_STORE = "videos";
	let activeVideoObjectUrl = "";

	function openMediaDb() {
		return new Promise((resolve, reject) => {
			if (!window.indexedDB) {
				reject(new Error("IndexedDB unavailable"));
				return;
			}
			const req = window.indexedDB.open(IDB_NAME, 1);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains(IDB_STORE)) {
					db.createObjectStore(IDB_STORE);
				}
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}

	async function saveCustomVideoBlob(blob) {
		const db = await openMediaDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, "readwrite");
			tx.objectStore(IDB_STORE).put(blob, "active_video");
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => {
				db.close();
				reject(tx.error);
			};
		});
	}

	async function loadCustomVideoBlob() {
		try {
			const db = await openMediaDb();
			return await new Promise((resolve) => {
				const tx = db.transaction(IDB_STORE, "readonly");
				const req = tx.objectStore(IDB_STORE).get("active_video");
				req.onsuccess = () => {
					db.close();
					resolve(req.result || null);
				};
				req.onerror = () => {
					db.close();
					resolve(null);
				};
			});
		} catch (_) {
			return null;
		}
	}

	async function clearCustomVideoBlob() {
		try {
			const db = await openMediaDb();
			await new Promise((resolve) => {
				const tx = db.transaction(IDB_STORE, "readwrite");
				tx.objectStore(IDB_STORE).delete("active_video");
				tx.oncomplete = () => {
					db.close();
					resolve();
				};
				tx.onerror = () => {
					db.close();
					resolve();
				};
			});
		} catch (_) {}
		if (activeVideoObjectUrl) {
			try {
				URL.revokeObjectURL(activeVideoObjectUrl);
			} catch (_) {}
			activeVideoObjectUrl = "";
		}
	}

	function getState() {
		const init = window.__AGY_INITIAL_CONFIG__ || {};
		const rawTheme =
			localStorage.getItem(STORAGE_THEME) ||
			init.themeName ||
			DEFAULT_THEME_KEY;
		const themeName = THEMES[rawTheme] ? rawTheme : DEFAULT_THEME_KEY;
		const thObj = THEMES[themeName] || {};
		const rawBubble =
			localStorage.getItem(STORAGE_BUBBLE) || init.bubbleName || themeName;
		const bubbleName = THEMES[rawBubble] ? rawBubble : themeName;
		const inputStyle =
			localStorage.getItem(STORAGE_INPUT) || init.inputStyle || "sync";
		const defaultDim = themeName === "Tawa Winter Live" ? 30 : 69;
		const dimming = parseInt(
			localStorage.getItem(STORAGE_DIMMING) ||
				(init.dimming !== undefined ? init.dimming : String(defaultDim)),
			10,
		);
		const wpEnabled =
			localStorage.getItem(STORAGE_WP_ENABLED) !== null
				? localStorage.getItem(STORAGE_WP_ENABLED) !== "false"
				: init.wpEnabled !== undefined
					? init.wpEnabled
					: true;
		const customWp =
			localStorage.getItem(STORAGE_CUSTOM_WP) || init.customWp || "";
		const particles =
			localStorage.getItem(STORAGE_PARTICLES) ||
			init.particles ||
			thObj.particles ||
			"snow";
		const motionEnabled =
			localStorage.getItem(STORAGE_MOTION) !== null
				? localStorage.getItem(STORAGE_MOTION) !== "false"
				: init.motionEnabled !== undefined
					? init.motionEnabled
					: thObj.motionBreathing !== false;
		const blinkEnabled =
			localStorage.getItem(STORAGE_BLINK) !== null
				? localStorage.getItem(STORAGE_BLINK) !== "false"
				: init.blinkEnabled !== undefined
					? init.blinkEnabled
					: true;
		const irisEnabled =
			localStorage.getItem(STORAGE_IRIS) !== null
				? localStorage.getItem(STORAGE_IRIS) !== "false"
				: init.irisEnabled !== undefined
					? init.irisEnabled
					: true;
		const bootMode =
			localStorage.getItem(STORAGE_BOOT_MODE) || init.bootMode || "interactive";
		const bootSound =
			localStorage.getItem(STORAGE_BOOT_SOUND) !== null
				? localStorage.getItem(STORAGE_BOOT_SOUND) !== "false"
				: init.bootSound !== undefined
					? init.bootSound
					: true;
		const operatorName =
			localStorage.getItem(STORAGE_OP_NAME) || init.operatorName || "SENSEI";
		const operatorUid =
			localStorage.getItem(STORAGE_OP_UID) || init.operatorUid || "0042";
		const greetingText =
			localStorage.getItem(STORAGE_GREETING) !== null
				? localStorage.getItem(STORAGE_GREETING)
				: init.greetingText !== undefined
					? init.greetingText
					: thObj.defaultGreeting ||
						"Tawa đã sẵn sàng rồi, hôm nay sensei muốn code gì nào";
		const hasCustomVideo = localStorage.getItem(STORAGE_HAS_VIDEO) === "true";

		return {
			themeName,
			bubbleName,
			inputStyle,
			dimming: Number.isFinite(dimming) ? dimming : defaultDim,
			wpEnabled,
			customWp,
			particles,
			motionEnabled,
			blinkEnabled,
			irisEnabled,
			bootMode,
			bootSound,
			operatorName,
			operatorUid,
			greetingText,
			hasCustomVideo,
		};
	}

	function persistState(st, overrides = {}) {
		try {
			localStorage.setItem(STORAGE_THEME, st.themeName);
			localStorage.setItem(STORAGE_BUBBLE, st.bubbleName);
			localStorage.setItem(STORAGE_INPUT, st.inputStyle);
			localStorage.setItem(STORAGE_DIMMING, String(st.dimming));
			localStorage.setItem(STORAGE_WP_ENABLED, String(st.wpEnabled));
			localStorage.setItem(STORAGE_PARTICLES, st.particles);
			localStorage.setItem(STORAGE_MOTION, String(st.motionEnabled));
			localStorage.setItem(STORAGE_BLINK, String(st.blinkEnabled));
			localStorage.setItem(STORAGE_IRIS, String(st.irisEnabled));
			localStorage.setItem(STORAGE_BOOT_MODE, st.bootMode);
			localStorage.setItem(STORAGE_BOOT_SOUND, String(st.bootSound));
			localStorage.setItem(STORAGE_OP_NAME, st.operatorName);
			localStorage.setItem(STORAGE_OP_UID, st.operatorUid);
			localStorage.setItem(STORAGE_GREETING, st.greetingText);
			localStorage.setItem(
				STORAGE_HAS_VIDEO,
				String(Boolean(st.hasCustomVideo)),
			);
			if (overrides.customWp !== undefined) {
				localStorage.setItem(STORAGE_CUSTOM_WP, overrides.customWp);
			}
		} catch (e) {}

		if (window.agySaveThemeConfig) {
			try {
				const toDisk = { ...st };
				if (toDisk.customWp && toDisk.customWp.length > 512 * 1024) {
					delete toDisk.customWp;
				}
				window.agySaveThemeConfig(JSON.stringify(toDisk));
			} catch (e) {}
		}
	}

	// --- Procedural Sci-Fi Crystal Audio Synth (Zero external MP3 bloat) ---
	let audioCtx = null;
	function playBootTone(kind) {
		const st = getState();
		if (!st.bootSound) return;
		try {
			const Ctx = window.AudioContext || window.webkitAudioContext;
			if (!Ctx) return;
			if (!audioCtx) audioCtx = new Ctx();
			if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
			const now = audioCtx.currentTime;

			const note = (freq, start, dur, gainVal = 0.055, type = "sine") => {
				const osc = audioCtx.createOscillator();
				const g = audioCtx.createGain();
				osc.type = type;
				osc.frequency.setValueAtTime(freq, now + start);
				g.gain.setValueAtTime(0.0001, now + start);
				g.gain.exponentialRampToValueAtTime(gainVal, now + start + 0.015);
				g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
				osc.connect(g);
				g.connect(audioCtx.destination);
				osc.start(now + start);
				osc.stop(now + start + dur + 0.02);
			};

			if (kind === "click") {
				note(740, 0, 0.09, 0.05, "triangle");
				note(1108.7, 0.035, 0.14, 0.045, "sine");
			} else if (kind === "scan") {
				[587.3, 739.9, 880, 1174.6].forEach((f, idx) =>
					note(f, idx * 0.065, 0.16, 0.035, "sine"),
				);
			} else if (kind === "verify") {
				note(659.25, 0, 0.22, 0.045, "sine");
				note(987.77, 0.08, 0.3, 0.05, "sine");
			} else if (kind === "welcome") {
				[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, idx) =>
					note(f, idx * 0.055, 0.48, 0.045, "sine"),
				);
			}
		} catch (_) {}
	}

	// --- Pre-bake L-shaped header/sidebar glass blur once per theme/dimming change (Zero Live Blur!) ---
	function syncPrebakedGlass(wpUrl, overlayRgb, overlayAlpha, tintBg, blurStr) {
		const shell = document.querySelector(".agy-shell");
		if (!wpUrl) {
			if (shell) shell.style.removeProperty("--agy-l-glass-bg");
			return;
		}
		const key = `${wpUrl.slice(0, 64)}|${wpUrl.length}|${overlayRgb}|${overlayAlpha.toFixed(3)}|${tintBg}|${blurStr}`;
		window.__AGY_BLUR_CACHE__ = window.__AGY_BLUR_CACHE__ || {};
		const cached = window.__AGY_BLUR_CACHE__[key];
		if (cached) {
			if (shell)
				shell.style.setProperty("--agy-l-glass-bg", 'url("' + cached + '")');
			return;
		}
		const img = new Image();
		img.onload = () => {
			try {
				const w = 640;
				const h = Math.max(
					180,
					Math.round(
						(img.naturalHeight || 1440) * (w / (img.naturalWidth || 2560)),
					),
				);
				const canvas = document.createElement("canvas");
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;
				const pxMatch = String(blurStr || "3px").match(/(\d+(?:\.\d+)?)/);
				const scaledBlur = Math.max(
					1,
					Math.min(
						8,
						Math.round((pxMatch ? parseFloat(pxMatch[1]) : 3) * 0.75),
					),
				);
				ctx.filter = `blur(${scaledBlur}px)`;
				ctx.drawImage(img, -12, -12, w + 24, h + 24);
				ctx.filter = "none";
				ctx.fillStyle = `rgba(${overlayRgb}, ${overlayAlpha})`;
				ctx.fillRect(0, 0, w, h);
				if (tintBg) {
					ctx.fillStyle = tintBg;
					ctx.fillRect(0, 0, w, h);
				}
				const baked = canvas.toDataURL("image/webp", 0.85);
				window.__AGY_BLUR_CACHE__[key] = baked;
				const curShell = document.querySelector(".agy-shell");
				if (curShell)
					curShell.style.setProperty(
						"--agy-l-glass-bg",
						'url("' + baked + '")',
					);
			} catch (e) {}
		};
		img.src = wpUrl;
	}

	// --- Live Wallpaper, Eye-Blink & 60fps Snow/Starlight Particle Stage ---
	let particleRaf = 0;
	let particleModeActive = "off";
	let particlesPool = [];
	let blinkTimer = 0;
	let blinkResetTimer = 0;
	let irisRaf = 0;
	let bootTimers = [];

	function stopParticleEngine() {
		if (particleRaf) {
			cancelAnimationFrame(particleRaf);
			particleRaf = 0;
		}
		particleModeActive = "off";
	}

	function stopBlinkEngine() {
		if (blinkTimer) {
			clearTimeout(blinkTimer);
			blinkTimer = 0;
		}
		if (blinkResetTimer) {
			clearTimeout(blinkResetTimer);
			blinkResetTimer = 0;
		}
	}

	function scheduleNextBlink() {
		stopBlinkEngine();
		const st = getState();
		const mainTheme = THEMES[st.themeName] || THEMES[DEFAULT_THEME_KEY];
		const blinkUrl =
			!st.customWp && !st.hasCustomVideo ? mainTheme.wallpaperBlink || "" : "";
		if (!st.wpEnabled || !st.blinkEnabled || !blinkUrl) return;

		const delay = 3400 + Math.random() * 3400;
		blinkTimer = setTimeout(() => {
			const blinkEl = document.getElementById("agy-live-blink");
			if (blinkEl && !document.hidden) {
				blinkEl.style.opacity = "1";
				const doDouble = Math.random() < 0.28;
				blinkResetTimer = setTimeout(() => {
					if (blinkEl) blinkEl.style.opacity = "0";
					if (doDouble) {
						setTimeout(() => {
							const b2 = document.getElementById("agy-live-blink");
							if (b2 && !document.hidden) {
								b2.style.opacity = "1";
								setTimeout(() => {
									if (b2) b2.style.opacity = "0";
									scheduleNextBlink();
								}, 125);
							} else {
								scheduleNextBlink();
							}
						}, 165);
					} else {
						scheduleNextBlink();
					}
				}, 135);
			} else {
				scheduleNextBlink();
			}
		}, delay);
	}

	function startParticleEngine(canvas, mode) {
		stopParticleEngine();
		if (!canvas || mode === "off") return;
		particleModeActive = mode;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			const w = canvas.clientWidth || window.innerWidth;
			const h = canvas.clientHeight || window.innerHeight;
			if (
				canvas.width !== Math.round(w * dpr) ||
				canvas.height !== Math.round(h * dpr)
			) {
				canvas.width = Math.round(w * dpr);
				canvas.height = Math.round(h * dpr);
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			}
			return { w, h };
		};

		const { w: initW, h: initH } = resize();
		const count = mode === "snow" ? 68 : 52;
		const palette =
			mode === "snow"
				? ["#ffffff", "#f8fafc", "#e0f2fe", "#f5d0fe", "#ddd6fe"]
				: ["#fef08a", "#38bdf8", "#c084fc", "#f8fafc"];

		particlesPool = Array.from({ length: count }, (_, idx) => ({
			x: Math.random() * initW,
			y: Math.random() * initH,
			r:
				mode === "snow" ? 1.2 + Math.random() * 3.4 : 0.8 + Math.random() * 2.1,
			vy:
				mode === "snow"
					? 0.38 + Math.random() * 1.05
					: -0.18 - Math.random() * 0.42,
			vx:
				mode === "snow"
					? -0.28 + Math.random() * 0.56
					: -0.15 + Math.random() * 0.3,
			phase: Math.random() * Math.PI * 2,
			sway: 0.35 + Math.random() * 0.85,
			alpha: 0.32 + Math.random() * 0.58,
			color: palette[idx % palette.length],
			crystal: mode === "snow" && idx % 9 === 0,
		}));

		let lastTs = performance.now();
		const step = (ts) => {
			if (
				!document.getElementById("agy-live-particles") ||
				particleModeActive !== mode
			) {
				stopParticleEngine();
				return;
			}
			particleRaf = requestAnimationFrame(step);
			if (document.hidden) {
				lastTs = ts;
				return;
			}
			const dt = Math.min(2.2, Math.max(0.4, (ts - lastTs) / 16.667));
			lastTs = ts;

			const { w, h } = resize();
			ctx.clearRect(0, 0, w, h);

			for (let i = 0; i < particlesPool.length; i++) {
				const p = particlesPool[i];
				p.phase += 0.016 * dt;
				p.x += (p.vx + Math.sin(p.phase) * p.sway * 0.42) * dt;
				p.y += p.vy * dt;

				if (mode === "snow") {
					if (p.y > h + 12) {
						p.y = -10;
						p.x = Math.random() * w;
					}
				} else {
					if (p.y < -12) {
						p.y = h + 10;
						p.x = Math.random() * w;
					}
				}
				if (p.x > w + 12) p.x = -10;
				if (p.x < -12) p.x = w + 10;

				const twinkle =
					mode === "stars"
						? p.alpha * (0.45 + 0.55 * Math.sin(p.phase * 2.1))
						: p.alpha * (0.78 + 0.22 * Math.sin(p.phase));

				ctx.save();
				ctx.globalAlpha = Math.max(0.05, Math.min(0.95, twinkle));
				if (p.crystal) {
					ctx.translate(p.x, p.y);
					ctx.rotate(p.phase * 0.35);
					ctx.strokeStyle = p.color;
					ctx.lineWidth = 1.05;
					const arm = p.r * 1.9;
					for (let k = 0; k < 3; k++) {
						ctx.beginPath();
						ctx.moveTo(-arm, 0);
						ctx.lineTo(arm, 0);
						ctx.stroke();
						ctx.rotate(Math.PI / 3);
					}
				} else {
					ctx.fillStyle = p.color;
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
					ctx.fill();
					if (p.r > 2.4) {
						ctx.globalAlpha *= 0.26;
						ctx.beginPath();
						ctx.arc(p.x, p.y, p.r * 2.3, 0, Math.PI * 2);
						ctx.fill();
					}
				}
				ctx.restore();
			}
		};

		particleRaf = requestAnimationFrame(step);
	}

	async function syncLiveStage(stOverride) {
		const shell = document.querySelector(".agy-shell");
		if (!shell) return;
		const st = stOverride || getState();
		const mainTheme = THEMES[st.themeName] || THEMES[DEFAULT_THEME_KEY];
		const wpUrl = st.customWp || mainTheme.wallpaper || "";
		const blinkUrl =
			!st.customWp && !st.hasCustomVideo ? mainTheme.wallpaperBlink || "" : "";

		if (!st.wpEnabled) {
			const existing = document.getElementById("agy-live-stage");
			if (existing) existing.remove();
			stopParticleEngine();
			stopBlinkEngine();
			return;
		}

		let stage = document.getElementById("agy-live-stage");
		if (!stage) {
			stage = document.createElement("div");
			stage.id = "agy-live-stage";
			stage.innerHTML = `
        <div id="agy-live-mover">
          <div id="agy-live-base"></div>
          <div id="agy-live-blink"></div>
          <video id="agy-live-video" muted loop playsinline autoplay></video>
        </div>
        <div id="agy-live-scrim"></div>
        <canvas id="agy-live-particles"></canvas>
      `;
			shell.insertBefore(stage, shell.firstChild);
		} else if (stage.parentElement !== shell) {
			shell.insertBefore(stage, shell.firstChild);
		}

		const mover = stage.querySelector("#agy-live-mover");
		const baseEl = stage.querySelector("#agy-live-base");
		const blinkEl = stage.querySelector("#agy-live-blink");
		const videoEl = stage.querySelector("#agy-live-video");
		const scrimEl = stage.querySelector("#agy-live-scrim");
		const canvasEl = stage.querySelector("#agy-live-particles");

		const bgPos = mainTheme.bgPosition || "center center";
		const overlayAlpha = mainTheme.clearBackdrop
			? Math.min(0.92, Math.max(0.0, ((st.dimming - 10) / 82) * 0.85))
			: Math.min(0.92, Math.max(0.12, (st.dimming / 100) * 0.78));
		const overlayRgb = mainTheme.overlayRgb || "10, 11, 26";
		const secondaryGlowStop = mainTheme.secondaryGlow
			? `, radial-gradient(circle at 22% 72%, ${mainTheme.secondaryGlow} 0%, transparent 55%)`
			: "";

		if (mover) {
			mover.style.animation =
				st.motionEnabled && !st.hasCustomVideo && wpUrl
					? "agyLiveFloat 16s ease-in-out infinite alternate"
					: "none";
		}

		if (baseEl) {
			if (wpUrl) {
				baseEl.style.backgroundImage = `url("${wpUrl}")`;
				baseEl.style.backgroundPosition = bgPos;
			} else {
				baseEl.style.backgroundImage = mainTheme.pureBg || "none";
				baseEl.style.backgroundPosition = "center center";
			}
		}

		if (blinkEl) {
			if (blinkUrl && st.blinkEnabled) {
				blinkEl.style.backgroundImage = `url("${blinkUrl}")`;
				blinkEl.style.backgroundPosition = bgPos;
				blinkEl.style.display = "block";
			} else {
				blinkEl.style.backgroundImage = "none";
				blinkEl.style.opacity = "0";
				blinkEl.style.display = "none";
			}
		}

		if (scrimEl) {
			scrimEl.style.background = wpUrl
				? `radial-gradient(circle at 74% 38%, ${mainTheme.glow} 0%, transparent 62%)${secondaryGlowStop}, linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha * 0.82}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%)`
				: "transparent";
		}

		if (videoEl) {
			if (st.hasCustomVideo) {
				if (!activeVideoObjectUrl) {
					const blob = await loadCustomVideoBlob();
					if (blob) {
						activeVideoObjectUrl = URL.createObjectURL(blob);
					}
				}
				if (activeVideoObjectUrl) {
					if (videoEl.getAttribute("src") !== activeVideoObjectUrl) {
						videoEl.setAttribute("src", activeVideoObjectUrl);
					}
					videoEl.style.display = "block";
					if (!document.hidden) videoEl.play().catch(() => {});
				} else {
					videoEl.style.display = "none";
				}
			} else {
				if (videoEl.getAttribute("src")) {
					videoEl.pause();
					videoEl.removeAttribute("src");
					videoEl.load();
				}
				videoEl.style.display = "none";
			}
		}

		if (canvasEl) {
			if (st.particles && st.particles !== "off") {
				canvasEl.style.display = "block";
				if (particleModeActive !== st.particles || !particleRaf) {
					startParticleEngine(canvasEl, st.particles);
				}
			} else {
				canvasEl.style.display = "none";
				stopParticleEngine();
			}
		}

		scheduleNextBlink();
	}

	// --- Real-Time Sobel Edge-Contour Sketch -> Expanding Circular Iris Reveal ---
	function computeSobelEdgesToCanvas(imgSource, targetCanvas) {
		const w = 1120;
		const srcW = imgSource.videoWidth || imgSource.naturalWidth || 1280;
		const srcH = imgSource.videoHeight || imgSource.naturalHeight || 720;
		const h = Math.max(360, Math.round(w * (srcH / srcW)));

		const off = document.createElement("canvas");
		off.width = w;
		off.height = h;
		const octx = off.getContext("2d", { willReadFrequently: true });
		if (!octx) return;

		octx.drawImage(imgSource, 0, 0, w, h);
		const srcData = octx.getImageData(0, 0, w, h).data;
		const outImg = octx.createImageData(w, h);
		const out = outImg.data;

		const lum = new Float32Array(w * h);
		for (let i = 0, p = 0; i < lum.length; i++, p += 4) {
			lum[i] =
				0.299 * srcData[p] + 0.587 * srcData[p + 1] + 0.114 * srcData[p + 2];
		}

		const mags = new Float32Array(w * h);
		const dirH = new Uint8Array(w * h);
		for (let y = 1; y < h - 1; y++) {
			const row = y * w;
			for (let x = 1; x < w - 1; x++) {
				const idx = row + x;
				const gx =
					-lum[idx - w - 1] +
					lum[idx - w + 1] +
					-2 * lum[idx - 1] +
					2 * lum[idx + 1] +
					-lum[idx + w - 1] +
					lum[idx + w + 1];
				const gy =
					-lum[idx - w - 1] -
					2 * lum[idx - w] -
					lum[idx - w + 1] +
					lum[idx + w - 1] +
					2 * lum[idx + w] +
					lum[idx + w + 1];
				mags[idx] = Math.sqrt(gx * gx + gy * gy);
				dirH[idx] = Math.abs(gx) >= Math.abs(gy) ? 1 : 0;
			}
		}

		for (let y = 2; y < h - 2; y++) {
			const row = y * w;
			for (let x = 2; x < w - 2; x++) {
				const idx = row + x;
				const mag = mags[idx];
				if (mag < 64) continue;
				const n1 = dirH[idx] ? mags[idx - 1] : mags[idx - w];
				const n2 = dirH[idx] ? mags[idx + 1] : mags[idx + w];
				if (mag >= n1 && mag >= n2) {
					const alpha = Math.min(245, Math.round(((mag - 64) / 150) * 235));
					const o = idx * 4;
					out[o] = 226;
					out[o + 1] = 232;
					out[o + 2] = 255;
					out[o + 3] = alpha;
				}
			}
		}

		targetCanvas.width = w;
		targetCanvas.height = h;
		const tctx = targetCanvas.getContext("2d");
		if (tctx) tctx.putImageData(outImg, 0, 0);
	}

	function triggerSketchIrisReveal(force = false) {
		const st = getState();
		if (!st.wpEnabled || (!st.irisEnabled && !force)) return;
		const shell = document.querySelector(".agy-shell");
		if (!shell) return;

		if (irisRaf) {
			cancelAnimationFrame(irisRaf);
			irisRaf = 0;
		}
		const oldVeil = document.getElementById("agy-sketch-veil");
		if (oldVeil) oldVeil.remove();

		const mainTheme = THEMES[st.themeName] || THEMES[DEFAULT_THEME_KEY];
		const wpUrl = st.customWp || mainTheme.wallpaper || "";
		const irisOrigin = mainTheme.irisOrigin || "54% 40%";

		const veil = document.createElement("div");
		veil.id = "agy-sketch-veil";
		veil.innerHTML = `<canvas id="agy-sketch-canvas"></canvas>`;

		const stage = document.getElementById("agy-live-stage");
		if (stage && stage.nextSibling) {
			shell.insertBefore(veil, stage.nextSibling);
		} else {
			shell.appendChild(veil);
		}

		const sketchCanvas = veil.querySelector("#agy-sketch-canvas");
		const startIrisSequence = () => {
			if (!veil.isConnected) return;
			sketchCanvas.style.opacity = "0.92";
			const holdMs = 680;
			const expandMs = 1180;
			const t0 = performance.now();

			const animate = (now) => {
				if (!veil.isConnected) return;
				const elapsed = now - t0;
				if (elapsed < holdMs) {
					const pulse =
						0.65 + 0.3 * Math.sin((elapsed / holdMs) * Math.PI * 0.5);
					sketchCanvas.style.opacity = pulse.toFixed(3);
					irisRaf = requestAnimationFrame(animate);
					return;
				}
				const t = Math.min(1, (elapsed - holdMs) / expandMs);
				const eased = 1 - Math.pow(1 - t, 3.2);
				const r = eased * 142;
				const feather1 = r + 3.8;
				const feather2 = r + 8.5;
				const maskStr = `radial-gradient(circle at ${irisOrigin}, transparent ${r.toFixed(2)}%, rgba(0,0,0,0.45) ${feather1.toFixed(2)}%, #000 ${feather2.toFixed(2)}%)`;
				veil.style.webkitMaskImage = maskStr;
				veil.style.maskImage = maskStr;

				if (t < 1) {
					irisRaf = requestAnimationFrame(animate);
				} else {
					veil.remove();
					irisRaf = 0;
				}
			};
			irisRaf = requestAnimationFrame(animate);
		};

		const liveVid = document.getElementById("agy-live-video");
		if (st.hasCustomVideo && liveVid && liveVid.readyState >= 2) {
			try {
				computeSobelEdgesToCanvas(liveVid, sketchCanvas);
			} catch (_) {}
			startIrisSequence();
		} else if (wpUrl) {
			const img = new Image();
			img.onload = () => {
				try {
					computeSobelEdgesToCanvas(img, sketchCanvas);
				} catch (_) {}
				startIrisSequence();
			};
			img.onerror = () => veil.remove();
			img.src = wpUrl;
		} else {
			startIrisSequence();
		}
	}

	// --- Empty-Conversation Center Hero Greeting ---
	function syncHeroGreeting() {
		const st = getState();
		const shell = document.querySelector(".agy-shell");
		if (
			!shell ||
			!st.wpEnabled ||
			!st.greetingText ||
			!st.greetingText.trim()
		) {
			const existing = document.getElementById("agy-hero-greeting");
			if (existing) existing.remove();
			return;
		}

		const composer = shell.querySelector(".surface-composer");
		const hasMessages = Boolean(
			shell.querySelector(
				'[data-testid="agent-response"], .agy-user-bubble, .group\\/user-input-step',
			),
		);
		const hasSplitOverlay = Boolean(
			shell.dataset.agyHoleActive || shell.dataset.agySideGlass,
		);
		const onCustomizationsOrSettings = Boolean(
			document.querySelector(".settings-modal-container") ||
				/customization|plugin|automation/i.test(
					location.pathname + location.search,
				),
		);

		let el = document.getElementById("agy-hero-greeting");
		if (
			!composer ||
			hasMessages ||
			hasSplitOverlay ||
			onCustomizationsOrSettings
		) {
			if (el) el.style.opacity = "0";
			return;
		}

		const cRect = composer.getBoundingClientRect();
		if (cRect.width < 120 || cRect.height < 20) {
			if (el) el.style.opacity = "0";
			return;
		}

		if (!el) {
			el = document.createElement("div");
			el.id = "agy-hero-greeting";
			shell.appendChild(el);
		}
		if (el.textContent !== st.greetingText) {
			el.textContent = st.greetingText;
		}
		el.style.opacity = "1";
	}

	// --- 6-Stage Tactical Sci-Fi Boot OS Overlay ---
	function clearBootTimers() {
		bootTimers.forEach((id) => clearTimeout(id));
		bootTimers = [];
	}

	function runBootSequence({ force = false } = {}) {
		const st = getState();
		if (!force) {
			if (st.bootMode === "off" || !st.wpEnabled) return;
			try {
				if (sessionStorage.getItem(SESSION_BOOT_DONE) === "1") return;
				sessionStorage.setItem(SESSION_BOOT_DONE, "1");
			} catch (_) {}
		}

		clearBootTimers();
		const existing = document.getElementById("agy-boot-overlay");
		if (existing) existing.remove();

		const modalBackdrop = document.getElementById(
			"agy-custom-theme-modal-backdrop",
		);
		if (modalBackdrop) modalBackdrop.style.display = "none";

		const autoMode = st.bootMode === "auto";
		let currentStage = 0;
		let bootSec = 1;
		let bootKeyHandler = null;
		let starRaf = 0;

		const overlay = document.createElement("div");
		overlay.id = "agy-boot-overlay";
		overlay.innerHTML = `
      <canvas id="agy-boot-stars"></canvas>
      <div style="position:absolute; inset:0; overflow:hidden; pointer-events:none;">
        <div id="agy-boot-sweep"></div>
      </div>

      <div id="agy-boot-hud-top" style="opacity:0; transition: opacity 0.4s ease;">
        <div>
          <div style="font-size:13px; font-weight:700; letter-spacing:0.18em; color:#ffffff;">ANTIGRAVITY</div>
          <div style="font-size:8.5px; letter-spacing:0.24em; color:rgba(148,163,184,0.72); margin-top:2px;">SYNTHESIZE INTELLIGENCE</div>
          <div id="agy-boot-clock" style="font-size:9px; letter-spacing:0.16em; color:#818cf8; margin-top:6px;">REV 2.26 • WEB PROFILE 00:00:01</div>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <button id="agy-boot-sound-btn" type="button" style="background:transparent; border:1px solid rgba(255,255,255,0.16); color:rgba(226,232,240,0.85); padding:4px 9px; border-radius:4px; font-size:10px; letter-spacing:0.14em; cursor:pointer;">
            ${st.bootSound ? "SFX : ON" : "SFX : MUTE"}
          </button>
          <button id="agy-boot-skip-btn" type="button" style="background:transparent; border:none; color:rgba(226,232,240,0.78); font-size:10.5px; letter-spacing:0.22em; cursor:pointer; padding:6px 4px;">
            SKIP ›
          </button>
        </div>
      </div>

      <div id="agy-boot-center"></div>

      <div id="agy-boot-hud-bottom" style="opacity:0; transition: opacity 0.4s ease;">
        <div style="display:flex; align-items:center; gap:8px; min-width:220px;">
          <span class="agy-eq-bars"><i></i><i></i><i></i></span>
          <span id="agy-boot-step-label" style="font-size:9.5px; letter-spacing:0.18em; color:rgba(203,213,225,0.78);">[ 01 / 06 ] AUTHORIZATION</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; width:340px; max-width:44vw; position:relative;">
          <div style="width:100%; height:1.5px; background:rgba(255,255,255,0.14); position:relative;">
            <div id="agy-boot-bar-fill" style="width:16%; height:100%; background:#ffffff; box-shadow:0 0 8px rgba(255,255,255,0.8); transition: width 0.42s cubic-bezier(0.22,1,0.36,1);"></div>
            <div id="agy-boot-neko" style="position:absolute; top:-24px; left:16%; transform:translateX(-50%); transition:left 0.42s cubic-bezier(0.22,1,0.36,1); animation:agyNekoHop 0.9s ease-in-out infinite alternate;">
              ${MINI_NEKO_SVG}
            </div>
          </div>
          <div id="agy-boot-status-mid" style="font-size:9px; letter-spacing:0.22em; color:rgba(148,163,184,0.82); margin-top:8px;">AWAITING OPERATOR CONSENT</div>
        </div>
        <div style="min-width:220px; text-align:right; font-size:9.5px; letter-spacing:0.18em; color:rgba(148,163,184,0.75);">
          ID CONFIRMED : <span style="color:#e2e8f0;">${st.operatorUid}</span>
        </div>
      </div>
    `;
		document.body.appendChild(overlay);

		// Subtle cosmic starfield background inside boot screen
		const starCanvas = overlay.querySelector("#agy-boot-stars");
		if (starCanvas) {
			const sctx = starCanvas.getContext("2d");
			const sw = (starCanvas.width = window.innerWidth);
			const sh = (starCanvas.height = window.innerHeight);
			const bootStars = Array.from({ length: 120 }, () => ({
				x: Math.random() * sw,
				y: Math.random() * sh,
				r: 0.5 + Math.random() * 1.5,
				a: 0.15 + Math.random() * 0.7,
				p: Math.random() * Math.PI * 2,
				warm: Math.random() < 0.25,
			}));
			const drawBootStars = () => {
				if (!overlay.isConnected) return;
				starRaf = requestAnimationFrame(drawBootStars);
				if (!sctx) return;
				sctx.clearRect(0, 0, sw, sh);
				const grad = sctx.createRadialGradient(
					sw * 0.56,
					sh * 0.44,
					10,
					sw * 0.56,
					sh * 0.44,
					sw * 0.52,
				);
				grad.addColorStop(0, "rgba(38, 30, 56, 0.22)");
				grad.addColorStop(0.6, "rgba(15, 18, 34, 0.10)");
				grad.addColorStop(1, "rgba(3, 4, 8, 0)");
				sctx.fillStyle = grad;
				sctx.fillRect(0, 0, sw, sh);
				for (const s of bootStars) {
					s.p += 0.02;
					sctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(s.p));
					sctx.fillStyle = s.warm ? "#fde68a" : "#e2e8f0";
					sctx.beginPath();
					sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
					sctx.fill();
				}
			};
			starRaf = requestAnimationFrame(drawBootStars);
		}

		const clockInterval = setInterval(() => {
			if (!overlay.isConnected) {
				clearInterval(clockInterval);
				return;
			}
			bootSec++;
			const clockEl = overlay.querySelector("#agy-boot-clock");
			if (clockEl) {
				const secStr = String(bootSec % 60).padStart(2, "0");
				const minStr = String(Math.floor(bootSec / 60)).padStart(2, "0");
				clockEl.textContent = `REV 2.26 • WEB PROFILE 00:${minStr}:${secStr}`;
			}
		}, 1000);

		const finishBoot = (withIris = true) => {
			clearBootTimers();
			clearInterval(clockInterval);
			if (starRaf) cancelAnimationFrame(starRaf);
			if (bootKeyHandler)
				window.removeEventListener("keydown", bootKeyHandler, true);
			overlay.style.transition =
				"opacity 0.48s ease, background-color 0.3s ease";
			overlay.style.backgroundColor = "#e2e8f0";
			overlay.style.opacity = "0";
			setTimeout(() => {
				if (overlay.isConnected) overlay.remove();
			}, 500);
			if (withIris) {
				triggerSketchIrisReveal(true);
			}
		};

		overlay
			.querySelector("#agy-boot-skip-btn")
			.addEventListener("click", () => {
				playBootTone("click");
				finishBoot(true);
			});

		const soundBtn = overlay.querySelector("#agy-boot-sound-btn");
		soundBtn.addEventListener("click", () => {
			const cur = getState();
			const nextSound = !cur.bootSound;
			persistState({ ...cur, bootSound: nextSound });
			soundBtn.textContent = nextSound ? "SFX : ON" : "SFX : MUTE";
			if (nextSound) playBootTone("click");
		});

		const center = overlay.querySelector("#agy-boot-center");
		const topHud = overlay.querySelector("#agy-boot-hud-top");
		const botHud = overlay.querySelector("#agy-boot-hud-bottom");
		const stepLbl = overlay.querySelector("#agy-boot-step-label");
		const midLbl = overlay.querySelector("#agy-boot-status-mid");
		const barFill = overlay.querySelector("#agy-boot-bar-fill");
		const nekoEl = overlay.querySelector("#agy-boot-neko");

		const setHudProgress = (stepStr, midStr, pct) => {
			if (stepLbl) stepLbl.textContent = stepStr;
			if (midLbl) midLbl.textContent = midStr;
			if (barFill) barFill.style.width = pct + "%";
			if (nekoEl) nekoEl.style.left = pct + "%";
		};

		const goStage = (stage) => {
			clearBootTimers();
			currentStage = stage;

			if (stage === 0) {
				center.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; animation:agyBootFadeIn 0.55s ease;">
            ${AGY_LOGO_SVG(46)}
            <div style="margin-top:16px; font-size:13.5px; font-weight:600; letter-spacing:0.34em; color:#f8fafc;">ANTIGRAVITY</div>
            <div style="margin-top:5px; font-size:8px; letter-spacing:0.28em; color:rgba(148,163,184,0.68);">SYNTHESIZED INTELLIGENCE</div>
          </div>
        `;
				bootTimers.push(setTimeout(() => goStage(1), 1350));
			} else if (stage === 1) {
				topHud.style.opacity = "1";
				botHud.style.opacity = "1";
				setHudProgress(
					"[ 01 / 06 ] AUTHORIZATION",
					"AWAITING OPERATOR CONSENT",
					18,
				);
				center.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; animation:agyBootFadeIn 0.35s ease;">
            <div style="font-size:22px; font-weight:400; letter-spacing:0.18em; color:#f8fafc;">YÊU CẦU QUYỀN TRUY CẬP</div>
            <div style="font-size:9.5px; letter-spacing:0.28em; color:rgba(148,163,184,0.75); margin-top:10px;">ACCESS PERMISSION REQUIRED</div>
            <button id="agy-boot-action-btn" type="button" class="agy-boot-tactical-btn" style="margin-top:32px;">
              <span>CẤP QUYỀN</span>
              <span style="opacity:0.45; margin:0 8px;">·</span>
              <span>GRANT ACCESS</span>
            </button>
            <div style="font-size:9.5px; letter-spacing:0.14em; color:rgba(148,163,184,0.52); margin-top:16px;">
              Nhấn Enter / Space hoặc bấm nút để tiếp tục
            </div>
          </div>
        `;
				const btn = center.querySelector("#agy-boot-action-btn");
				btn.addEventListener("click", () => {
					playBootTone("click");
					goStage(2);
				});
				if (autoMode) {
					bootTimers.push(
						setTimeout(() => {
							playBootTone("click");
							goStage(2);
						}, 850),
					);
				}
			} else if (stage === 2) {
				setHudProgress(
					"[ 02 / 06 ] IDENTITY CHECK",
					`UID ${st.operatorUid} / LEVEL ∞ READY`,
					38,
				);
				center.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; animation:agyBootFadeIn 0.35s ease;">
            <div style="font-size:22px; font-weight:400; letter-spacing:0.18em; color:#f8fafc;">XÁC MINH DANH TÍNH</div>
            <div style="font-size:9.5px; letter-spacing:0.28em; color:rgba(148,163,184,0.75); margin-top:10px;">IDENTITY VERIFICATION</div>

            <div style="margin-top:28px; width:310px; display:flex; flex-direction:column; gap:10px; font-size:10.5px; letter-spacing:0.14em;">
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:5px;">
                <span style="color:rgba(148,163,184,0.68);">TÊN TRUY CẬP / OPERATOR</span>
                <span style="color:#ffffff; font-weight:700;">${st.operatorName}</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:5px;">
                <span style="color:rgba(148,163,184,0.68);">MÃ ĐỊNH DANH / UID</span>
                <span style="color:#ffffff; font-weight:700;">${st.operatorUid}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:rgba(148,163,184,0.68);">CẤP QUYỀN / LEVEL</span>
                <span style="color:#c084fc; font-weight:700;">∞</span>
              </div>
            </div>

            <button id="agy-boot-action-btn" type="button" class="agy-boot-tactical-btn" style="margin-top:28px;">
              <span>XÁC NHẬN</span>
              <span style="opacity:0.45; margin:0 8px;">·</span>
              <span>CONFIRM IDENTITY</span>
            </button>
            <div style="font-size:9.5px; letter-spacing:0.14em; color:rgba(148,163,184,0.52); margin-top:16px;">
              Nhấn Enter / Space hoặc bấm nút để xác nhận
            </div>
          </div>
        `;
				const btn = center.querySelector("#agy-boot-action-btn");
				btn.addEventListener("click", () => {
					playBootTone("scan");
					goStage(3);
				});
				if (autoMode) {
					bootTimers.push(
						setTimeout(() => {
							playBootTone("scan");
							goStage(3);
						}, 900),
					);
				}
			} else if (stage === 3) {
				setHudProgress(
					"[ 04 / 06 ] PERMISSION STREAM",
					"STREAMING CLEARANCE KEYS",
					66,
				);
				center.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; width:100%; animation:agyBootFadeIn 0.3s ease;">
            <div id="agy-stream-title" style="font-size:21px; font-weight:400; letter-spacing:0.18em; color:#f8fafc;">ĐANG TIẾP NHẬN YÊU CẦU</div>
            <div id="agy-stream-sub" style="font-size:9.5px; letter-spacing:0.28em; color:rgba(148,163,184,0.75); margin-top:9px;">ACCESS REQUEST RECEIVED</div>
            <div style="margin-top:28px; animation:agyLogoPulse 1.2s ease-in-out infinite alternate;">
              ${AGY_LOGO_SVG(54)}
            </div>
            <div style="margin-top:16px; font-size:8.5px; letter-spacing:0.38em; color:rgba(148,163,184,0.55);">A N T I G R A V I T Y</div>
            <div style="position:fixed; right:36px; top:44%; display:flex; flex-direction:column; gap:5px; font-size:8.5px; letter-spacing:0.16em; color:rgba(148,163,184,0.48); text-align:right;">
              <div>0xC002 :: READ</div>
              <div>0xE847 :: READ</div>
              <div>0x1A19 :: READ</div>
              <div>0xB851 :: READ</div>
              <div>0x9C06 :: READ</div>
              <div>0xAA23 :: READ</div>
            </div>
          </div>
        `;
				bootTimers.push(
					setTimeout(() => {
						const tEl = center.querySelector("#agy-stream-title");
						const sEl = center.querySelector("#agy-stream-sub");
						if (tEl) tEl.textContent = "BẮT ĐẦU ĐỌC QUYỀN HẠN";
						if (sEl) sEl.textContent = "PERMISSION READ STARTED";
					}, 620),
				);
				bootTimers.push(
					setTimeout(() => {
						playBootTone("verify");
						goStage(4);
					}, 1450),
				);
			} else if (stage === 4) {
				setHudProgress("[ 05 / 06 ] VERIFY", "PERMISSION AUTHORIZED", 86);
				center.innerHTML = `
          <div style="position:relative; width:250px; height:250px; display:flex; align-items:center; justify-content:center; animation:agyBootFadeIn 0.3s ease;">
            <svg width="250" height="250" viewBox="0 0 250 250" style="position:absolute; inset:0; animation:agyOrbitSpin 5.5s linear infinite;">
              <circle cx="125" cy="125" r="106" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 6" fill="none"/>
              <path d="M 125 19 A 106 106 0 0 1 231 125" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
              <path d="M 165 223 A 106 106 0 0 1 19 125" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
              <circle cx="231" cy="125" r="3.5" fill="#ffffff"/>
            </svg>
            <div style="text-align:center; z-index:2;">
              <div style="font-size:13.5px; letter-spacing:0.18em; color:#ffffff;">HOÀN TẤT · ĐÃ XÁC THỰC</div>
              <div style="font-size:8.5px; letter-spacing:0.24em; color:rgba(148,163,184,0.72); margin-top:7px;">READ COMPLETE · VERIFIED</div>
            </div>
          </div>
        `;
				bootTimers.push(
					setTimeout(() => {
						playBootTone("welcome");
						goStage(5);
					}, 1200),
				);
			} else if (stage === 5) {
				setHudProgress(
					"[ 06 / 06 ] WELCOME",
					`${st.operatorName} SESSION ACTIVE`,
					100,
				);
				center.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; animation:agyBootFadeIn 0.38s ease;">
            <div style="font-size:11px; font-weight:600; letter-spacing:0.28em; color:rgba(226,232,240,0.88);">WELCOME TO</div>
            <div style="margin-top:12px; background:#ffffff; color:#030408; padding:7px 26px; font-size:15px; font-weight:800; letter-spacing:0.26em; box-shadow:0 0 28px rgba(255,255,255,0.35);">
              ANTIGRAVITY
            </div>
            <div style="margin-top:24px;">
              ${AGY_LOGO_SVG(34)}
            </div>
            <div style="margin-top:14px; font-size:8.5px; letter-spacing:0.38em; color:rgba(148,163,184,0.55);">A N T I G R A V I T Y</div>
            <div style="margin-top:12px; font-size:9.5px; letter-spacing:0.22em; color:rgba(203,213,225,0.85);">
              CHÀO MỪNG ${st.operatorName} • SESSION READY
            </div>
          </div>
        `;
				bootTimers.push(setTimeout(() => finishBoot(true), 1280));
			}
		};

		bootKeyHandler = (e) => {
			if (!overlay.isConnected) return;
			if (e.key === "Escape") {
				e.preventDefault();
				e.stopPropagation();
				playBootTone("click");
				finishBoot(true);
			} else if (
				(e.key === "Enter" || e.key === " ") &&
				(currentStage === 1 || currentStage === 2)
			) {
				e.preventDefault();
				e.stopPropagation();
				if (currentStage === 1) {
					playBootTone("click");
					goStage(2);
				} else {
					playBootTone("scan");
					goStage(3);
				}
			}
		};
		window.addEventListener("keydown", bootKeyHandler, true);

		goStage(0);
	}

	// --- Main Theme Application ---
	function applyTheme(overrides = {}) {
		const prevTheme = getState().themeName;
		const st = { ...getState(), ...overrides };
		if (
			overrides.themeName &&
			overrides.themeName !== prevTheme &&
			overrides.dimming === undefined
		) {
			st.dimming = overrides.themeName === "Tawa Winter Live" ? 30 : 69;
			if (
				THEMES[overrides.themeName] &&
				THEMES[overrides.themeName].particles
			) {
				st.particles = THEMES[overrides.themeName].particles;
			}
			if (
				THEMES[overrides.themeName] &&
				THEMES[overrides.themeName].defaultGreeting
			) {
				st.greetingText = THEMES[overrides.themeName].defaultGreeting;
			}
		}
		persistState(st, overrides);

		const mainTheme = THEMES[st.themeName] || THEMES[DEFAULT_THEME_KEY];
		const bubbleTheme = THEMES[st.bubbleName] || mainTheme;
		const wpUrl = st.customWp || mainTheme.wallpaper || "";

		const oldLegacy = document.getElementById("antigravity-ho-ly-chibi-theme");
		if (oldLegacy) oldLegacy.remove();

		let styleEl = document.getElementById("antigravity-custom-theme-active");
		if (!styleEl) {
			styleEl = document.createElement("style");
			styleEl.id = "antigravity-custom-theme-active";
			document.head.appendChild(styleEl);
		}

		const overlayAlpha = mainTheme.clearBackdrop
			? Math.min(0.92, Math.max(0.0, ((st.dimming - 10) / 82) * 0.85))
			: Math.min(0.92, Math.max(0.12, (st.dimming / 100) * 0.78));
		const overlayRgb = mainTheme.overlayRgb || "10, 11, 26";
		const bgPosition = mainTheme.bgPosition || "center center";
		const secondaryGlowStop = mainTheme.secondaryGlow
			? `, radial-gradient(circle at 22% 72%, ${mainTheme.secondaryGlow} 0%, transparent 55%)`
			: "";

		let bgLayers = "";
		if (wpUrl) {
			bgLayers = mainTheme.clearBackdrop
				? `linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%), url("${wpUrl}")`
				: `radial-gradient(circle at 75% 40%, ${mainTheme.glow} 0%, transparent 65%)${secondaryGlowStop}, linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha * 0.85}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%), url("${wpUrl}")`;
		} else {
			bgLayers =
				mainTheme.pureBg ||
				`radial-gradient(circle at 75% 30%, ${mainTheme.glow} 0%, transparent 60%), linear-gradient(160deg, rgba(${overlayRgb}, 0.96) 0%, #070910 100%)`;
		}

		const wpCss = st.wpEnabled
			? `
      @keyframes agyLiveFloat {
        0% { transform: scale(1.032) translate3d(-0.6%, -0.5%, 0); }
        50% { transform: scale(1.045) translate3d(0.5%, 0.4%, 0); }
        100% { transform: scale(1.034) translate3d(-0.3%, 0.6%, 0); }
      }
      @keyframes agyBootFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes agyOrbitSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes agyLogoPulse {
        from { transform: scale(0.96); filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.35)); }
        to { transform: scale(1.04); filter: drop-shadow(0 0 20px rgba(192, 132, 252, 0.65)); }
      }
      @keyframes agyNekoHop {
        from { transform: translateX(-50%) translateY(0px); }
        to { transform: translateX(-50%) translateY(-3px); }
      }
      @keyframes agySweepBeam {
        0% { transform: translateX(-120%) rotate(25deg); opacity: 0; }
        25% { opacity: 0.55; }
        65% { transform: translateX(220%) rotate(25deg); opacity: 0; }
        100% { transform: translateX(220%) rotate(25deg); opacity: 0; }
      }
      @keyframes agyEqBounce {
        0%, 100% { transform: scaleY(0.35); }
        50% { transform: scaleY(1); }
      }

      .agy-shell {
        background-image: ${bgLayers} !important;
        background-size: cover !important;
        background-position: ${bgPosition} !important;
        background-repeat: no-repeat !important;
        image-rendering: auto !important;
      }
      #agy-live-stage {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
      }
      #agy-live-mover {
        position: absolute;
        inset: -2.5%;
        will-change: transform;
      }
      #agy-live-base,
      #agy-live-blink {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-repeat: no-repeat;
      }
      #agy-live-blink {
        opacity: 0;
        transition: opacity 70ms ease-in-out;
      }
      #agy-live-video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: none;
      }
      #agy-live-scrim {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      #agy-live-particles {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      #agy-sketch-veil {
        position: absolute;
        inset: 0;
        z-index: 1;
        background: #060812;
        pointer-events: none;
        overflow: hidden;
      }
      #agy-sketch-canvas {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 0.28s ease;
        filter: drop-shadow(0 0 3px rgba(192, 132, 252, 0.45));
      }
      #agy-hero-greeting {
        position: absolute;
        z-index: 4;
        left: calc(var(--agy-sidebar-w, 256px) + (100% - var(--agy-sidebar-w, 256px)) * 0.5);
        top: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        color: #ffffff;
        font-size: 21px;
        font-weight: 500;
        letter-spacing: -0.01em;
        text-align: center;
        white-space: nowrap;
        max-width: 82%;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 2px 16px rgba(0, 0, 0, 0.92), 0 0 28px rgba(10, 11, 26, 0.85);
        transition: opacity 0.22s ease;
      }

      /* Boot OS Overlay Styling */
      #agy-boot-overlay {
        position: fixed;
        inset: 0;
        z-index: 99995;
        background: #030408;
        color: #f8fafc;
        font-family: ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'Segoe UI', system-ui, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        overflow: hidden;
      }
      #agy-boot-stars {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      #agy-boot-sweep {
        position: absolute;
        top: -40%;
        left: -20%;
        width: 18%;
        height: 180%;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.09) 50%, transparent 100%);
        pointer-events: none;
        animation: agySweepBeam 4.5s ease-in-out infinite;
      }
      #agy-boot-hud-top {
        position: absolute;
        top: 24px;
        left: 28px;
        right: 28px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        z-index: 3;
      }
      #agy-boot-hud-bottom {
        position: absolute;
        bottom: 24px;
        left: 28px;
        right: 28px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        z-index: 3;
      }
      #agy-boot-center {
        position: relative;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }
      .agy-boot-tactical-btn {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.32);
        color: #ffffff;
        padding: 11px 28px;
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: 0.20em;
        cursor: pointer;
        transition: all 0.18s ease;
      }
      .agy-boot-tactical-btn:hover {
        background: #ffffff;
        color: #030408;
        box-shadow: 0 0 24px rgba(255, 255, 255, 0.35);
      }
      .agy-eq-bars {
        display: inline-flex;
        align-items: flex-end;
        gap: 2px;
        height: 10px;
      }
      .agy-eq-bars i {
        display: block;
        width: 2px;
        height: 10px;
        background: #60a5fa;
        transform-origin: bottom;
        animation: agyEqBounce 0.8s ease-in-out infinite;
      }
      .agy-eq-bars i:nth-child(2) { animation-delay: 0.2s; background: #c084fc; }
      .agy-eq-bars i:nth-child(3) { animation-delay: 0.4s; }

      /* Keep transparent scrollers on GPU composited-scrolling layers */
      .agy-shell .overflow-y-auto {
        will-change: scroll-position;
      }
      .agy-sheet,
      .agy-inset-shell,
      .browser-hole-opaque,
      [data-main-content-body="true"],
      [data-side-panel-body="true"],
      [class*="agy-inset-shell"],
      [class*="--shell-canvas"],
      .agy-shell div.absolute.bottom-0.pointer-events-none,
      .agy-shell [class*="z-50"] .pointer-events-none.right-full,
      .agy-shell .bg-background:not(.settings-modal-container):not(.settings-modal-container *):not(#agy-custom-theme-modal-backdrop *) {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      /* Browser split-pane hole cutout: clip live stage, sketch veil, and ::after outside [data-browser-hole] */
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] #agy-live-stage,
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] #agy-sketch-veil {
        clip-path: var(--agy-hole-clip, none) !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"]::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image: ${bgLayers};
        background-size: cover;
        background-position: ${bgPosition};
        background-repeat: no-repeat;
        clip-path: var(--agy-hole-clip, none);
        will-change: transform;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] > :not(#agy-live-stage):not(#agy-sketch-veil):not([data-has-browser-hole="true"]):not([data-browser-hole]:not([data-browser-hole="false"])):not(.settings-modal-container),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] .browser-hole-opaque:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-pane-id]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-tiling-pane]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-main-content-header]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-side-panel-strip]:not([data-has-browser-hole="true"]) {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] :is([data-main-content-body], [data-side-panel-body]):not([data-has-browser-hole="true"]) {
        box-shadow: none !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-split-sash] {
        background: rgba(192, 132, 252, 0.20) !important;
        background-image: none !important;
      }
    `
			: `
      .agy-shell {
        background: #111113 !important;
      }
    `;

		const defaultCornerSvg =
			"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M2 20 L2 6 Q2 2 6 2 L20 2' stroke='%23fbbf24' stroke-width='1.5' fill='none' opacity='0.65'/%3E%3Ccircle cx='6' cy='6' r='2' fill='%23fbbf24' opacity='0.75'/%3E%3C/svg%3E";
		const cornerFiligreeUrl = bubbleTheme.cornerSvg || defaultCornerSvg;

		const bubbleStickerCss = bubbleTheme.sticker
			? bubbleTheme.isOrnament
				? `
      .group\\/user-input-step {
        padding-top: 18px !important;
      }
      .agy-user-bubble-frame::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop}px;
        right: ${bubbleTheme.stickerRight}px;
        width: ${bubbleTheme.stickerW}px;
        height: ${bubbleTheme.stickerH}px;
        background-image: url("${bubbleTheme.sticker}");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 25;
        pointer-events: none;
        transition: transform 0.2s ease;
      }
    `
				: `
      .group\\/user-input-step {
        padding-top: ${Math.max(36, Math.abs(bubbleTheme.stickerTop) + 8)}px !important;
      }
      .agy-user-bubble-frame::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop}px;
        right: ${bubbleTheme.stickerRight}px;
        width: ${bubbleTheme.stickerW}px;
        height: ${bubbleTheme.stickerH}px;
        background-image: url("${bubbleTheme.sticker}");
        background-size: contain;
        background-position: bottom center;
        background-repeat: no-repeat;
        z-index: 25;
        pointer-events: none;
        transition: transform 0.2s ease;
      }
    `
			: `
      .agy-user-bubble-frame::before { display: none !important; }
    `;

		const showInputSticker = st.inputStyle !== "minimal" && bubbleTheme.sticker;
		const inputStickerCss = showInputSticker
			? bubbleTheme.isOrnament
				? `
      .surface-composer {
        margin-top: 16px !important;
        overflow: visible !important;
      }
      .surface-composer::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop}px;
        right: 16px;
        width: ${bubbleTheme.stickerW + 8}px;
        height: ${bubbleTheme.stickerH + 2}px;
        background-image: url("${bubbleTheme.sticker}");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 30;
        pointer-events: none;
      }
      .surface-composer::after {
        content: "";
        position: absolute;
        bottom: 3px;
        left: 4px;
        width: 16px;
        height: 16px;
        background-image: url("${cornerFiligreeUrl}");
        background-size: contain;
        background-repeat: no-repeat;
        transform: rotate(180deg);
        z-index: 25;
        pointer-events: none;
        opacity: 0.78;
      }
    `
				: `
      .surface-composer {
        margin-top: 28px !important;
        overflow: visible !important;
      }
      .surface-composer::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop - 4}px;
        right: 16px;
        width: ${bubbleTheme.stickerW + 6}px;
        height: ${bubbleTheme.stickerH + 6}px;
        background-image: url("${bubbleTheme.sticker}");
        background-size: contain;
        background-position: bottom center;
        background-repeat: no-repeat;
        z-index: 30;
        pointer-events: none;
      }
      .surface-composer::after { display: none !important; }
    `
			: `
      .surface-composer::before,
      .surface-composer::after { display: none !important; }
    `;

		const inputCardBg =
			st.inputStyle === "glass"
				? bubbleTheme.inputGlassBg || "rgba(20, 15, 13, 0.52)"
				: st.inputStyle === "double_gold"
					? "linear-gradient(145deg, rgba(44, 28, 20, 0.90) 0%, rgba(24, 15, 12, 0.92) 100%)"
					: bubbleTheme.inputCardBg || "rgba(28, 19, 16, 0.88)";

		const inputOuterBorder =
			st.inputStyle === "double_gold"
				? "linear-gradient(135deg, #f59e0b 0%, rgba(217, 119, 6, 0.35) 50%, #fbbf24 100%)"
				: bubbleTheme.frameBg;

		const sidebarBg = mainTheme.sidebarBg || "rgba(14, 10, 8, 0.68)";
		const sidebarHoverBg =
			mainTheme.sidebarHoverBg || "rgba(255, 255, 255, 0.08)";
		const btnBg = mainTheme.btnBg || "rgba(48, 30, 22, 0.62)";
		const modalBg = mainTheme.modalBg || "rgba(14, 12, 12, 0.96)";
		const innerBubbleBorder = bubbleTheme.isScroll
			? "2px solid #78350f"
			: bubbleTheme.innerBorder || "1px solid rgba(255, 255, 255, 0.06)";

		const sidebarEnhanceCss = mainTheme.sidebarEnhanceText
			? `
      .agy-shell .bg-sidebar a,
      .agy-shell .bg-sidebar span,
      .agy-shell .bg-sidebar button {
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.88);
      }
      .agy-shell .bg-sidebar .text-muted-foreground,
      .agy-shell .bg-sidebar .text-secondary-foreground {
        color: rgba(241, 245, 249, 0.92) !important;
      }
    `
			: "";

		const aiCardCss = mainTheme.aiCardBg
			? `
      /* Translucent reading card for AI responses (zero live backdrop-filter for max 120fps scroll) */
      .agy-shell [data-testid="agent-response"] {
        background: ${mainTheme.aiCardBg} !important;
        backdrop-filter: none !important;
        border: 1px solid ${mainTheme.aiCardBorder || "rgba(255, 255, 255, 0.1)"} !important;
        border-radius: 14px !important;
        padding: 12px 16px !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28) !important;
        box-sizing: border-box !important;
      }
      .agy-shell [data-main-content-body="true"] h1,
      .agy-shell [data-main-content-body="true"] h2 {
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85);
      }
    `
			: "";

		const useUnifiedGlass = Boolean(
			st.wpEnabled && wpUrl && mainTheme.unifiedGlass,
		);
		if (useUnifiedGlass && typeof syncShellMetrics === "function") {
			syncShellMetrics();
		}
		if (useUnifiedGlass) {
			syncPrebakedGlass(
				wpUrl,
				overlayRgb,
				overlayAlpha,
				mainTheme.headerBg || "",
				mainTheme.headerBlur || "3px",
			);
		} else {
			syncPrebakedGlass(null);
		}

		const sidePanelCss = st.wpEnabled
			? `
      ${
				useUnifiedGlass
					? `
      .agy-shell[data-agy-side-glass="1"]::before {
        clip-path: polygon(
          evenodd,
          0 0,
          100% 0,
          100% var(--agy-hdr-h, 75px),
          var(--agy-sidebar-w, 256px) var(--agy-hdr-h, 75px),
          var(--agy-sidebar-w, 256px) 100%,
          0 100%,
          0 0,
          var(--agy-side-l, 100%) var(--agy-side-t, 75px),
          var(--agy-side-r, 100%) var(--agy-side-t, 75px),
          var(--agy-side-r, 100%) var(--agy-side-b, 100%),
          var(--agy-side-l, 100%) var(--agy-side-b, 100%),
          var(--agy-side-l, 100%) var(--agy-side-t, 75px)
        ) !important;
      }
      `
					: ""
			}
      body:not([data-has-browser-hole="true"]) .agy-shell [data-side-panel-body="true"]:not([data-has-browser-hole="true"]):not(:has([data-browser-hole]:not([data-browser-hole="false"]))) {
        background: ${mainTheme.aiCardBg || `rgba(${overlayRgb}, 0.72)`} !important;
        backdrop-filter: none !important;
        border-left: 1px solid ${mainTheme.aiCardBorder || "rgba(255, 255, 255, 0.14)"} !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
      }
      body:not([data-has-browser-hole="true"]) .agy-shell [data-side-panel-body="true"]:not([data-has-browser-hole="true"]):not(:has([data-browser-hole]:not([data-browser-hole="false"]))) pre {
        background: rgba(${overlayRgb}, 0.56) !important;
        border: 1px solid ${mainTheme.aiCardBorder || "rgba(255, 255, 255, 0.14)"} !important;
        border-radius: 10px !important;
      }
      .agy-shell [data-side-panel-body="true"] :is(h1, h2, h3, h4) {
        text-shadow: 0 1px 6px rgba(0, 0, 0, 0.85);
      }
    `
			: "";

		const headerCss = mainTheme.headerBg
			? `
      ${
				useUnifiedGlass
					? `
      .agy-shell {
        position: relative !important;
      }
      .agy-shell > div:not(#agy-live-stage):not(#agy-sketch-veil):not(#agy-hero-greeting):first-of-type {
        position: relative !important;
        z-index: 3 !important;
      }
      .agy-shell > div:not(#agy-live-stage):not(#agy-sketch-veil):not(#agy-hero-greeting) {
        position: relative !important;
        z-index: 2 !important;
      }
      .agy-shell::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background-color: ${mainTheme.headerBg};
        background-image: var(--agy-l-glass-bg, none);
        background-size: cover;
        background-position: ${bgPosition};
        background-repeat: no-repeat;
        backdrop-filter: none !important;
        will-change: transform;
        clip-path: polygon(
          0 0,
          100% 0,
          100% var(--agy-hdr-h, 75px),
          var(--agy-sidebar-w, 256px) var(--agy-hdr-h, 75px),
          var(--agy-sidebar-w, 256px) 100%,
          0 100%
        );
      }
      .agy-shell [class*="@container/titlebar"] {
        background: transparent !important;
        backdrop-filter: none !important;
        border-bottom: 1px solid ${mainTheme.headerBorder || "rgba(192, 132, 252, 0.14)"} !important;
      }
      `
					: `
      .agy-shell [class*="@container/titlebar"] {
        background: ${mainTheme.headerBg} !important;
        backdrop-filter: none !important;
        border-bottom: 1px solid ${mainTheme.headerBorder || "rgba(192, 132, 252, 0.15)"} !important;
      }
      `
			}
      .agy-shell [class*="@container/titlebar"] [data-testid="breadcrumb-segment"],
      .agy-shell [class*="@container/titlebar"] [data-testid="pane-titlebar-toolbar"] button,
      .agy-shell [class*="@container/titlebar"] [data-testid="pane-titlebar-toolbar"] span {
        color: rgba(248, 250, 252, 0.96) !important;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.72);
      }
      .agy-shell [class*="@container/titlebar"] [data-testid="pane-titlebar-toolbar"] button.border {
        background: rgba(6, 11, 24, 0.36) !important;
        border-color: rgba(255, 255, 255, 0.16) !important;
      }
    `
			: "";

		const sidebarOuterCss = useUnifiedGlass
			? `
      .agy-shell aside,
      .agy-shell [data-sidebar="true"],
      .agy-shell .bg-sidebar {
        background: transparent !important;
        backdrop-filter: none !important;
      }
    `
			: `
      .agy-shell aside,
      .agy-shell [data-sidebar="true"],
      .agy-shell .bg-sidebar {
        background: ${sidebarBg} !important;
        backdrop-filter: none !important;
      }
    `;

		styleEl.textContent = `
      ${wpCss}
      ${sidebarOuterCss}
      .agy-shell .bg-sidebar .bg-sidebar,
      .agy-shell [data-sidebar="true"] .bg-sidebar,
      .agy-shell .bg-sidebar [class*="group/headerbtn"],
      .agy-shell .bg-sidebar [class*="group/section-header"] {
        background: transparent !important;
        backdrop-filter: none !important;
      }
      .agy-shell .bg-sidebar .agy-scrolled > .w-full.relative > .bg-sidebar[style*="position: sticky"] {
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.14s ease !important;
      }
      .agy-shell .bg-sidebar [class*="group/headerbtn"]:hover,
      .agy-shell .bg-sidebar a:hover {
        background: ${sidebarHoverBg} !important;
      }
      ${sidebarEnhanceCss}
      ${aiCardCss}
      ${sidePanelCss}
      ${headerCss}

      .agy-button-custom.border.border-border {
        background: ${btnBg} !important;
        border-color: ${mainTheme.borderColor} !important;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
      }

      .agy-user-bubble-frame {
        background: ${bubbleTheme.frameBg} !important;
        border-radius: ${bubbleTheme.isScroll ? "6px" : "14px"} !important;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45), 0 0 12px ${bubbleTheme.glow} !important;
        position: relative !important;
        overflow: visible !important;
        padding: 1.2px !important;
      }

      .agy-user-bubble-frame::after {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: ${bubbleTheme.isOrnament ? "16px" : "14px"};
        height: ${bubbleTheme.isOrnament ? "16px" : "14px"};
        background-image: url("${cornerFiligreeUrl}");
        background-size: contain;
        background-repeat: no-repeat;
        pointer-events: none;
        opacity: ${bubbleTheme.isOrnament ? "0.85" : "0.65"};
      }

      .agy-user-bubble {
        background: ${bubbleTheme.bg} !important;
        border-radius: ${bubbleTheme.isScroll ? "5px" : "13px"} !important;
        padding: 8px 16px !important;
        color: ${bubbleTheme.textColor} !important;
        border: ${innerBubbleBorder} !important;
        overflow: visible !important;
        font-weight: 450 !important;
      }

      .agy-user-bubble * {
        color: ${bubbleTheme.textColor} !important;
      }

      .surface-composer {
        background: ${inputOuterBorder} !important;
        border-radius: 16px !important;
        padding: 1.5px !important;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5), 0 0 16px ${bubbleTheme.glow} !important;
        position: relative !important;
      }

      .surface-composer-card {
        background: ${inputCardBg} !important;
        backdrop-filter: none !important;
        border-radius: 14.5px !important;
        border: ${bubbleTheme.innerBorder || "1px solid rgba(255, 255, 255, 0.07)"} !important;
      }

      .surface-composer [data-testid="project-selector-trigger"],
      .surface-composer [data-testid="branch-pill-trigger"],
      .surface-composer [aria-label="Select Environment"],
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"] {
        background: rgba(8, 10, 24, 0.80) !important;
        color: #f8fafc !important;
        border: 1px solid rgba(255, 255, 255, 0.16) !important;
        border-radius: 9999px !important;
        font-weight: 500 !important;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35) !important;
        margin: 1px 2px !important;
        transition: background-color 0.15s ease, border-color 0.15s ease !important;
      }
      .surface-composer [data-testid="branch-pill-trigger"],
      .surface-composer [aria-label="Select Environment"],
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button:not([data-testid="project-selector-trigger"]),
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"]:not([data-testid="project-selector-trigger"]) {
        padding-left: 8px !important;
        padding-right: 7px !important;
        gap: 4px !important;
      }
      .surface-composer [data-testid="project-selector-trigger"]:hover,
      .surface-composer [data-testid="branch-pill-trigger"]:hover,
      .surface-composer [aria-label="Select Environment"]:hover,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button:hover,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"]:hover {
        background: rgba(16, 18, 42, 0.94) !important;
        border-color: ${mainTheme.borderColor} !important;
        color: #ffffff !important;
      }
      .surface-composer [data-testid="project-selector-trigger"] *,
      .surface-composer [data-testid="branch-pill-trigger"] *,
      .surface-composer [aria-label="Select Environment"] *,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button *,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"] * {
        color: #f8fafc !important;
      }
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] .ml-auto > * {
        background: rgba(8, 10, 24, 0.74) !important;
        color: #f8fafc !important;
        border-radius: 9999px !important;
        padding: 2px 8px !important;
      }

      ${bubbleStickerCss}
      ${inputStickerCss}

      @media (max-width: 640px) {
        .agy-user-bubble-frame::before,
        .surface-composer::before {
          transform: scale(0.78);
          transform-origin: bottom right;
        }
      }

      .settings-modal-container {
        background: ${modalBg} !important;
        border: 1px solid ${mainTheme.borderColor} !important;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.75), 0 0 24px ${mainTheme.glow} !important;
        backdrop-filter: none !important;
      }

      #agy-custom-theme-modal-dialog {
        background: ${modalBg} !important;
        border-color: ${mainTheme.borderColor} !important;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), 0 0 32px ${mainTheme.glow} !important;
      }
      #agy-custom-theme-modal-header {
        background: ${mainTheme.modalHeaderBg || "rgba(18, 18, 40, 0.90)"} !important;
      }
      #agy-custom-theme-badge {
        color: ${mainTheme.primary} !important;
        border-color: ${mainTheme.borderColor} !important;
        background: ${mainTheme.glow} !important;
      }
      #agy-custom-theme-sidebar-btn svg {
        color: ${mainTheme.primary} !important;
      }
    `;

		syncLiveStage(st);
		syncHeroGreeting();
		syncTitleBarOverlay(st);
		scheduleTitleBarSync(st);

		if (
			overrides.themeName &&
			overrides.themeName !== prevTheme &&
			st.irisEnabled
		) {
			triggerSketchIrisReveal(false);
		}
	}

	function syncTitleBarOverlay(stOverride) {
		const st = stOverride || getState();
		if (
			window.electronNative &&
			typeof window.electronNative.setTitleBarOverlay === "function"
		) {
			try {
				window.electronNative.setTitleBarOverlay({
					color: st.wpEnabled ? "#00000000" : "#111114",
					symbolColor: "#f8fafc",
				});
			} catch (e) {}
		}
	}

	function clearTitleBarTimers() {
		if (Array.isArray(window.__AGY_TBO_TIMERS__)) {
			window.__AGY_TBO_TIMERS__.forEach((id) => clearTimeout(id));
		}
		window.__AGY_TBO_TIMERS__ = [];
	}

	function scheduleTitleBarSync(stOverride) {
		clearTitleBarTimers();
		const st = stOverride || getState();
		syncTitleBarOverlay(st);
		[300, 900, 2000, 4000, 7000].forEach((ms) => {
			window.__AGY_TBO_TIMERS__.push(
				setTimeout(() => syncTitleBarOverlay(), ms),
			);
		});
	}

	function cleanupRuntime() {
		clearTitleBarTimers();
		clearBootTimers();
		stopParticleEngine();
		stopBlinkEngine();
		if (irisRaf) {
			cancelAnimationFrame(irisRaf);
			irisRaf = 0;
		}
		if (window.__AGY_TICK_RAF__) {
			cancelAnimationFrame(window.__AGY_TICK_RAF__);
			window.__AGY_TICK_RAF__ = 0;
		}
		if (window.__AGY_SHELL_RO__) {
			try {
				window.__AGY_SHELL_RO__.disconnect();
			} catch (e) {}
			window.__AGY_SHELL_RO__ = null;
		}
		if (window.__AGY_MODAL_OBSERVER__) {
			try {
				window.__AGY_MODAL_OBSERVER__.disconnect();
			} catch (e) {}
			window.__AGY_MODAL_OBSERVER__ = null;
		}
		if (window.__AGY_SCROLL_AC__) {
			try {
				window.__AGY_SCROLL_AC__.abort();
			} catch (e) {}
			window.__AGY_SCROLL_AC__ = null;
		}
	}

	function removeCustomTheme() {
		cleanupRuntime();
		[
			"antigravity-custom-theme-active",
			"agy-custom-theme-sidebar-btn",
			"agy-custom-theme-settings-btn",
			"agy-custom-theme-modal-backdrop",
			"agy-live-stage",
			"agy-sketch-veil",
			"agy-hero-greeting",
			"agy-boot-overlay",
		].forEach((id) => {
			const el = document.getElementById(id);
			if (el) el.remove();
		});
		const shell = document.querySelector(".agy-shell");
		if (shell) {
			delete shell.dataset.agyHoleActive;
			delete shell.dataset.agySideGlass;
			shell.style.removeProperty("--agy-hole-clip");
			shell.style.removeProperty("--agy-l-glass-bg");
		}
		if (
			window.electronNative &&
			typeof window.electronNative.setTitleBarOverlay === "function"
		) {
			try {
				window.electronNative.setTitleBarOverlay({
					color: "#111114",
					symbolColor: "#f8fafc",
				});
			} catch (e) {}
		}
	}

	window.__AGY_LIVE_CLEANUP__ = cleanupRuntime;
	window.__ANTIGRAVITY_APPLY_CUSTOM_THEME__ = applyTheme;
	window.__ANTIGRAVITY_REMOVE_CUSTOM_THEME__ = removeCustomTheme;
	window.__ANTIGRAVITY_OPEN_THEME_MODAL__ = openCustomThemeModal;
	window.__ANTIGRAVITY_REPLAY_BOOT__ = () => runBootSequence({ force: true });
	window.__ANTIGRAVITY_TRIGGER_IRIS__ = () => triggerSketchIrisReveal(true);

	function openCustomThemeModal() {
		let backdrop = document.getElementById("agy-custom-theme-modal-backdrop");
		if (!backdrop) {
			backdrop = document.createElement("div");
			backdrop.id = "agy-custom-theme-modal-backdrop";
			backdrop.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99990;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 28px;
        background: rgba(3, 5, 14, 0.80);
      `;

			backdrop.innerHTML = `
        <div id="agy-custom-theme-modal-dialog" style="background: rgba(11, 12, 26, 0.97); border: 1.2px solid rgba(192, 132, 252, 0.38); border-radius: 18px; width: 100%; max-width: 920px; height: 88vh; max-height: 880px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), 0 0 32px rgba(192, 132, 252, 0.25); font-family: system-ui, -apple-system, sans-serif;">
          <div id="agy-custom-theme-modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 18px 26px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: rgba(18, 18, 40, 0.90);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 17px; font-weight: 600; color: #f4f4f5; letter-spacing: -0.2px;">Custom Theme & Live Motion Studio</span>
              <span id="agy-custom-theme-badge" style="font-size: 11.5px; padding: 2.5px 9px; border-radius: 9999px; background: rgba(192, 132, 252, 0.2); color: #c084fc; font-weight: 500; border: 1px solid rgba(192, 132, 252, 0.35);">${THEME_KEYS.length} Presets • 60fps Live</span>
            </div>
            <button id="agy-theme-modal-close-btn" type="button" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #d4d4d8; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; font-size: 15px; display: flex; align-items: center; justify-content: center;">✕</button>
          </div>
          <div id="agy-theme-modal-body" style="flex: 1; overflow-y: auto; height: 100%;"></div>
        </div>
      `;

			document.body.appendChild(backdrop);

			backdrop.addEventListener("click", (e) => {
				if (e.target === backdrop) backdrop.style.display = "none";
			});
			backdrop
				.querySelector("#agy-theme-modal-close-btn")
				.addEventListener("click", () => {
					backdrop.style.display = "none";
				});
			window.addEventListener("keydown", (e) => {
				if (e.key === "Escape" && backdrop.style.display !== "none") {
					backdrop.style.display = "none";
				}
			});
		}

		backdrop.style.display = "flex";
		const body = backdrop.querySelector("#agy-theme-modal-body");
		renderThemePanels(body);
	}

	function renderThemePanels(container) {
		const st = getState();
		const mainTheme = THEMES[st.themeName] || THEMES[DEFAULT_THEME_KEY];
		const escHtml = (str) =>
			String(str || "")
				.replace(/&/g, "&amp;")
				.replace(/"/g, "&quot;")
				.replace(/</g, "&lt;");

		container.innerHTML = `
      <div id="agy-theme-scroll-container" style="padding: 22px 30px 48px 30px; max-width: 880px; margin: 0 auto; color: #f4f4f5;">

        <!-- Card 1: Wallpaper, Live Video & Dimming -->
        <div style="border: 1px solid ${mainTheme.borderColor}; background: ${mainTheme.cardBg || "rgba(15, 16, 34, 0.82)"}; border-radius: 12px; padding: 16px 20px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 14.5px; font-weight: 600; color: #f4f4f5; margin-bottom: 2px;">Wallpaper, Live Video & Dimming</div>
              <div style="font-size: 12px; color: #a1a1aa;">Supports 2K WebP/PNG or looping .mp4/.webm live wallpaper at 60fps.</div>
            </div>
            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 10px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #d4d4d8; cursor: pointer;">
                <input id="agy-wp-toggle" type="checkbox" ${st.wpEnabled ? "checked" : ""} style="accent-color: ${mainTheme.primary}; cursor: pointer;" />
                Backdrop
              </label>
              <input id="agy-dim-slider" type="range" min="12" max="92" value="${st.dimming}" style="width: 115px; cursor: pointer; accent-color: #ffffff; height: 5px;" />
              <span id="agy-dim-val" style="font-size: 12.5px; color: #cbd5e1; min-width: 34px; text-align: right;">${st.dimming}%</span>
              <label style="padding: 5px 11px; border-radius: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid ${mainTheme.borderColor}; color: #f4f4f5; font-size: 12px; cursor: pointer;">
                Upload Image
                <input id="agy-wp-upload" type="file" accept="image/*" style="display: none;" />
              </label>
              <label style="padding: 5px 11px; border-radius: 8px; background: rgba(192, 132, 252, 0.18); border: 1px solid ${mainTheme.borderColor}; color: #f5d0fe; font-size: 12px; cursor: pointer;">
                Upload Video (.mp4/.webm)
                <input id="agy-vid-upload" type="file" accept="video/mp4,video/webm" style="display: none;" />
              </label>
              ${st.hasCustomVideo ? `<button id="agy-clear-vid-btn" type="button" style="padding: 5px 10px; border-radius: 8px; background: rgba(245, 158, 11, 0.16); border: 1px solid rgba(245, 158, 11, 0.4); color: #fde68a; font-size: 12px; cursor: pointer;">Clear Video</button>` : ""}
              <button id="agy-reset-btn" type="button" style="padding: 5px 11px; border-radius: 8px; background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; font-size: 12px; cursor: pointer;">
                Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Card 2: Live Motion, Boot Intro & Hero Greeting (TikTok Pack) -->
        <div style="border: 1px solid ${mainTheme.borderColor}; background: ${mainTheme.cardBg || "rgba(15, 16, 34, 0.82)"}; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 14.5px; font-weight: 600; color: #f4f4f5;">Boot OS, Sketch-to-Iris & Live Particles</div>
              <div style="font-size: 12px; color: #a1a1aa;">6-stage Sci-Fi authorization boot, Sobel wireframe iris reveal, eye-blink & snowfall.</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button id="agy-replay-boot-btn" type="button" style="padding: 6px 13px; border-radius: 8px; background: linear-gradient(135deg, #a855f7 0%, #38bdf8 100%); border: none; color: #ffffff; font-size: 12px; font-weight: 600; cursor: pointer;">
                ▶ Replay Boot Intro
              </button>
              <button id="agy-test-iris-btn" type="button" style="padding: 6px 12px; border-radius: 8px; background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.38); color: #e0f2fe; font-size: 12px; cursor: pointer;">
                ✨ Test Sketch-to-Iris
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #cbd5e1;">
              <span>Boot Intro khi mở App</span>
              <select id="agy-boot-mode-sel" style="background: rgba(8, 10, 22, 0.9); color: #f8fafc; border: 1px solid rgba(255,255,255,0.16); border-radius: 7px; padding: 6px 8px; font-size: 12px;">
                <option value="interactive" ${st.bootMode === "interactive" ? "selected" : ""}>Interactive (Bấm Enter / Click)</option>
                <option value="auto" ${st.bootMode === "auto" ? "selected" : ""}>Auto-Play (Tự chạy mượt)</option>
                <option value="off" ${st.bootMode === "off" ? "selected" : ""}>Off (Tắt Boot Intro)</option>
              </select>
            </label>
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #cbd5e1;">
              <span>Hiệu ứng Hạt 60fps</span>
              <select id="agy-particles-sel" style="background: rgba(8, 10, 22, 0.9); color: #f8fafc; border: 1px solid rgba(255,255,255,0.16); border-radius: 7px; padding: 6px 8px; font-size: 12px;">
                <option value="snow" ${st.particles === "snow" ? "selected" : ""}>Snow & Starlight (Tuyết rơi)</option>
                <option value="stars" ${st.particles === "stars" ? "selected" : ""}>Cosmic Stars (Sao bay)</option>
                <option value="off" ${st.particles === "off" ? "selected" : ""}>Off (Tắt hạt)</option>
              </select>
            </label>
            <div style="display: flex; flex-direction: column; justify-content: center; gap: 5px; font-size: 12px; color: #d4d4d8; padding-top: 12px;">
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input id="agy-motion-chk" type="checkbox" ${st.motionEnabled ? "checked" : ""} style="accent-color:${mainTheme.primary};" />
                Live Breathing & Eye-Blink
              </label>
              <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input id="agy-iris-chk" type="checkbox" ${st.irisEnabled ? "checked" : ""} style="accent-color:${mainTheme.primary};" />
                Sketch-to-Iris khi đổi Theme
              </label>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 2.4fr; gap: 10px;">
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #cbd5e1;">
              <span>Operator Name</span>
              <input id="agy-op-name-inp" type="text" value="${escHtml(st.operatorName)}" style="background: rgba(8, 10, 22, 0.9); color: #f8fafc; border: 1px solid rgba(255,255,255,0.16); border-radius: 7px; padding: 6px 9px; font-size: 12px;" />
            </label>
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #cbd5e1;">
              <span>UID</span>
              <input id="agy-op-uid-inp" type="text" value="${escHtml(st.operatorUid)}" style="background: rgba(8, 10, 22, 0.9); color: #f8fafc; border: 1px solid rgba(255,255,255,0.16); border-radius: 7px; padding: 6px 9px; font-size: 12px;" />
            </label>
            <label style="display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #cbd5e1;">
              <span>Câu chào màn hình chính (để trống nếu muốn ẩn)</span>
              <input id="agy-greeting-inp" type="text" value="${escHtml(st.greetingText)}" style="background: rgba(8, 10, 22, 0.9); color: #f8fafc; border: 1px solid rgba(255,255,255,0.16); border-radius: 7px; padding: 6px 9px; font-size: 12px;" />
            </label>
          </div>
        </div>

        <!-- Theme Presets -->
        <div style="margin-bottom: 26px;">
          <div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">Theme Presets (${THEME_KEYS.length})</div>
          <div style="font-size: 12.5px; color: #a1a1aa; margin-bottom: 12px;">Complete animated backdrop, unified L-glass, ornaments, and particle profile.</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${THEME_KEYS.map((name) => {
							const th = THEMES[name];
							const isSelected = name === st.themeName;
							const thumbBg = th.wallpaper
								? `linear-gradient(180deg, rgba(0,0,0,0.12), rgba(10,11,24,0.86)), url('${th.wallpaper}')`
								: th.pureBg || th.bg;
							const thumbOrnamentStyle = th.isOrnament
								? "right: 10px; bottom: 8px; width: 76px; height: 24px; background-position: center;"
								: "right: 12px; bottom: 4px; width: 42px; height: 38px; background-position: bottom center;";
							return `
                <div class="agy-preset-card" data-name="${name}" style="border-radius: 12px; border: ${isSelected ? "1.5px solid #f4f4f5" : "1px solid rgba(255, 255, 255, 0.12)"}; background: rgba(12, 13, 26, 0.85); overflow: hidden; cursor: pointer; display: flex; flex-direction: column;">
                  <div style="height: 76px; width: 100%; background-image: ${thumbBg}; background-size: cover; background-position: ${th.bgPosition || "center"}; position: relative; display: flex; align-items: flex-end; padding: 8px 14px;">
                    ${th.sticker ? `<div style="position: absolute; ${thumbOrnamentStyle} background-image: url('${th.sticker}'); background-size: contain; background-repeat: no-repeat; pointer-events: none;"></div>` : ""}
                    <span style="font-size: 13.5px; font-weight: 600; color: #fff; text-shadow: 0 1px 6px rgba(0,0,0,0.9);">${name}</span>
                  </div>
                  <div style="padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; color: #a1a1aa;">${th.concept || ""}</span>
                    <div class="agy-card-check-slot">${isSelected ? CHECK_SVG : ""}</div>
                  </div>
                </div>
              `;
						}).join("")}
          </div>
        </div>

        <!-- User Chat Bubble -->
        <div style="margin-bottom: 26px;">
          <div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">User Chat Bubble</div>
          <div style="font-size: 12.5px; color: #a1a1aa; margin-bottom: 12px;">Mix and match bubble frame & ornament independently from the active wallpaper.</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${THEME_KEYS.map((name) => {
							const th = THEMES[name];
							const isSelected = name === st.bubbleName;
							const stickerTop = th.isOrnament
								? Math.round((th.stickerTop || 0) * 0.85)
								: Math.round((th.stickerTop || 0) * 0.74);
							const stickerW = Math.round((th.stickerW || 0) * 0.78);
							const stickerH = th.isOrnament
								? Math.round((th.stickerH || 0) * 0.8)
								: Math.round((th.stickerH || 0) * 0.78);
							return `
                <div class="agy-bubble-card" data-name="${name}" style="position: relative; border-radius: 12px; border: ${isSelected ? "1.5px solid #f4f4f5" : "1px solid rgba(255, 255, 255, 0.12)"}; background: ${isSelected ? "rgba(42, 28, 74, 0.55)" : "rgba(12, 13, 26, 0.78)"}; padding: 22px 18px 14px 18px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-height: 108px;">
                  <div style="display: flex; justify-content: center; align-items: center; width: 100%; margin-top: 4px; margin-bottom: 10px;">
                    <div style="position: relative; width: 192px; height: 44px; padding: 1.2px; border-radius: 12px; background: ${th.frameBg}; box-shadow: 0 4px 14px rgba(0,0,0,0.45), 0 0 10px ${th.glow};">
                      <div style="position: relative; width: 100%; height: 100%; background: ${th.bg}; border: ${th.innerBorder || "1px solid " + th.borderColor}; border-radius: 11px; display: flex; align-items: center; padding: 0 16px;">
                        ${th.sticker ? `<div style="position: absolute; top: ${stickerTop}px; right: 8px; width: ${stickerW}px; height: ${stickerH}px; background-image: url('${th.sticker}'); background-size: contain; background-position: center; background-repeat: no-repeat; pointer-events: none;"></div>` : ""}
                        <span style="font-size: 13.5px; font-weight: 500; color: ${th.textColor};">Sensei ✨</span>
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13.5px; font-weight: 500; color: #e4e4e7;">${name}</span>
                    <div class="agy-card-check-slot">${isSelected ? CHECK_SVG : ""}</div>
                  </div>
                </div>
              `;
						}).join("")}
          </div>
        </div>

        <!-- Composer Style -->
        <div>
          <div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">Composer Style</div>
          <div style="font-size: 12.5px; color: #a1a1aa; margin-bottom: 12px;">Customize the chat input frame without affecting keyboard shortcuts or attachments.</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${Object.entries(INPUT_STYLES)
							.map(([key, item]) => {
								const isSelected = key === st.inputStyle;
								const activeBubbleTh = THEMES[st.bubbleName] || mainTheme;
								const previewStickerStyle = activeBubbleTh.isOrnament
									? "top: -12px; right: 10px; width: 72px; height: 22px; background-position: center;"
									: "top: -22px; right: 10px; width: 32px; height: 28px; background-position: bottom center;";
								const previewInnerBg =
									key === "glass"
										? activeBubbleTh.inputGlassBg || "rgba(12, 14, 30, 0.55)"
										: activeBubbleTh.inputCardBg || "rgba(13, 15, 32, 0.92)";
								return `
                <div class="agy-input-card" data-style="${key}" style="border-radius: 12px; border: ${isSelected ? "1.5px solid #f4f4f5" : "1px solid rgba(255, 255, 255, 0.12)"}; background: ${isSelected ? "rgba(42, 28, 74, 0.55)" : "rgba(12, 13, 26, 0.78)"}; padding: 16px 18px; cursor: pointer; display: flex; flex-direction: column; gap: 12px;">
                  <div class="agy-input-preview-outer" style="position: relative; margin-top: 8px; padding: 1.5px; border-radius: 10px; background: ${key === "double_gold" ? "linear-gradient(135deg, #f59e0b, #fbbf24)" : activeBubbleTh.frameBg};">
                    <div class="agy-input-preview-sticker" style="position: absolute; ${previewStickerStyle} background-image: url('${activeBubbleTh.sticker || ""}'); background-size: contain; background-repeat: no-repeat; display: ${key !== "minimal" && activeBubbleTh.sticker ? "block" : "none"}; pointer-events: none;"></div>
                    <div class="agy-input-preview-inner" style="background: ${previewInnerBg}; border-radius: 9px; padding: 8px 12px; font-size: 12px; color: #a1a1aa; display: flex; justify-content: space-between; align-items: center;">
                      <span>Ask anything, @ to mention...</span>
                      <span class="agy-input-preview-turbo" style="color: ${activeBubbleTh.primary}; font-size: 11px;">Send →</span>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-size: 13.5px; font-weight: 500; color: #e4e4e7;">${item.label}</div>
                      <div style="font-size: 11.5px; color: #a1a1aa;">${item.desc}</div>
                    </div>
                    <div class="agy-card-check-slot">${isSelected ? CHECK_SVG : ""}</div>
                  </div>
                </div>
              `;
							})
							.join("")}
          </div>
        </div>

      </div>
    `;

		const slider = container.querySelector("#agy-dim-slider");
		const valLabel = container.querySelector("#agy-dim-val");
		slider.addEventListener("input", (e) => {
			const v = parseInt(e.target.value, 10);
			valLabel.textContent = v + "%";
			applyTheme({ dimming: v });
		});

		container
			.querySelector("#agy-wp-toggle")
			.addEventListener("change", (e) => {
				applyTheme({ wpEnabled: e.target.checked });
			});

		container
			.querySelector("#agy-wp-upload")
			.addEventListener("change", async (e) => {
				const file = e.target.files && e.target.files[0];
				if (!file) return;
				await clearCustomVideoBlob();
				const reader = new FileReader();
				reader.onload = () => {
					applyTheme({
						customWp: reader.result,
						hasCustomVideo: false,
						wpEnabled: true,
					});
					renderThemePanels(container);
				};
				reader.readAsDataURL(file);
			});

		container
			.querySelector("#agy-vid-upload")
			.addEventListener("change", async (e) => {
				const file = e.target.files && e.target.files[0];
				if (!file) return;
				if (activeVideoObjectUrl) {
					try {
						URL.revokeObjectURL(activeVideoObjectUrl);
					} catch (_) {}
				}
				activeVideoObjectUrl = URL.createObjectURL(file);
				await saveCustomVideoBlob(file).catch(() => {});
				applyTheme({ hasCustomVideo: true, wpEnabled: true });
				renderThemePanels(container);
			});

		const clearVidBtn = container.querySelector("#agy-clear-vid-btn");
		if (clearVidBtn) {
			clearVidBtn.addEventListener("click", async () => {
				await clearCustomVideoBlob();
				applyTheme({ hasCustomVideo: false });
				renderThemePanels(container);
			});
		}

		container
			.querySelector("#agy-replay-boot-btn")
			.addEventListener("click", () => {
				runBootSequence({ force: true });
			});

		container
			.querySelector("#agy-test-iris-btn")
			.addEventListener("click", () => {
				const backdrop = document.getElementById(
					"agy-custom-theme-modal-backdrop",
				);
				if (backdrop) backdrop.style.display = "none";
				triggerSketchIrisReveal(true);
			});

		container
			.querySelector("#agy-boot-mode-sel")
			.addEventListener("change", (e) => {
				applyTheme({ bootMode: e.target.value });
			});

		container
			.querySelector("#agy-particles-sel")
			.addEventListener("change", (e) => {
				applyTheme({ particles: e.target.value });
			});

		container
			.querySelector("#agy-motion-chk")
			.addEventListener("change", (e) => {
				applyTheme({
					motionEnabled: e.target.checked,
					blinkEnabled: e.target.checked,
				});
			});

		container.querySelector("#agy-iris-chk").addEventListener("change", (e) => {
			applyTheme({ irisEnabled: e.target.checked });
		});

		container
			.querySelector("#agy-op-name-inp")
			.addEventListener("change", (e) => {
				applyTheme({ operatorName: e.target.value.trim() || "SENSEI" });
			});

		container
			.querySelector("#agy-op-uid-inp")
			.addEventListener("change", (e) => {
				applyTheme({ operatorUid: e.target.value.trim() || "0042" });
			});

		container
			.querySelector("#agy-greeting-inp")
			.addEventListener("input", (e) => {
				applyTheme({ greetingText: e.target.value });
			});

		container
			.querySelector("#agy-reset-btn")
			.addEventListener("click", async () => {
				await clearCustomVideoBlob();
				[
					STORAGE_CUSTOM_WP,
					STORAGE_THEME,
					STORAGE_BUBBLE,
					STORAGE_INPUT,
					STORAGE_DIMMING,
					STORAGE_WP_ENABLED,
					STORAGE_PARTICLES,
					STORAGE_MOTION,
					STORAGE_BLINK,
					STORAGE_IRIS,
					STORAGE_BOOT_MODE,
					STORAGE_HAS_VIDEO,
				].forEach((k) => localStorage.removeItem(k));
				applyTheme({
					themeName: DEFAULT_THEME_KEY,
					bubbleName: DEFAULT_THEME_KEY,
					inputStyle: "sync",
					dimming: DEFAULT_THEME_KEY === "Tawa Winter Live" ? 30 : 69,
					wpEnabled: true,
					customWp: "",
					hasCustomVideo: false,
					particles: "snow",
					motionEnabled: true,
					blinkEnabled: true,
				});
				renderThemePanels(container);
			});

		container.querySelectorAll(".agy-preset-card").forEach((card) => {
			card.addEventListener("click", async () => {
				const name = card.dataset.name;
				await clearCustomVideoBlob();
				applyTheme({
					themeName: name,
					bubbleName: name,
					customWp: "",
					hasCustomVideo: false,
				});
				renderThemePanels(container);
			});
		});

		container.querySelectorAll(".agy-bubble-card").forEach((card) => {
			card.addEventListener("click", () => {
				applyTheme({ bubbleName: card.dataset.name });
				renderThemePanels(container);
			});
		});

		container.querySelectorAll(".agy-input-card").forEach((card) => {
			card.addEventListener("click", () => {
				applyTheme({ inputStyle: card.dataset.style });
				renderThemePanels(container);
			});
		});
	}

	function injectMainSidebarButton() {
		if (document.getElementById("agy-custom-theme-sidebar-btn")) return;

		const sidebar = document.querySelector(".bg-sidebar");
		if (!sidebar) return;

		const spans = Array.from(sidebar.querySelectorAll("span"));
		const customSpan = spans.find(
			(s) => s.textContent?.trim() === "Customizations",
		);
		if (!customSpan) return;

		const row =
			customSpan.closest('a, button, div[role="button"], .group\\/headerbtn') ||
			customSpan.parentElement;
		if (!row || !row.parentNode) return;

		const btn = document.createElement("button");
		btn.id = "agy-custom-theme-sidebar-btn";
		btn.type = "button";
		btn.className =
			"w-full flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer select-none";
		btn.style.cssText =
			"text-align: left; background: transparent; border: none; color: rgba(241, 245, 249, 0.88);";
		btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Custom theme</span>
    `;

		row.parentNode.insertBefore(btn, row.nextSibling);

		btn.addEventListener("click", (e) => {
			e.preventDefault();
			window.__ANTIGRAVITY_OPEN_THEME_MODAL__();
		});
	}

	function injectSettingsModalButton() {
		const modal = document.querySelector(".settings-modal-container");
		if (!modal || document.getElementById("agy-custom-theme-settings-btn"))
			return;

		const headers = Array.from(modal.querySelectorAll("h2, h3"));
		const appearanceHeader = headers.find(
			(h) => h.textContent?.trim() === "Appearance",
		);
		if (!appearanceHeader) return;

		let targetContainer = appearanceHeader.parentElement;
		while (
			targetContainer &&
			!targetContainer.className.includes("justify-between") &&
			targetContainer !== modal
		) {
			targetContainer = targetContainer.parentElement;
		}

		if (!targetContainer || !targetContainer.parentNode) return;

		Array.from(targetContainer.parentNode.children).forEach((child) => {
			if (child.id === "agy-custom-theme-settings-btn") child.remove();
		});

		const btn = document.createElement("button");
		btn.id = "agy-custom-theme-settings-btn";
		btn.type = "button";
		btn.className =
			"select-none rounded px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer text-white";
		btn.style.cssText =
			"background: linear-gradient(135deg, #a855f7 0%, #38bdf8 100%); border: 1px solid rgba(192, 132, 252, 0.45); box-shadow: 0 2px 10px rgba(168, 85, 247, 0.3); margin-top: 8px; margin-bottom: 8px; display: inline-flex; align-items: center; gap: 6px;";
		btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      <span>Open Custom Theme Studio</span>
    `;

		targetContainer.parentNode.insertBefore(btn, targetContainer.nextSibling);
		btn.addEventListener("click", () =>
			window.__ANTIGRAVITY_OPEN_THEME_MODAL__(),
		);
	}

	function hookSidebarScroll() {
		if (!window.__AGY_SCROLL_AC__) return;
		const scrollers = document.querySelectorAll(
			".agy-shell .bg-sidebar .overflow-y-auto",
		);
		scrollers.forEach((sc) => {
			if (sc.dataset.agyScrollBound) return;
			sc.dataset.agyScrollBound = "1";
			const sync = () => sc.classList.toggle("agy-scrolled", sc.scrollTop > 2);
			sync();
			sc.addEventListener("scroll", sync, {
				passive: true,
				signal: window.__AGY_SCROLL_AC__.signal,
			});
		});
	}

	function syncShellMetrics() {
		const shell = document.querySelector(".agy-shell");
		if (!shell) return;
		const split = shell.querySelector('[data-testid="sidebar-split"]');
		const sidebarPane = split ? split.firstElementChild : null;
		const titleBar = shell.querySelector('[class*="@container/titlebar"]');
		const sw = sidebarPane
			? Math.round(sidebarPane.getBoundingClientRect().width)
			: 0;
		const shellRect = shell.getBoundingClientRect();
		const hdrBottom = titleBar
			? Math.round(titleBar.getBoundingClientRect().bottom - shellRect.top)
			: 35;
		shell.style.setProperty("--agy-sidebar-w", sw + "px");
		shell.style.setProperty("--agy-hdr-h", hdrBottom + "px");

		const hasHoleAttr =
			document.body.getAttribute("data-has-browser-hole") === "true";
		const holeEl = hasHoleAttr
			? shell.querySelector(
					'[data-browser-hole]:not([data-browser-hole="false"])',
				)
			: null;
		if (holeEl) {
			if (window.__AGY_SHELL_RO__ && window.__AGY_HOLE_EL__ !== holeEl) {
				try {
					window.__AGY_SHELL_RO__.observe(holeEl);
				} catch (e) {}
				window.__AGY_HOLE_EL__ = holeEl;
			}
			const hRect = holeEl.getBoundingClientRect();
			if (hRect.width > 1 && hRect.height > 1) {
				const l = Math.max(0, Math.round(hRect.left - shellRect.left));
				const t = Math.max(0, Math.round(hRect.top - shellRect.top));
				const r = Math.max(l, Math.round(hRect.right - shellRect.left));
				const b = Math.max(t, Math.round(hRect.bottom - shellRect.top));
				shell.style.setProperty(
					"--agy-hole-clip",
					`polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px ${t}px)`,
				);
				shell.dataset.agyHoleActive = "1";
				delete shell.dataset.agySideGlass;
				return;
			}
		}
		window.__AGY_HOLE_EL__ = null;
		delete shell.dataset.agyHoleActive;
		shell.style.removeProperty("--agy-hole-clip");

		const sideBody = shell.querySelector('[data-side-panel-body="true"]');
		if (sideBody) {
			if (window.__AGY_SHELL_RO__ && window.__AGY_SIDE_EL__ !== sideBody) {
				try {
					window.__AGY_SHELL_RO__.observe(sideBody);
				} catch (e) {}
				window.__AGY_SIDE_EL__ = sideBody;
			}
			const sRect = sideBody.getBoundingClientRect();
			const hasContent = sideBody.children.length > 0;
			if (
				hasContent &&
				sRect.width > 24 &&
				sRect.height > 24 &&
				sRect.left < shellRect.right - 8 &&
				sRect.right > shellRect.left + 8
			) {
				const sl = Math.max(sw, Math.round(sRect.left - shellRect.left));
				const stTop = Math.max(
					hdrBottom,
					Math.round(sRect.top - shellRect.top),
				);
				const sr = Math.min(
					Math.round(shellRect.width),
					Math.max(sl, Math.round(sRect.right - shellRect.left)),
				);
				const sb = Math.min(
					Math.round(shellRect.height),
					Math.max(stTop, Math.round(sRect.bottom - shellRect.top)),
				);
				if (sr - sl > 20 && sb - stTop > 20) {
					shell.style.setProperty("--agy-side-l", sl + "px");
					shell.style.setProperty("--agy-side-t", stTop + "px");
					shell.style.setProperty("--agy-side-r", sr + "px");
					shell.style.setProperty("--agy-side-b", sb + "px");
					shell.dataset.agySideGlass = "1";
					return;
				}
			}
		}
		delete shell.dataset.agySideGlass;
	}

	function hookShellMetrics() {
		const shell = document.querySelector(".agy-shell");
		if (!shell) return;
		if (!document.getElementById("agy-live-stage") && getState().wpEnabled) {
			syncLiveStage();
		}
		if (!window.__AGY_BOOT_CHECKED__) {
			window.__AGY_BOOT_CHECKED__ = true;
			setTimeout(() => runBootSequence({ force: false }), 120);
		}
		if (!shell.dataset.agyTboMounted) {
			shell.dataset.agyTboMounted = "1";
			scheduleTitleBarSync();
		}
		if (!window.__AGY_SHELL_RO__ && typeof ResizeObserver !== "undefined") {
			const ro = new ResizeObserver(syncShellMetrics);
			ro.observe(shell);
			const sidebarPane = shell.querySelector(
				'[data-testid="sidebar-split"]',
			)?.firstElementChild;
			if (sidebarPane) ro.observe(sidebarPane);
			window.__AGY_SHELL_RO__ = ro;
		}
		syncShellMetrics();
	}

	function tick() {
		injectMainSidebarButton();
		injectSettingsModalButton();
		hookSidebarScroll();
		hookShellMetrics();
		syncHeroGreeting();
	}

	function scheduleTick() {
		if (window.__AGY_TICK_RAF__) return;
		window.__AGY_TICK_RAF__ = requestAnimationFrame(() => {
			window.__AGY_TICK_RAF__ = 0;
			tick();
		});
	}

	function mountEngine() {
		if (!document.body || !document.head) return;
		window.__AGY_SCROLL_AC__ = new AbortController();
		window.addEventListener("load", () => scheduleTitleBarSync(), {
			signal: window.__AGY_SCROLL_AC__.signal,
		});
		window.addEventListener("focus", () => syncTitleBarOverlay(), {
			signal: window.__AGY_SCROLL_AC__.signal,
		});
		document.addEventListener(
			"visibilitychange",
			() => {
				const vid = document.getElementById("agy-live-video");
				if (!document.hidden) {
					syncTitleBarOverlay();
					if (vid && getState().hasCustomVideo) vid.play().catch(() => {});
				} else if (vid) {
					vid.pause();
				}
			},
			{ signal: window.__AGY_SCROLL_AC__.signal },
		);

		document
			.querySelectorAll("[data-agy-scroll-bound]")
			.forEach((el) => delete el.dataset.agyScrollBound);
		document
			.querySelectorAll("[data-agy-tbo-mounted]")
			.forEach((el) => delete el.dataset.agyTboMounted);
		const staleBackdrop = document.getElementById(
			"agy-custom-theme-modal-backdrop",
		);
		if (staleBackdrop) staleBackdrop.remove();
		const staleSidebarBtn = document.getElementById(
			"agy-custom-theme-sidebar-btn",
		);
		if (staleSidebarBtn) staleSidebarBtn.remove();
		const staleSettingsBtn = document.getElementById(
			"agy-custom-theme-settings-btn",
		);
		if (staleSettingsBtn) staleSettingsBtn.remove();

		window.__AGY_HOLE_EL__ = null;
		applyTheme();

		window.__AGY_MODAL_OBSERVER__ = new MutationObserver(scheduleTick);
		window.__AGY_MODAL_OBSERVER__.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["data-has-browser-hole", "data-browser-hole"],
		});
		tick();
	}

	if (document.body && document.head) {
		mountEngine();
	} else {
		window.addEventListener("DOMContentLoaded", mountEngine, { once: true });
	}

	return "Antigravity Custom Theme & Live Motion Engine Ready!";
})();
