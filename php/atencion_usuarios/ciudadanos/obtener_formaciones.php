<?php
/**
 * obtener_formaciones.php
 * Obtiene todas las formaciones académicas de la tabla formacion_academica
 * Retorna JSON con formato: [{"id_formacion": 1, "formacion": "PRIMARIA"}, ...]
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    // Usar la conexión de atencion_usuarios_op
    $conn = $db->getAtencionUsuariosConnection();
    
    // Consultar formaciones académicas
    $query = "SELECT id_formacion, formacion FROM formacion_academica ORDER BY formacion ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $formaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $formaciones
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