<?php
// php/conexion/crear_usuario.php
include 'conexion.php';

$password = "24092004.JGL";
$hashed_password = password_hash($password, PASSWORD_BCRYPT);
// BCRYPT es el método más seguro actualmente

echo "Contraseña original: " . $password . "<br>";
echo "Hash generado: " . $hashed_password . "<br><br>";

// Verificar si el usuario existe
try {
    $check = $conn->prepare("SELECT * FROM usuarios_internos WHERE no_nomina = '202219147'");
    $check->execute();
    
    if ($check->rowCount() > 0) {
        $sql = "UPDATE usuarios_internos SET password = :password WHERE no_nomina = '202219147'";
        $stmt = $conn->prepare($sql);
        $stmt->execute([':password' => $hashed_password]);
        echo "Usuario ACTUALIZADO correctamente con el hash BCRYPT";
    } else {
        // Insertar usuario si no existe
        $sql = "INSERT INTO usuarios_internos (no_nomina, nombre_s, apellido_paterno, apellido_materno, area_id, rol_id, correo_electronico, num_telefonico, password, num_inicio, fecha_registro) 
                VALUES ('202219147', 'JESUS', 'GUZMAN', 'LOPEZ', 1, 1, 'jesusguzman09796@gmail.com', '5574479746', :password, 1, NOW())";
        $stmt = $conn->prepare($sql);
        $stmt->execute([':password' => $hashed_password]);
        echo "Usuario CREADO correctamente con el hash BCRYPT";
    }
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>