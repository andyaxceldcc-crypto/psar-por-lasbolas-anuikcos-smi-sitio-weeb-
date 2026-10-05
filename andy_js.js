(function () {
    'use strict';

    // =========================================================
    // ANDY.JS - VERSIÓN MAESTRA ULTRA AMPLIADA Y EXTENDIDA
    // ANUNCIOS PARA SITIOS CON EMBEDS / IFRAMES Y MÁS
    // =========================================================

    // =========================================================
    // 50 FUENTES / PROVEEDORES DE ANUNCIOS
    // =========================================================

    const AD_SOURCES = [
        'https://URL-EMPRESA-1',
        'https://URL-EMPRESA-2',
        'https://URL-EMPRESA-3',
        'https://URL-EMPRESA-4',
        'https://URL-EMPRESA-5',
        'https://URL-EMPRESA-6',
        'https://URL-EMPRESA-7',
        'https://URL-EMPRESA-8',
        'https://URL-EMPRESA-9',
        'https://URL-EMPRESA-10',
        'https://URL-EMPRESA-11',
        'https://URL-EMPRESA-12',
        'https://URL-EMPRESA-13',
        'https://URL-EMPRESA-14',
        'https://URL-EMPRESA-15',
        'https://URL-EMPRESA-16',
        'https://URL-EMPRESA-17',
        'https://URL-EMPRESA-18',
        'https://URL-EMPRESA-19',
        'https://URL-EMPRESA-20',
        'https://URL-EMPRESA-21',
        'https://URL-EMPRESA-22',
        'https://URL-EMPRESA-23',
        'https://URL-EMPRESA-24',
        'https://URL-EMPRESA-25',
        'https://URL-EMPRESA-26',
        'https://URL-EMPRESA-27',
        'https://URL-EMPRESA-28',
        'https://URL-EMPRESA-29',
        'https://URL-EMPRESA-30',
        'https://URL-EMPRESA-31',
        'https://URL-EMPRESA-32',
        'https://URL-EMPRESA-33',
        'https://URL-EMPRESA-34',
        'https://URL-EMPRESA-35',
        'https://URL-EMPRESA-36',
        'https://URL-EMPRESA-37',
        'https://URL-EMPRESA-38',
        'https://URL-EMPRESA-39',
        'https://URL-EMPRESA-40',
        'https://URL-EMPRESA-41',
        'https://URL-EMPRESA-42',
        'https://URL-EMPRESA-43',
        'https://URL-EMPRESA-44',
        'https://URL-EMPRESA-45',
        'https://URL-EMPRESA-46',
        'https://URL-EMPRESA-47',
        'https://URL-EMPRESA-48',
        'https://URL-EMPRESA-49',
        'https://URL-EMPRESA-50'
    ];

    const MIN_INTERVAL = 1000;

    const MAX_ADS_PER_MINUTE = 60;

    const WINDOW_MS = 60000;

    let lastFire = 0;

    let loading = false;

    let providerIndex = 0;

    const adTimestamps = [];

    // =========================================================
    // MÉTRICAS Y LOGS INTERNOS COMPLETOS
    // =========================================================

    let totalRequests = 0;

    let successfulLoads = 0;

    let failedLoads = 0;

    const providerHits = new Array(AD_SOURCES.length).fill(0);

    const historyLog = [];

    function registrarLog(tipo, detalle) {
        historyLog.push({
            tiempo: new Date().toISOString(),
            tipo: tipo,
            detalle: detalle
        });

        if (historyLog.length > 200) {
            historyLog.shift();
        }
    }

    // =========================================================
    // OBTENER SIGUIENTE PROVEEDOR (ROTACIÓN AVANZADA)
    // =========================================================

    function nextProvider() {

        if (!AD_SOURCES.length) {
            return null;
        }

        providerHits[providerIndex]++;

        const url =
            AD_SOURCES[providerIndex];

        providerIndex =
            (providerIndex + 1) %
            AD_SOURCES.length;

        return url;
    }

    // =========================================================
    // COMPROBAR LÍMITE DE VELOCIDAD Y VENTANA DE TIEMPO
    // =========================================================

    function canLoadAd() {

        const now = Date.now();

        while (
            adTimestamps.length &&
            adTimestamps[0] <
            now - WINDOW_MS
        ) {
            adTimestamps.shift();
        }

        if (
            adTimestamps.length >=
            MAX_ADS_PER_MINUTE
        ) {
            registrarLog('BLOQUEO', 'Límite máximo por minuto alcanzado');
            return false;
        }

        if (
            now - lastFire <
            MIN_INTERVAL
        ) {
            return false;
        }

        return true;
    }

    // =========================================================
    // CARGAR ANUNCIO (CON LIMPIEZA DE DOM AUTOMÁTICA Y EXCEPCIONES)
    // =========================================================

    function loadAd() {

        try {
            if (!canLoadAd()) {
                return;
            }

            if (loading) {
                return;
            }

            const adUrl =
                nextProvider();

            if (!adUrl) {
                return;
            }

            loading = true;

            totalRequests++;

            const script =
                document.createElement('script');

            const separator =
                adUrl.includes('?')
                    ? '&'
                    : '?';

            script.src =
                adUrl +
                separator +
                '_=' +
                Date.now() +
                '&rand=' + Math.random().toString(36).substring(2, 10);

            script.async = true;

            // Función para limpiar el script del navegador y no saturar memoria
            const limpiarScriptDOM = function () {
                try {
                    loading = false;
                    if (script && script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                } catch (cleanErr) {
                    console.error('[Andy.js] Error al limpiar script:', cleanErr);
                }
            };

            script.onload = function () {

                limpiarScriptDOM();

                lastFire = Date.now();

                adTimestamps.push(lastFire);

                successfulLoads++;

                registrarLog('EXITO', adUrl);

                console.log(
                    '[Andy.js] Anuncio cargado, procesado y limpiado correctamente desde la fuente indexada'
                );

            };

            script.onerror = function () {

                limpiarScriptDOM();

                failedLoads++;

                registrarLog('ERROR', adUrl);

                console.warn(
                    '[Andy.js] El proveedor no respondió, dio error 404/500 o hay un AdBlock activo detectado'
                );
            };

            document.head.appendChild(script);

        } catch (err) {
            loading = false;
            console.error('[Andy.js] Excepción crítica capturada en loadAd:', err);
        }
    }

    // =========================================================
    // EVENTOS DE INTERACCIÓN MASIVA AMPLIADOS
    // =========================================================

    ['click', 'touchstart', 'mousedown', 'keydown', 'scroll', 'mousemove', 'wheel', 'pointerdown', 'focus'].forEach(function(evento) {
        document.addEventListener(
            evento,
            function () {
                loadAd();
            },
            {
                passive: true,
                capture: true
            }
        );
    });

    // =========================================================
    // CUANDO EL USUARIO REGRESA A LA PÁGINA O CAMBIA DE VISIBILIDAD
    // =========================================================

    document.addEventListener(
        'visibilitychange',
        function () {

            if (!document.hidden) {

                loadAd();

            }

        }
    );

    // =========================================================
    // DETECTAR IFRAMES / EMBEDS / OBJETOS DINÁMICOS
    // =========================================================

    function detectEmbeds() {

        const frames =
            document.querySelectorAll(
                'iframe, embed, object, video'
            );

        if (!frames.length) {
            return;
        }

        frames.forEach(function (frame) {

            if (!frame.dataset.andyTracked) {
                frame.dataset.andyTracked = 'true';
                frame.addEventListener(
                    'load',
                    function () {
                        console.log(
                            '[Andy.js] Elemento embed detectado y cargado exitosamente:',
                            frame.src || frame.data || 'recurso multimedia'
                        );
                        loadAd();
                    }
                );
            }

        });
    }

    // =========================================================
    // BUSCAR EMBEDS DESPUÉS DE CAMBIOS EN EL HTML (MUTATION OBSERVER)
    // =========================================================

    const observer =
        new MutationObserver(
            function (mutationsList) {
                for (let mutation of mutationsList) {
                    if (mutation.addedNodes.length > 0) {
                        detectEmbeds();
                    }
                }
            }
        );

    observer.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );

    // =========================================================
    // CARGA INICIAL Y BUCLE AUTOMÁTICO DE DISPARO
    // =========================================================

    setTimeout(
        function () {

            detectEmbeds();

            loadAd();

        },
        1000
    );

    setInterval(
        function () {

            loadAd();

        },
        1000
    );

    // =========================================================
    // API PARA DEPURAR (CON CONTROL TOTAL Y MÉTRICAS DESDE CONSOLA)
    // =========================================================

    window.AndyAds = {

        load: loadAd,

        providers: function () {

            return AD_SOURCES.slice();

        },

        count: function () {

            return adTimestamps.length;

        },

        metrics: function () {

            return {
                solicitudesTotales: totalRequests,
                exitosos: successfulLoads,
                fallidos: failedLoads,
                tasaDeExito: totalRequests > 0 ? ((successfulLoads / totalRequests) * 100).toFixed(2) + '%' : '0%',
                hitsPorProveedor: providerHits,
                indiceActual: providerIndex,
                cargandoActualmente: loading,
                totalFuentesConfiguradas: AD_SOURCES.length
            };

        },

        logs: function () {

            return historyLog;

        },

        reset: function () {

            adTimestamps.length = 0;
            lastFire = 0;
            loading = false;
            totalRequests = 0;
            successfulLoads = 0;
            failedLoads = 0;
            providerHits.fill(0);
            console.log('[Andy.js] Contadores y métricas restablecidos a cero');

        }

    };

    // =========================================================
    // MENSAJE DE INICIO CONSOLA
    // =========================================================

    console.log(
        '[Andy.js] Sistema maestro ultra extendido con 50 fuentes, observadores y eventos masivos iniciado al 100% sin omitir nada.'
    );

})();