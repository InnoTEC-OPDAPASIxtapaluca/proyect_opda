<?php


header('Content-Type: application/json');

// Incluir conexión
require_once dirname(__DIR__) . '/conexion/conexion.php';

// Incluir configuración de correo y template
require_once __DIR__ . '/config_mail_tecnico.php';
require_once __DIR__ . '/template_correo_tecnico.php';

// PHPMailer - Ruta DIRECTA como la tienes
require_once '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'mensaje' => 'Datos inválidos']);
    exit;
}

// Validar campos requeridos
$camposRequeridos = ['nombre', 'apellido_paterno', 'apellido_materno', 'no_nomina', 'correo', 'telefono', 'area_id', 'rol_id'];
foreach ($camposRequeridos as $campo) {
    if (empty($data[$campo])) {
        echo json_encode(['success' => false, 'mensaje' => "El campo $campo es requerido"]);
        exit;
    }
}

try {
    // Verificar conexión
    if (!isset($conn) || !$conn) {
        throw new Exception('No se pudo establecer conexión con la base de datos');
    }
    
    // Verificar si ya existe el usuario
    $checkSql = "SELECT no_nomina FROM usuarios_internos WHERE no_nomina = :no_nomina";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->execute([':no_nomina' => $data['no_nomina']]);
    
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'mensaje' => 'El número de nómina ya está registrado']);
        exit;
    }
    
    // Generar contraseña temporal
    $passwordTemporal = generarPassword();
    $passwordHash = password_hash($passwordTemporal, PASSWORD_DEFAULT);
    
    // Insertar usuario
    $sql = "INSERT INTO usuarios_internos 
            (no_nomina, nombre_s, apellido_paterno, apellido_materno, correo_electronico, num_telefonico, password, area_id, rol_id, fecha_registro)
            VALUES 
            (:no_nomina, :nombre, :apellido_paterno, :apellido_materno, :correo, :telefono, :password, :area_id, :rol_id, NOW())";
    
    $stmt = $conn->prepare($sql);
    $result = $stmt->execute([
        ':no_nomina' => $data['no_nomina'],
        ':nombre' => $data['nombre'],
        ':apellido_paterno' => $data['apellido_paterno'],
        ':apellido_materno' => $data['apellido_materno'],
        ':correo' => $data['correo'],
        ':telefono' => $data['telefono'],
        ':password' => $passwordHash,
        ':area_id' => $data['area_id'],
        ':rol_id' => $data['rol_id']
    ]);
    
    if (!$result) {
        echo json_encode(['success' => false, 'mensaje' => 'Error al insertar usuario']);
        exit;
    }
    
    // Guardar permisos - NUEVA LÓGICA
    if (!empty($data['permisos']) && is_array($data['permisos'])) {
        $dbPermisos = $conn; // 
        
        foreach ($data['permisos'] as $permiso) {
            $idInterfaz = $permiso['id_interfaz'];
            $nombreBoton = isset($permiso['nombre_boton']) ? $permiso['nombre_boton'] : null;
            $campos = isset($permiso['campos']) ? $permiso['campos'] : null;
            
            // 🔥 NUEVA LÓGICA: Si no hay nombre_boton (es NULL o vacío), significa que solo se seleccionó la interfaz
            if (empty($nombreBoton)) {
                // Insertar solo el permiso de interfaz (sin botón específico)
                $sqlPermiso = "INSERT INTO permisos_user 
                               (no_nomina, id_interfaz, nombre_boton, nombre_campo)
                               VALUES 
                               (:no_nomina, :id_interfaz, NULL, NULL)";
                $stmtPermiso = $dbPermisos->prepare($sqlPermiso);
                $stmtPermiso->execute([
                    ':no_nomina' => $data['no_nomina'],
                    ':id_interfaz' => $idInterfaz
                ]);
            } 
            // Si hay nombre_boton pero no campos seleccionados
            else if (!empty($nombreBoton) && (empty($campos) || !is_array($campos))) {
                $sqlPermiso = "INSERT INTO permisos_user 
                               (no_nomina, id_interfaz, nombre_boton, nombre_campo)
                               VALUES 
                               (:no_nomina, :id_interfaz, :nombre_boton, NULL)";
                $stmtPermiso = $dbPermisos->prepare($sqlPermiso);
                $stmtPermiso->execute([
                    ':no_nomina' => $data['no_nomina'],
                    ':id_interfaz' => $idInterfaz,
                    ':nombre_boton' => $nombreBoton
                ]);
            } 
            // Si hay botón Y campos seleccionados
            else if (!empty($nombreBoton) && !empty($campos) && is_array($campos)) {
                foreach ($campos as $campo) {
                    $sqlPermiso = "INSERT INTO permisos_user 
                                   (no_nomina, id_interfaz, nombre_boton, nombre_campo)
                                   VALUES 
                                   (:no_nomina, :id_interfaz, :nombre_boton, :nombre_campo)";
                    $stmtPermiso = $dbPermisos->prepare($sqlPermiso);
                    $stmtPermiso->execute([
                        ':no_nomina' => $data['no_nomina'],
                        ':id_interfaz' => $idInterfaz,
                        ':nombre_boton' => $nombreBoton,
                        ':nombre_campo' => $campo
                    ]);
                }
            }
        }
    }
    
    // Obtener rol para el correo
    $sqlInfo = "SELECT r.rol 
                FROM usuarios_internos u
                LEFT JOIN roles r ON u.rol_id = r.id_rol
                WHERE u.no_nomina = :no_nomina";
    $stmtInfo = $conn->prepare($sqlInfo);
    $stmtInfo->execute([':no_nomina' => $data['no_nomina']]);
    $info = $stmtInfo->fetch(PDO::FETCH_ASSOC);
    
    // FUNCIÓN DE ENVÍO DE CORREO INTEGRADA
    $correoEnviado = false;
    $correoMensaje = '';
    
    try {
        $config = MailConfigTecnico::getConfig();
        
        if (MailConfigTecnico::isValid()) {
            $mail = new PHPMailer(true);
            
            $mail->isSMTP();
            $mail->Host = $config['host'];
            $mail->SMTPAuth = $config['auth'];
            $mail->Username = $config['username'];
            $mail->Password = $config['password'];
            $mail->SMTPSecure = $config['secure'];
            $mail->Port = $config['port'];
            $mail->CharSet = 'UTF-8';
            
            $mail->setFrom($config['from_email'], $config['from_name']);
            $mail->addAddress($data['correo'], $data['nombre'] . ' ' . $data['apellido_paterno']);
            $mail->addReplyTo($config['from_email'], $config['from_name']);
            
            $mail->isHTML(true);
            $mail->Subject = '🏢 OPDAPAS IXTAPALUCA - Bienvenido al Sistema';
            
            $datosCorreo = [
                'nombre' => $data['nombre'],
                'apellido_paterno' => $data['apellido_paterno'],
                'apellido_materno' => $data['apellido_materno'],
                'identificador' => $data['no_nomina'],
                'rol' => $info['rol'] ?? 'SIN ROL',
                'correo' => $data['correo']
            ];
            
            $mail->Body = generarTemplateCorreoTecnico($datosCorreo, $passwordTemporal);
            $mail->AltBody = "Bienvenido al sistema. Su usuario es: {$data['no_nomina']} y su contraseña temporal es: {$passwordTemporal}";
            
            $mail->send();
            $correoEnviado = true;
        } else {
            $correoMensaje = 'Configuración de correo inválida';
        }
    } catch (Exception $e) {
        $correoMensaje = $mail->ErrorInfo;
        error_log("Error al enviar correo: " . $e->getMessage());
        $correoEnviado = false;
    }
    
    // ÉXITO
    echo json_encode([
        'success' => true,
        'mensaje' => 'Usuario creado exitosamente' . ($correoEnviado ? '' : ' (El correo no pudo ser enviado)'),
        'correo_enviado' => $correoEnviado
    ]);
    
} catch(PDOException $e) {
    error_log("Error PDO: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    error_log("Error general: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}

function generarPassword($longitud = 10) {
    $caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    return substr(str_shuffle($caracteres), 0, $longitud);
}
?>