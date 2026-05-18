<?php
header('Content-Type: application/json');
require_once dirname(__DIR__) . '/conexion/conexion.php';

try {
    $sql = "SELECT id, nombre_interfaz, ruta FROM accesos_op.interfaces ORDER BY nombre_interfaz";
    $stmt = $conn_accesos->prepare($sql);
    $stmt->execute();
    $interfaces = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'interfaces' => $interfaces
    ]);
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>