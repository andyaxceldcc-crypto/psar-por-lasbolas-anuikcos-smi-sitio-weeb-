<?php
// Permitir peticiones (CORS) si tu script está en otro subdominio o web
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Si es una petición OPTIONS (preflight de CORS), la respondemos y salimos
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtener los datos JSON enviados por el script
    $inputData = file_get_contents('php://input');
    $data = json_decode($inputData, true);

    if ($data) {
        $sessionId = $data['session'] ?? 'desconocida';
        $fingerprint = $data['fingerprint'] ?? [];
        $bots = $data['bots'] ?? [];
        
        // Datos adicionales del cliente (IP, navegador)
        $ipCliente = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $fechaHora = date('Y-m-d H:i:s');

        // Estructura para guardar o procesar
        $registro = [
            'fecha' => $fechaHora,
            'ip' => $ipCliente,
            'user_agent' => $userAgent,
            'session_id' => $sessionId,
            'fingerprint' => $fingerprint,
            'bots' => $bots
        ];

        // Ejemplo: Guardar los datos en un archivo de texto JSON (o guárdalos en MySQL/PostgreSQL)
        $archivoLog = 'registros_recoleccion.log';
        file_put_contents($archivoLog, json_encode($registro) . PHP_EOL, FILE_APPEND);

        // Responder al cliente que todo OK
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Datos recibidos correctamente']);
        exit;
    }
}

http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'Datos inválidos']);
?>
