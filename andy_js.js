
(function () {
    'use strict';

    // =========================================================
    // ANDY.JS
    // SISTEMA DE ANUNCIOS AMPLIADO
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

    // =========================================================
    // CONFIGURACIÓN
    // =========================================================

    const CONFIG = {

        // Tiempo mínimo entre anuncios
        MIN_INTERVAL: 60000,

        // Máximo de solicitudes en una ventana
        MAX_ADS_PER_MINUTE: 60,

        // Ventana de control
        WINDOW_MS: 60000,

        // Primera carga
        INITIAL_DELAY: 1500,

        // Revisar elementos dinámicos
        EMBED_SCAN_INTERVAL: 5000,

        // Tiempo máximo que puede estar cargando
        LOAD_TIMEOUT: 15000,

        // Máximo de registros internos
        MAX_LOGS: 300,

        // Activar eventos
        EVENTS: true,

        // Activar detección de embeds
        DETECT_EMBEDS: true,

        // Activar cambios de URL
        DETECT_URL_CHANGES: true,

        // Activar Page Visibility API
        VISIBILITY: true
    };

    // =========================================================
    // VARIABLES PRINCIPALES
    // =========================================================

    let lastFire = 0;
    let loading = false;
    let providerIndex = 0;

    let totalRequests = 0;
    let successfulLoads = 0;
    let failedLoads = 0;

    let pageLoads = 0;
    let embedLoads = 0;
    let interactionEvents = 0;
    let navigationEvents = 0;

    let lastUrl = location.href;

    const adTimestamps = [];
    const historyLog = [];

    const providerHits =
        new Array(AD_SOURCES.length).fill(0);

    // =========================================================
    // LOG
    // =========================================================

    function registrarLog(tipo, detalle) {

        historyLog.push({
            tiempo: new Date().toISOString(),
            tipo: tipo,
            detalle: detalle,
            url: location.href
        });

        if (historyLog.length > CONFIG.MAX_LOGS) {
            historyLog.shift();
        }
    }

    // =========================================================
    // EVENTO PERSONALIZADO
    // =========================================================

    function emitirEvento(nombre, detalle) {

        try {

            window.dispatchEvent(
                new CustomEvent(nombre, {
                    detail: detalle || {}
                })
            );

        } catch (error) {

            console.warn(
                '[Andy.js] No se pudo emitir evento:',
                nombre
            );

        }
    }

    // =========================================================
    // OBTENER PROVEEDOR
    // =========================================================

    function nextProvider() {

        if (!AD_SOURCES.length) {
            return null;
        }

        const indice = providerIndex;

        providerHits[indice]++;

        const url = AD_SOURCES[indice];

        providerIndex =
            (providerIndex + 1) %
            AD_SOURCES.length;

        return url;
    }

    // =========================================================
    // LIMPIAR TIMESTAMPS
    // =========================================================

    function limpiarTimestamps() {

        const ahora = Date.now();

        while (
            adTimestamps.length &&
            adTimestamps[0] <
            ahora - CONFIG.WINDOW_MS
        ) {
            adTimestamps.shift();
        }
    }

    // =========================================================
    // CONTROL DE CARGA
    // =========================================================

    function canLoadAd() {

        limpiarTimestamps();

        const ahora = Date.now();

        if (
            adTimestamps.length >=
            CONFIG.MAX_ADS_PER_MINUTE
        ) {

            registrarLog(
                'BLOQUEO',
                'Máximo de anuncios por ventana alcanzado'
            );

            return false;
        }

        if (
            ahora - lastFire <
            CONFIG.MIN_INTERVAL
        ) {
            return false;
        }

        if (loading) {
            return false;
        }

        return true;
    }

    // =========================================================
    // CREAR URL DE ANUNCIO
    // =========================================================

    function construirAdUrl(url) {

        const separador =
            url.includes('?')
                ? '&'
                : '?';

        return (
            url +
            separador +
            '_=' +
            Date.now() +
            '&rand=' +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }

    // =========================================================
    // CARGAR ANUNCIO
    // =========================================================

    function loadAd(motivo) {

        try {

            if (!canLoadAd()) {
                return false;
            }

            const adUrl =
                nextProvider();

            if (!adUrl) {
                return false;
            }

            loading = true;

            totalRequests++;

            registrarLog(
                'SOLICITUD',
                motivo || 'manual'
            );

            emitirEvento(
                'andyads:beforeload',
                {
                    provider: adUrl,
                    motivo: motivo || 'manual'
                }
            );

            const script =
                document.createElement('script');

            script.async = true;

            script.src =
                construirAdUrl(adUrl);

            script.dataset.andyAds =
                'true';

            let terminado = false;

            const finalizar = function (
                exitoso
            ) {

                if (terminado) {
                    return;
                }

                terminado = true;

                loading = false;

                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }

                if (exitoso) {

                    lastFire = Date.now();

                    adTimestamps.push(
                        lastFire
                    );

                    successfulLoads++;

                    registrarLog(
                        'EXITO',
                        adUrl
                    );

                    emitirEvento(
                        'andyads:success',
                        {
                            provider: adUrl
                        }
                    );

                } else {

                    failedLoads++;

                    registrarLog(
                        'ERROR',
                        adUrl
                    );

                    emitirEvento(
                        'andyads:error',
                        {
                            provider: adUrl
                        }
                    );
                }
            };

            script.onload = function () {

                finalizar(true);

                console.log(
                    '[Andy.js] Anuncio cargado:',
                    adUrl
                );
            };

            script.onerror = function () {

                finalizar(false);

                console.warn(
                    '[Andy.js] Error cargando proveedor:',
                    adUrl
                );
            };

            document.head.appendChild(
                script
            );

            // Protección contra scripts que quedan colgados
            setTimeout(
                function () {

                    if (!terminado) {

                        registrarLog(
                            'TIMEOUT',
                            adUrl
                        );

                        finalizar(false);
                    }

                },
                CONFIG.LOAD_TIMEOUT
            );

            return true;

        } catch (error) {

            loading = false;

            failedLoads++;

            registrarLog(
                'EXCEPCION',
                error.message
            );

            console.error(
                '[Andy.js]',
                error
            );

            return false;
        }
    }

    // =========================================================
    // DETECCIÓN DE IFRAMES / VIDEO / EMBEDS
    // =========================================================

    function detectEmbeds() {

        if (!CONFIG.DETECT_EMBEDS) {
            return;
        }

        const elementos =
            document.querySelectorAll(
                'iframe, embed, object, video, audio'
            );

        elementos.forEach(
            function (elemento) {

                if (
                    elemento.dataset.andyTracked
                ) {
                    return;
                }

                elemento.dataset.andyTracked =
                    'true';

                elemento.addEventListener(
                    'load',
                    function () {

                        embedLoads++;

                        registrarLog(
                            'EMBED_LOAD',
                            elemento.src ||
                            elemento.currentSrc ||
                            elemento.data ||
                            'multimedia'
                        );

                        emitirEvento(
                            'andyads:embed',
                            {
                                elemento: elemento
                            }
                        );

                        loadAd(
                            'embed-load'
                        );
                    }
                );

                // Para video/audio
                elemento.addEventListener(
                    'play',
                    function () {

                        registrarLog(
                            'MEDIA_PLAY',
                            elemento.currentSrc ||
                            elemento.src ||
                            'media'
                        );

                        emitirEvento(
                            'andyads:media-play'
                        );

                        loadAd(
                            'media-play'
                        );
                    }
                );

                elemento.addEventListener(
                    'pause',
                    function () {

                        emitirEvento(
                            'andyads:media-pause'
                        );
                    }
                );
            }
        );
    }

    // =========================================================
    // OBSERVADOR DEL DOM
    // =========================================================

    let observer = null;

    function iniciarObserver() {

        if (!window.MutationObserver) {
            return;
        }

        observer =
            new MutationObserver(
                function (mutations) {

                    let huboCambios = false;

                    for (
                        const mutation
                        of mutations
                    ) {

                        if (
                            mutation.addedNodes &&
                            mutation.addedNodes.length
                        ) {

                            huboCambios = true;
                            break;
                        }
                    }

                    if (huboCambios) {
                        detectEmbeds();
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
    }

    // =========================================================
    // DETECTAR CAMBIOS DE URL
    // =========================================================

    function comprobarUrl() {

        if (!CONFIG.DETECT_URL_CHANGES) {
            return;
        }

        const nuevaUrl =
            location.href;

        if (nuevaUrl === lastUrl) {
            return;
        }

        const anterior =
            lastUrl;

        lastUrl =
            nuevaUrl;

        navigationEvents++;

        registrarLog(
            'NAVEGACION',
            nuevaUrl
        );

        emitirEvento(
            'andyads:navigation',
            {
                anterior: anterior,
                nueva: nuevaUrl
            }
        );

        detectEmbeds();

        loadAd(
            'navigation'
        );
    }

    // =========================================================
    // INTERCEPTAR HISTORY API
    // =========================================================

    function interceptarHistory() {

        const pushStateOriginal =
            history.pushState;

        const replaceStateOriginal =
            history.replaceState;

        history.pushState =
            function () {

                const resultado =
                    pushStateOriginal.apply(
                        this,
                        arguments
                    );

                setTimeout(
                    comprobarUrl,
                    50
                );

                return resultado;
            };

        history.replaceState =
            function () {

                const resultado =
                    replaceStateOriginal.apply(
                        this,
                        arguments
                    );

                setTimeout(
                    comprobarUrl,
                    50
                );

                return resultado;
            };

        window.addEventListener(
            'popstate',
            comprobarUrl
        );

        window.addEventListener(
            'hashchange',
            comprobarUrl
        );
    }

    // =========================================================
    // EVENTOS DEL USUARIO
    // =========================================================

    function iniciarEventos() {

        if (!CONFIG.EVENTS) {
            return;
        }

        const eventos = [

            'click',
            'touchstart',
            'mousedown',
            'pointerdown',
            'keydown',
            'wheel',
            'scroll',
            'focus'

        ];

        eventos.forEach(
            function (evento) {

                document.addEventListener(
                    evento,
                    function () {

                        interactionEvents++;

                        emitirEvento(
                            'andyads:interaction',
                            {
                                tipo: evento
                            }
                        );

                        loadAd(
                            'interaction-' +
                            evento
                        );

                    },
                    {
                        passive: true,
                        capture: true
                    }
                );

            }
        );
    }

    // =========================================================
    // VISIBILIDAD DE PÁGINA
    // =========================================================

    function iniciarVisibility() {

        if (!CONFIG.VISIBILITY) {
            return;
        }

        document.addEventListener(
            'visibilitychange',
            function () {

                if (
                    !document.hidden
                ) {

                    registrarLog(
                        'VISIBILITY',
                        'Página visible'
                    );

                    emitirEvento(
                        'andyads:visible'
                    );

                    loadAd(
                        'visibility'
                    );
                }
            }
        );
    }

    // =========================================================
    // PAGE SHOW
    // =========================================================

    window.addEventListener(
        'pageshow',
        function () {

            pageLoads++;

            registrarLog(
                'PAGESHOW',
                'Página restaurada/mostrada'
            );

            loadAd(
                'pageshow'
            );

        }
    );

    // =========================================================
    // PAGE HIDE
    // =========================================================

    window.addEventListener(
        'pagehide',
        function () {

            emitirEvento(
                'andyads:pagehide'
            );

        }
    );

    // =========================================================
    // REVISIÓN PERIÓDICA DE EMBEDS
    // =========================================================

    let embedInterval = null;

    function iniciarEscaneo() {

        embedInterval =
            setInterval(
                function () {

                    detectEmbeds();
                    comprobarUrl();

                },
                CONFIG.EMBED_SCAN_INTERVAL
            );
    }

    // =========================================================
    // API PÚBLICA
    // =========================================================

    window.AndyAds = {

        // -----------------------------------------------------
        // CARGAR MANUALMENTE
        // -----------------------------------------------------

        load: function () {
            return loadAd(
                'api-manual'
            );
        },

        // -----------------------------------------------------
        // LISTA DE PROVEEDORES
        // -----------------------------------------------------

        providers: function () {

            return AD_SOURCES.slice();

        },

        // -----------------------------------------------------
        // PROVEEDOR ACTUAL
        // -----------------------------------------------------

        currentProvider: function () {

            if (!AD_SOURCES.length) {
                return null;
            }

            return AD_SOURCES[
                providerIndex
            ];

        },

        // -----------------------------------------------------
        // CONTADOR DE ANUNCIOS
        // -----------------------------------------------------

        count: function () {

            limpiarTimestamps();

            return adTimestamps.length;

        },

        // -----------------------------------------------------
        // MÉTRICAS
        // -----------------------------------------------------

        metrics: function () {

            return {

                solicitudesTotales:
                    totalRequests,

                exitosos:
                    successfulLoads,

                fallidos:
                    failedLoads,

                tasaDeExito:
                    totalRequests > 0
                        ? (
                            (
                                successfulLoads /
                                totalRequests
                            ) * 100
                        ).toFixed(2) + '%'
                        : '0%',

                hitsPorProveedor:
                    providerHits.slice(),

                indiceActual:
                    providerIndex,

                cargandoActualmente:
                    loading,

                totalFuentesConfiguradas:
                    AD_SOURCES.length,

                embedsDetectados:
                    embedLoads,

                interacciones:
                    interactionEvents,

                navegaciones:
                    navigationEvents,

                cargasPagina:
                    pageLoads,

                urlActual:
                    location.href

            };

        },

        // -----------------------------------------------------
        // LOGS
        // -----------------------------------------------------

        logs: function () {

            return historyLog.slice();

        },

        // -----------------------------------------------------
        // ÚLTIMA URL
        // -----------------------------------------------------

        url: function () {

            return location.href;

        },

        // -----------------------------------------------------
        // ESTADO
        // -----------------------------------------------------

        status: function () {

            return {

                loading: loading,

                ultimoDisparo:
                    lastFire,

                proveedor:
                    this.currentProvider(),

                anunciosVentana:
                    this.count()

            };

        },

        // -----------------------------------------------------
        // REESCANEAR EMBEDS
        // -----------------------------------------------------

        scan: function () {

            detectEmbeds();

            return true;

        },

        // -----------------------------------------------------
        // RESET
        // -----------------------------------------------------

        reset: function () {

            adTimestamps.length = 0;

            historyLog.length = 0;

            lastFire = 0;

            loading = false;

            totalRequests = 0;

            successfulLoads = 0;

            failedLoads = 0;

            pageLoads = 0;

            embedLoads = 0;

            interactionEvents = 0;

            navigationEvents = 0;

            providerIndex = 0;

            providerHits.fill(0);

            registrarLog(
                'RESET',
                'Sistema reiniciado'
            );

            console.log(
                '[Andy.js] Sistema reiniciado'
            );

        },

        // -----------------------------------------------------
        // CONFIGURACIÓN DE SOLO LECTURA
        // -----------------------------------------------------

        config: function () {

            return Object.assign(
                {},
                CONFIG
            );

        }

    };

    // =========================================================
    // INICIO
    // =========================================================

    function iniciarAndyAds() {

        console.log(
            '[Andy.js] Inicializando sistema...'
        );

        registrarLog(
            'START',
            'AndyAds iniciado'
        );

        iniciarEventos();

        iniciarVisibility();

        interceptarHistory();

        iniciarObserver();

        iniciarEscaneo();

        detectEmbeds();

        // Primera carga
        setTimeout(
            function () {

                loadAd(
                    'initial'
                );

            },
            CONFIG.INITIAL_DELAY
        );

        // Disparo periódico
        setInterval(
            function () {

                loadAd(
                    'interval'
                );

            },
            CONFIG.MIN_INTERVAL
        );

        emitirEvento(
            'andyads:ready'
        );

        console.log(
            '[Andy.js] Sistema iniciado correctamente.'
        );

    }

    // =========================================================
    // ESPERAR DOM
    // =========================================================

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            iniciarAndyAds,
            {
                once: true
            }
        );

    } else {

        iniciarAndyAds();

    }

})();

