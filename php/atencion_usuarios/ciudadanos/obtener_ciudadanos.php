<?php
/**
 * obtener_ciudadanos.php
 * Obtiene todos los ciudadanos registrados
 * NOTA: Primero debemos crear la tabla ciudadanos
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn = $db->getAtencionUsuariosConnection();
    
    // Verificar si la tabla ciudadanos existe
    $checkTable = "SHOW TABLES LIKE 'ciudadanos'";
    $tableExists = $conn->query($checkTable)->rowCount() > 0;
    
    if (!$tableExists) {
        echo json_encode([
            'success' => true,
            'data' => [],
            'message' => 'La tabla ciudadanos aún no existe. Por favor, créela con el script SQL proporcionado.'
        ]);
        exit;
    }
    
    $query = "SELECT * FROM ciudadanos ORDER BY apellidoPaterno, apellidoMaterno, nombre ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $ciudadanos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $ciudadanos
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