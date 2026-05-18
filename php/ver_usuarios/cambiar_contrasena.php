<?php
// php/ver_usuarios/cambiar_contrasena.php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/conexion/conexion.php';
require_once dirname(__DIR__) . '/agregar_usuario/config_mail_tecnico.php';
require_once dirname(__DIR__) . '/agregar_usuario/template_correo_tecnico.php';

require_once '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['no_nomina'])) {
    echo json_encode(['success' => false, 'mensaje' => 'Datos inválidos']);
    exit;
}

$no_nomina = $data['no_nomina'];

try {
    // Obtener datos del usuario
    $sql = "SELECT u.nombre_s, u.apellido_paterno, u.apellido_materno, u.correo_electronico, r.rol
            FROM usuarios_internos u
            LEFT JOIN roles r ON u.rol_id = r.id_rol
            WHERE u.no_nomina = :no_nomina";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':no_nomina' => $no_nomina]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario) {
        echo json_encode(['success' => false, 'mensaje' => 'Usuario no encontrado']);
        exit;
    }
    
    // Generar nueva contraseña
    function generarPassword($longitud = 10) {
        $caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
        return substr(str_shuffle($caracteres), 0, $longitud);
    }
    
    $nuevaPassword = generarPassword();
    $passwordHash = password_hash($nuevaPassword, PASSWORD_DEFAULT);
    
    // Actualizar contraseña y resetear num_inicio a 0
    $sqlUpdate = "UPDATE usuarios_internos SET password = :password, num_inicio = 0 WHERE no_nomina = :no_nomina";
    $stmtUpdate = $conn->prepare($sqlUpdate);
    $stmtUpdate->execute([
        ':password' => $passwordHash,
        ':no_nomina' => $no_nomina
    ]);
    
    // Enviar correo
    $correoEnviado = false;
    $config = MailConfigTecnico::getConfig();
    
    if (MailConfigTecnico::isValid() && !empty($usuario['correo_electronico'])) {
        try {
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
            $mail->addAddress($usuario['correo_electronico'], $usuario['nombre_s'] . ' ' . $usuario['apellido_paterno']);
            
            $mail->isHTML(true);
            $mail->Subject = '🔐 OPDAPAS IXTAPALUCA - Restablecimiento de contraseña';
            
            $datosCorreo = [
                'nombre' => $usuario['nombre_s'],
                'apellido_paterno' => $usuario['apellido_paterno'],
                'apellido_materno' => $usuario['apellido_materno'],
                'identificador' => $no_nomina,
                'rol' => $usuario['rol'] ?? 'SIN ROL',
                'correo' => $usuario['correo_electronico']
            ];
            
            $mail->Body = generarTemplateCorreoTecnico($datosCorreo, $nuevaPassword);
            $mail->AltBody = "Su nueva contraseña temporal es: {$nuevaPassword}";
            
            $mail->send();
            $correoEnviado = true;
        } catch (Exception $e) {
            error_log("Error enviando correo: " . $e->getMessage());
        }
    }
    
    echo json_encode([
        'success' => true,
        'mensaje' => $correoEnviado ? 'Contraseña cambiada y enviada por correo' : 'Contraseña cambiada pero no se pudo enviar el correo',
        'correo_enviado' => $correoEnviado
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>