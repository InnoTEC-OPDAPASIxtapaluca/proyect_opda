<?php
// php/ver_usuarios/eliminar_usuario.php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/conexion/conexion.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['no_nomina'])) {
    echo json_encode(['success' => false, 'mensaje' => 'Datos inválidos']);
    exit;
}

$no_nomina = $data['no_nomina'];

// Evitar que el usuario se elimine a sí mismo
if (isset($_SESSION['no_nomina']) && $_SESSION['no_nomina'] === $no_nomina) {
    echo json_encode(['success' => false, 'mensaje' => 'No puedes eliminar tu propio usuario']);
    exit;
}

try {
    $conn->beginTransaction();
    
    // 1. Eliminar permisos en permisos_op
    $sqlPermisos = "DELETE FROM permisos_op.permisos_user WHERE no_nomina = :no_nomina";
    $stmtPermisos = $conn_permisos->prepare($sqlPermisos);
    $stmtPermisos->execute([':no_nomina' => $no_nomina]);
    
    // 2. Eliminar usuario
    $sqlUsuario = "DELETE FROM usuarios_internos WHERE no_nomina = :no_nomina";
    $stmtUsuario = $conn->prepare($sqlUsuario);
    $stmtUsuario->execute([':no_nomina' => $no_nomina]);
    
    $conn->commit();
    
    echo json_encode(['success' => true, 'mensaje' => 'Usuario eliminado correctamente']);
    
} catch(PDOException $e) {
    $conn->rollBack();
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>