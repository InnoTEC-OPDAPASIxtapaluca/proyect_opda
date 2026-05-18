<?php
// php/ver_usuarios/obtener_usuarios.php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/conexion/conexion.php';

if (!isset($_SESSION['no_nomina'])) {
    echo json_encode(['success' => false, 'mensaje' => 'No hay sesión']);
    exit;
}

try {
    $sql = "SELECT 
                u.no_nomina,
                u.nombre_s as nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.correo_electronico as correo,
                u.num_telefonico as telefono,
                u.fecha_registro,
                u.area_id,
                u.rol_id,
                COALESCE(a.area, 'SIN ÁREA') as area,
                COALESCE(r.rol, 'SIN ROL') as rol
            FROM usuarios_internos u
            LEFT JOIN areas a ON u.area_id = a.id_area
            LEFT JOIN roles r ON u.rol_id = r.id_rol
            ORDER BY u.fecha_registro DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'usuarios' => $usuarios
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>