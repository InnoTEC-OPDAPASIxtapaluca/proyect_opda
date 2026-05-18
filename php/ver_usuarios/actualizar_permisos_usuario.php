<?php
// php/ver_usuarios/actualizar_permisos_usuario.php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/conexion/conexion.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['no_nomina']) || !isset($data['permisos'])) {
    echo json_encode(['success' => false, 'mensaje' => 'Datos inválidos']);
    exit;
}

$no_nomina = $data['no_nomina'];
$nuevosPermisos = $data['permisos'];

// Evitar que el usuario se modifique sus propios permisos
if (isset($_SESSION['no_nomina']) && $_SESSION['no_nomina'] === $no_nomina) {
    echo json_encode(['success' => false, 'mensaje' => 'No puedes modificar tus propios permisos']);
    exit;
}

try {
    $conn_permisos->beginTransaction();
    
    // 1. Eliminar permisos existentes
    $sqlDelete = "DELETE FROM permisos_op.permisos_user WHERE no_nomina = :no_nomina";
    $stmtDelete = $conn_permisos->prepare($sqlDelete);
    $stmtDelete->execute([':no_nomina' => $no_nomina]);
    
    // 2. Insertar nuevos permisos
    $sqlInsert = "INSERT INTO permisos_op.permisos_user (no_nomina, id_interfaz, nombre_boton, nombre_campo) 
                  VALUES (:no_nomina, :id_interfaz, :nombre_boton, :nombre_campo)";
    $stmtInsert = $conn_permisos->prepare($sqlInsert);
    
    foreach ($nuevosPermisos as $permiso) {
        $idInterfaz = $permiso['id_interfaz'];
        $nombreBoton = $permiso['nombre_boton'];
        $campos = $permiso['campos'] ?? [];
        
        if (empty($nombreBoton)) {
            // Solo permiso de interfaz (sin botón específico)
            $stmtInsert->execute([
                ':no_nomina' => $no_nomina,
                ':id_interfaz' => $idInterfaz,
                ':nombre_boton' => null,
                ':nombre_campo' => null
            ]);
        } else {
            if (empty($campos)) {
                // Permiso de botón sin campos específicos
                $stmtInsert->execute([
                    ':no_nomina' => $no_nomina,
                    ':id_interfaz' => $idInterfaz,
                    ':nombre_boton' => $nombreBoton,
                    ':nombre_campo' => null
                ]);
            } else {
                // Permiso de botón con campos específicos
                foreach ($campos as $campo) {
                    $stmtInsert->execute([
                        ':no_nomina' => $no_nomina,
                        ':id_interfaz' => $idInterfaz,
                        ':nombre_boton' => $nombreBoton,
                        ':nombre_campo' => $campo
                    ]);
                }
            }
        }
    }
    
    $conn_permisos->commit();
    
    echo json_encode(['success' => true, 'mensaje' => 'Permisos actualizados correctamente']);
    
} catch(PDOException $e) {
    $conn_permisos->rollBack();
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>