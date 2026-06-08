<?php
/**
 * guardar_dependencia.php
 * Guarda una nueva dependencia en la tabla dependencias
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'No se recibieron datos válidos']);
    exit;
}

try {
    $conn = $db->getAtencionUsuariosConnection();
    
    // Generar nuevo ID
    $queryMaxId = "SELECT IDDEPENDENCIA FROM dependencias ORDER BY IDDEPENDENCIA DESC LIMIT 1";
    $stmtMax = $conn->prepare($queryMaxId);
    $stmtMax->execute();
    $lastId = $stmtMax->fetch(PDO::FETCH_ASSOC);
    
    if ($lastId && isset($lastId['IDDEPENDENCIA'])) {
        $num = intval(substr($lastId['IDDEPENDENCIA'], 4)) + 1;
        $nuevoId = 'DEPE' . str_pad($num, 6, '0', STR_PAD_LEFT);
    } else {
        $nuevoId = 'DEPE000001';
    }
    
    $query = "INSERT INTO dependencias (IDDEPENDENCIA, DEPENDENCIA) VALUES (:id, :dependencia)";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $nuevoId);
    $stmt->bindParam(':dependencia', $input['dependencia']);
    
    $stmt->execute();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'IDDEPENDENCIA' => $nuevoId,
            'DEPENDENCIA' => $input['dependencia']
        ],
        'message' => 'Dependencia guardada correctamente'
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error en la base de datos: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>