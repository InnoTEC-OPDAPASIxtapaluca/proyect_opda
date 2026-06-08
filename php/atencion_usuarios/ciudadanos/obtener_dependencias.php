<?php
/**
 * obtener_dependencias.php
 * Obtiene todas las dependencias de la tabla dependencias
 * Retorna JSON con formato: [{"IDDEPENDENCIA": "001", "DEPENDENCIA": "OPDAPAS IXTAPALUCA"}, ...]
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn = $db->getAtencionUsuariosConnection();
    
    $query = "SELECT IDDEPENDENCIA, DEPENDENCIA 
              FROM dependencias 
              ORDER BY DEPENDENCIA ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $dependencias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $dependencias
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