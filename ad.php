<?php
// Indicar que lo que responde este PHP es un archivo JavaScript
header('Content-Type: application/javascript; charset=utf-8');

// Opcional: Puedes registrar qué anuncio fue solicitado y cuándo
$idAd = $_GET['id'] ?? 'default';
$timestamp = $_GET['_'] ?? time();

// Aquí generas dinámicamente el código JS que ejecutará el navegador del usuario
// Por ejemplo, inyectar un banner publicitario o un iframe de forma dinámica:
?>
(function() {
    console.log('[AdServer PHP] Sirviendo anuncio ID: <?php echo htmlspecialchars($idAd, ENT_QUOTES, 'UTF-8'); ?>');
    
    // Ejemplo: Crear un elemento publicitario dinámico en la página del usuario
    try {
        var adContainer = document.getElementById('andy-ad-zone') || document.body;
        var banner = document.createElement('div');
        banner.style.width = '100%';
        banner.style.textAlign = 'center';
        banner.style.margin = '10px 0';
        banner.innerHTML = '<iframe src="https://tu-dominio.com/anuncio-contenido.html" width="728" height="90" frameborder="0" scrolling="no"></iframe>';
        adContainer.appendChild(banner);
    } catch(e) {
        console.error('[AdServer Error]', e);
    }
})();
