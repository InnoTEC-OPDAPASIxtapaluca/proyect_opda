<?php
/**
 * guardar_asentamiento.php
 * Guarda un nuevo asentamiento en la tabla asentamientos
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

// Iniciar sesión para obtener la nómina del usuario logueado
session_start();

// Usar 'no_nomina' como está en tu sistema (ver obtener_usuario_actual.php)
$no_nomina = isset($_SESSION['no_nomina']) ? $_SESSION['no_nomina'] : 'INNOVACION';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'No se recibieron datos válidos']);
    exit;
}

try {
    $conn = $db->getAtencionUsuariosConnection();
    
    // Generar nuevo ID
    $queryMaxId = "SELECT IDasentamiento FROM asentamientos ORDER BY IDasentamiento DESC LIMIT 1";
    $stmtMax = $conn->prepare($queryMaxId);
    $stmtMax->execute();
    $lastId = $stmtMax->fetch(PDO::FETCH_ASSOC);
    
    if ($lastId && isset($lastId['IDasentamiento'])) {
        $num = intval(substr($lastId['IDasentamiento'], 4)) + 1;
        $nuevoId = 'ASEN' . str_pad($num, 6, '0', STR_PAD_LEFT);
    } else {
        $nuevoId = 'ASEN000001';
    }
    
    $query = "INSERT INTO asentamientos (
                IDasentamiento, ASENTAMIENTO, MUNICIPIO, TIPO_ASENTAMIENTO, 
                TIPO_LOCALIDAD, FECHA_CARGA, AREA_RESPONSABLE
              ) VALUES (
                :id, :asentamiento, :municipio, :tipo_asentamiento,
                :tipo_localidad, CURDATE(), :area_responsable
              )";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $nuevoId);
    $stmt->bindParam(':asentamiento', $input['asentamiento']);
    $stmt->bindParam(':municipio', $input['municipio']);
    $stmt->bindParam(':tipo_asentamiento', $input['tipo_asentamiento']);
    $stmt->bindParam(':tipo_localidad', $input['tipo_localidad']);
    $stmt->bindParam(':area_responsable', $no_nomina);  // USANDO 'no_nomina'
    
    $stmt->execute();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'IDasentamiento' => $nuevoId,
            'ASENTAMIENTO' => $input['asentamiento'],
            'MUNICIPIO' => $input['municipio'],
            'TIPO_ASENTAMIENTO' => $input['tipo_asentamiento']
        ],
        'message' => 'Asentamiento guardado correctamente'
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error en la base de datos: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>