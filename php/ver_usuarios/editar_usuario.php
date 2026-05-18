<?php
// php/ver_usuarios/editar_usuario.php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/conexion/conexion.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['no_nomina'])) {
    echo json_encode(['success' => false, 'mensaje' => 'Datos inválidos']);
    exit;
}

try {
    $sql = "UPDATE usuarios_internos SET 
                nombre_s = :nombre,
                apellido_paterno = :apellido_paterno,
                apellido_materno = :apellido_materno,
                area_id = :area_id,
                rol_id = :rol_id,
                correo_electronico = :correo,
                num_telefonico = :telefono
            WHERE no_nomina = :no_nomina";
    
    $stmt = $conn->prepare($sql);
    $result = $stmt->execute([
        ':nombre' => $data['nombre'],
        ':apellido_paterno' => $data['apellido_paterno'],
        ':apellido_materno' => $data['apellido_materno'],
        ':area_id' => $data['area_id'],
        ':rol_id' => $data['rol_id'],
        ':correo' => $data['correo'],
        ':telefono' => $data['telefono'],
        ':no_nomina' => $data['no_nomina']
    ]);
    
    if ($result) {
        echo json_encode(['success' => true, 'mensaje' => 'Usuario actualizado']);
    } else {
        echo json_encode(['success' => false, 'mensaje' => 'Error al actualizar']);
    }
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>