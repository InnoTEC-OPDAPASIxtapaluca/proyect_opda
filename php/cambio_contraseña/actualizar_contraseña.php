<?php
// php/cambio_contraseña/actualizar_contraseña.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once dirname(__DIR__) . '/conexion/conexion.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['nomina']) || !isset($data['new_password'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$nomina = $data['nomina'];
$new_password = $data['new_password'];

if (strlen($new_password) < 6) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
    exit;
}

try {
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    $sql = "UPDATE usuarios_internos 
            SET password = :password, 
                num_inicio = 1 
            WHERE no_nomina = :nomina";
    
    $stmt = $conn->prepare($sql);
    $result = $stmt->execute([
        ':password' => $hashed_password,
        ':nomina' => $nomina
    ]);
    
    if ($result && $stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No se pudo actualizar la contraseña']);
    }
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>