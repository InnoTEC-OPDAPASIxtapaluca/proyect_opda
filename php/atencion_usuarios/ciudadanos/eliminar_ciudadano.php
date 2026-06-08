<?php
/**
 * eliminar_ciudadano.php
 * Elimina un ciudadano de la tabla ciudadanos por ID
 * Recibe ID por POST o DELETE
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

// Leer datos JSON del cuerpo de la petición
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'No se recibió el ID del ciudadano'
    ]);
    exit;
}

$id = $input['id'];

try {
    $conn = $db->getAtencionUsuariosConnection();
    
    // Verificar si la tabla ciudadanos existe
    $checkTable = "SHOW TABLES LIKE 'ciudadanos'";
    $tableExists = $conn->query($checkTable)->rowCount() > 0;
    
    if (!$tableExists) {
        echo json_encode([
            'success' => false,
            'error' => 'La tabla ciudadanos no existe.'
        ]);
        exit;
    }
    
    $query = "DELETE FROM ciudadanos WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Ciudadano eliminado correctamente'
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