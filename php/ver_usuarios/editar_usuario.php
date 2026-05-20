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

$no_nomina_original = $data['no_nomina'];
$nueva_matricula = $data['nueva_matricula'] ?? $no_nomina_original;

try {
    $conn->beginTransaction();
    
    // 1. Verificar si la nueva matrícula ya existe (si cambió)
    if ($nueva_matricula !== $no_nomina_original) {
        $sqlCheck = "SELECT COUNT(*) FROM usuarios_internos WHERE no_nomina = :nueva_matricula";
        $stmtCheck = $conn->prepare($sqlCheck);
        $stmtCheck->execute([':nueva_matricula' => $nueva_matricula]);
        if ($stmtCheck->fetchColumn() > 0) {
            echo json_encode(['success' => false, 'mensaje' => 'La nueva matrícula ya existe en el sistema']);
            $conn->rollBack();
            exit;
        }
    }
    
    // 2. Actualizar usuario con posible cambio de matrícula
    $sql = "UPDATE usuarios_internos SET 
                no_nomina = :nueva_matricula,
                nombre_s = :nombre,
                apellido_paterno = :apellido_paterno,
                apellido_materno = :apellido_materno,
                area_id = :area_id,
                rol_id = :rol_id,
                correo_electronico = :correo,
                num_telefonico = :telefono
            WHERE no_nomina = :no_nomina_original";
    
    $stmt = $conn->prepare($sql);
    $result = $stmt->execute([
        ':nueva_matricula' => $nueva_matricula,
        ':nombre' => $data['nombre'],
        ':apellido_paterno' => $data['apellido_paterno'],
        ':apellido_materno' => $data['apellido_materno'],
        ':area_id' => $data['area_id'],
        ':rol_id' => $data['rol_id'],
        ':correo' => $data['correo'],
        ':telefono' => $data['telefono'],
        ':no_nomina_original' => $no_nomina_original
    ]);
    
    // NOTA: Los permisos ahora están integrados en la base de datos principal
    // No es necesario actualizar una tabla separada de permisos
    
    $conn->commit();
    
    echo json_encode(['success' => true, 'mensaje' => 'Usuario actualizado correctamente']);
    
} catch(PDOException $e) {
    $conn->rollBack();
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>