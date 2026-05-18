<?php
header('Content-Type: application/json');
session_start();

// Incluir la conexión a la base de datos
require_once dirname(__DIR__) . '/conexion/conexion.php';

// Verificar si hay sesión activa
$no_nomina = $_SESSION['no_nomina'] ?? null;

if (!$no_nomina) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'No hay sesión activa. Inicia sesión nuevamente.'
    ]);
    exit;
}

try {
    // Incluir el campo es_maestro en la consulta
    $sql = "
        SELECT 
            u.no_nomina,
            u.nombre_s as nombre,
            u.apellido_paterno,
            u.apellido_materno,
            u.correo_electronico,
            u.num_telefonico,
            u.area_id,
            u.rol_id,
            u.es_maestro,
            COALESCE(a.area, 'SIN ÁREA') as area,
            COALESCE(r.rol, 'SIN ROL') as rol
        FROM usuarios_internos u
        LEFT JOIN areas a ON u.area_id = a.id_area
        LEFT JOIN roles r ON u.rol_id = r.id_rol
        WHERE u.no_nomina = :no_nomina
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([':no_nomina' => $no_nomina]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario) {
        // Guardar datos en sesión para uso posterior
        $_SESSION['rol'] = $usuario['rol'];
        $_SESSION['area_id'] = $usuario['area_id'];
        $_SESSION['es_maestro'] = $usuario['es_maestro'] == 1;
        $_SESSION['nombre_completo'] = trim($usuario['nombre'] . ' ' . $usuario['apellido_paterno'] . ' ' . $usuario['apellido_materno']);
        
        echo json_encode([
            'success' => true,
            'usuario' => [
                'no_nomina' => $usuario['no_nomina'],
                'nombre' => $usuario['nombre'],
                'apellido_paterno' => $usuario['apellido_paterno'],
                'apellido_materno' => $usuario['apellido_materno'],
                'rol' => $usuario['rol'],
                'area' => $usuario['area'],
                'es_maestro' => $usuario['es_maestro'] == 1,
                'correo' => $usuario['correo_electronico'],
                'telefono' => $usuario['num_telefonico']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'mensaje' => 'Usuario no encontrado en la base de datos'
        ]);
    }
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error de conexión: ' . $e->getMessage()
    ]);
}
?>