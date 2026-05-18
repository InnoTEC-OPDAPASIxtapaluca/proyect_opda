<?php
// php/login/login.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once dirname(__DIR__) . '/conexion/conexion.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['nomina']) || !isset($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$nomina = $data['nomina'];
$password = $data['password'];

try {
    $sql = "SELECT u.*, a.area, r.rol 
            FROM usuarios_internos u
            LEFT JOIN areas a ON u.area_id = a.id_area
            LEFT JOIN roles r ON u.rol_id = r.id_rol
            WHERE u.no_nomina = :nomina";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([':nomina' => $nomina]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($usuario && password_verify($password, $usuario['password'])) {
        
        // Verificar num_inicio
        if ($usuario['num_inicio'] == 0) {
            echo json_encode([
                'success' => false, 
                'require_password_change' => true,
                'message' => 'Debes cambiar tu contraseña'
            ]);
            exit;
        }
        
        // ============================================
        // CORRECCIÓN: Guardar variables de sesión INDIVIDUALES
        // ============================================
        $_SESSION['no_nomina'] = $usuario['no_nomina'];
        $_SESSION['usuario_id'] = $usuario['no_nomina'];
        $_SESSION['nombre'] = $usuario['nombre_s'];
        $_SESSION['apellido_paterno'] = $usuario['apellido_paterno'];
        $_SESSION['apellido_materno'] = $usuario['apellido_materno'];
        $_SESSION['area'] = $usuario['area'];
        $_SESSION['rol'] = $usuario['rol'];
        $_SESSION['correo'] = $usuario['correo_electronico'];
        
        echo json_encode(['success' => true, 'message' => 'Login exitoso']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Nómina o contraseña incorrectos']);
    }
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>