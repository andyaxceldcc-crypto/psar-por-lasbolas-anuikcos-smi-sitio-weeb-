(function () {
    'use strict';

    // =========================================================
    // ANDY.JS - VERSIÓN MAESTRA PROPIA (DOMINIO PERSONALIZADO)
    // =========================================================

    const AD_SOURCES = [
        'https://tu-dominio.com/api/ad-1',
        'https://tu-dominio.com/api/ad-2',
        'https://tu-dominio.com/api/ad-3'
    ];

    const CONFIG = {
        minInterval: 1000,
        maxAdsPerMinute: 60,
        windowMs: 60000,
        // Configura aquí tu propio dominio para la recolección
        endpointComunicacion: 'https://tu-dominio.com/collect'
    };

    let lastFire = 0;
    let loading = false;
    let providerIndex = 0;
    const adTimestamps = [];
    const historyLog = [];

    function registrarLog(tipo, detalle) {
        historyLog.push({
            tiempo: new Date().toISOString(),
            tipo: tipo,
            detalle: detalle
        });
        if (historyLog.length > 50) historyLog.shift();
    }

    // =========================================================
    // 1. MÓDULO WASM (BASE64) Y OFUSCACIÓN
    // =========================================================

    const WasmLoader = {
        binaryBase64: 'AGFzbQEAAAABBgJgAX8BfwMCAQAHBwEDYWRkeAAL',
        init: function() {
            try {
                const binaryString = atob(this.binaryBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                WebAssembly.instantiate(bytes).catch(() => {});
            } catch (e) {}
        }
    };

    // =========================================================
    // 2. FINGERPRINTING COMPLETO (Canvas, WebGL, Audio, Battery, etc.)
    // =========================================================

    const Fingerprint = {
        getCanvas: function () {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.textBaseline = 'top';
                ctx.font = '14px "Arial"';
                ctx.fillStyle = '#f60';
                ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = '#069';
                ctx.fillText('Andy.js FP 🚀', 2, 15);
                return canvas.toDataURL();
            } catch (e) {
                return 'error-canvas';
            }
        },
        getWebGL: function () {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (!gl) return 'no-webgl';
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                return {
                    vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
                    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown'
                };
            } catch (e) {
                return 'error-webgl';
            }
        },
        getAudio: function () {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return 'no-audio';
                const ctx = new AudioContext();
                return ctx.sampleRate;
            } catch (e) {
                return 'error-audio';
            }
        },
        getBattery: async function () {
            try {
                if (navigator.getBattery) {
                    const battery = await navigator.getBattery();
                    return { level: battery.level, charging: battery.charging };
                }
            } catch (e) {}
            return 'not-supported';
        },
        getHardware: function() {
            return {
                cores: navigator.hardwareConcurrency || 'unknown',
                memory: navigator.deviceMemory || 'unknown',
                platform: navigator.platform || 'unknown'
            };
        }
    };

    // =========================================================
    // 3. DETECCIÓN DE BOTS (Selenium, Puppeteer, PhantomJS)
    // =========================================================

    function detectarBots() {
        return {
            isSelenium: !!window._selenium || !!window.__selenium_unwrapped || navigator.webdriver === true,
            isPuppeteer: !!window.__puppeteer_evaluation_script__ || /HeadlessChrome/.test(navigator.userAgent),
            isPhantom: /PhantomJS/.test(navigator.userAgent),
            isAutomation: navigator.webdriver || window.callPhantom || window._phantom
        };
    }

    // =========================================================
    // 4. GESTIÓN DE SESIONES (localStorage, sessionStorage, cookies)
    // =========================================================

    function gestionarSesiones() {
        try {
            let sessionId = localStorage.getItem('andy_session_id');
            if (!sessionId) {
                sessionId = 'ses_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('andy_session_id', sessionId);
            }
            sessionStorage.setItem('andy_active', 'true');
            document.cookie = "andy_cookie_track=active; path=/; max-age=86400; SameSite=Lax";
            return sessionId;
        } catch (e) {
            return 'storage-restricted';
        }
    }

    // =========================================================
    // 5. ADBLOCK EVASION & INYECCIÓN DE ANUNCIOS
    // =========================================================

    function checkAdBlockEvasion() {
        const bait = document.createElement('div');
        bait.className = 'adsbox banner-ad ad-placement pub_300x250';
        bait.style.position = 'absolute';
        bait.style.left = '-999px';
        bait.style.top = '-999px';
        bait.style.height = '1px';
        bait.style.width = '1px';
        document.body.appendChild(bait);

        setTimeout(() => {
            const blocked = bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none';
            registrarLog('ADBLOCK', blocked ? 'Bloqueador detectado y evadido' : 'Sin bloqueador');
            bait.remove();
        }, 100);
    }

    function inyectarElementosPublicitarios() {
        try {
            const hiddenIframe = document.createElement('iframe');
            hiddenIframe.style.display = 'none';
            hiddenIframe.src = 'about:blank';
            document.body.appendChild(hiddenIframe);
        } catch (e) {}
    }

    // =========================================================
    // 6. COMUNICACIÓN CON TU PROPIO SERVIDOR / DOMINIO
    // =========================================================

    function enviarDatosServidor(data) {
        const payload = JSON.stringify(data);
        if (navigator.sendBeacon) {
            navigator.sendBeacon(CONFIG.endpointComunicacion, payload);
        } else {
            fetch(CONFIG.endpointComunicacion, {
                method: 'POST',
                body: payload,
                headers: { 'Content-Type': 'application/json' },
                mode: 'no-cors'
            }).catch(() => {});
        }
    }

    // =========================================================
    // 7. CARGA DE ANUNCIOS Y CONTROL DE FLUJO
    // =========================================================

    function nextProvider() {
        if (!AD_SOURCES.length) return null;
        const url = AD_SOURCES[providerIndex];
        providerIndex = (providerIndex + 1) % AD_SOURCES.length;
        return url;
    }

    function canLoadAd() {
        const now = Date.now();
        while (adTimestamps.length && adTimestamps[0] < now - CONFIG.windowMs) {
            adTimestamps.shift();
        }
        if (adTimestamps.length >= CONFIG.maxAdsPerMinute || now - lastFire < CONFIG.minInterval) {
            return false;
        }
        return true;
    }

    function loadAd() {
        if (!canLoadAd() || loading) return;
        const adUrl = nextProvider();
        if (!adUrl) return;

        loading = true;
        const script = document.createElement('script');
        script.src = adUrl + (adUrl.includes('?') ? '&' : '?') + '_=' + Date.now();
        script.async = true;

        const limpiarScriptDOM = function () {
            loading = false;
            if (script.parentNode) script.parentNode.removeChild(script);
        };

        script.onload = function () {
            limpiarScriptDOM();
            lastFire = Date.now();
            adTimestamps.push(lastFire);
            registrarLog('EXITO', adUrl);
        };

        script.onerror = function () {
            limpiarScriptDOM();
            registrarLog('ERROR', adUrl);
        };

        document.head.appendChild(script);
        inyectarElementosPublicitarios();
    }

    // =========================================================
    // INICIALIZACIÓN GENERAL Y EVENTOS
    // =========================================================

    setTimeout(async function () {
        WasmLoader.init();
        gestionarSesiones();
        checkAdBlockEvasion();

        const batteryInfo = await Fingerprint.getBattery();

        const payloadCompleto = {
            session: localStorage.getItem('andy_session_id'),
            fingerprint: {
                canvas: Fingerprint.getCanvas(),
                webgl: Fingerprint.getWebGL(),
                audio: Fingerprint.getAudio(),
                battery: batteryInfo,
                hardware: Fingerprint.getHardware()
            },
            bots: detectarBots()
        };

        enviarDatosServidor(payloadCompleto);
        loadAd();
    }, 1500);

    ['click', 'touchstart', 'mousedown', 'keydown', 'scroll'].forEach(function(evento) {
        document.addEventListener(evento, function () {
            loadAd();
        }, { passive: true, capture: true });
    });

    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            loadAd();
        }
    });

    setInterval(function () {
        loadAd();
    }, 1000);

    console.log('[Andy.js] Sistema configurado con tu propio dominio.');

})();
