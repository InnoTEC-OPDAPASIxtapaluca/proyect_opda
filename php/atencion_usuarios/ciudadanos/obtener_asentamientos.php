<?php
/**
 * obtener_asentamientos.php
 * Obtiene todos los asentamientos de la tabla asentamientos
 * Retorna JSON con formato: [{"IDasentamiento": "001", "ASENTAMIENTO": "CENTRO", "MUNICIPIO": "IXTAPALUCA", "TIPO_ASENTAMIENTO": "URBANO"}, ...]
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn = $db->getAtencionUsuariosConnection();
    
    $query = "SELECT IDasentamiento, ASENTAMIENTO, MUNICIPIO, TIPO_ASENTAMIENTO 
              FROM asentamientos 
              ORDER BY ASENTAMIENTO ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $asentamientos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $asentamientos
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>