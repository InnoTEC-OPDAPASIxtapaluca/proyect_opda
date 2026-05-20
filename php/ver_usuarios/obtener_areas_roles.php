<?php
// php/ver_usuarios/obtener_areas_roles.php
header('Content-Type: application/json');
require_once dirname(__DIR__) . '/conexion/conexion.php';

try {
    $sqlAreas = "SELECT id_area, area FROM areas ORDER BY area";
    $stmtAreas = $conn->prepare($sqlAreas);
    $stmtAreas->execute();
    $areas = $stmtAreas->fetchAll(PDO::FETCH_ASSOC);
    
    $sqlRoles = "SELECT id_rol, rol FROM roles ORDER BY rol";
    $stmtRoles = $conn->prepare($sqlRoles);
    $stmtRoles->execute();
    $roles = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'areas' => $areas,
        'roles' => $roles
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>