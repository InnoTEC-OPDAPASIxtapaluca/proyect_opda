<?php
// php/ver_usuarios/obtener_permisos_usuario.php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/conexion/conexion.php';

$no_nomina = $_GET['no_nomina'] ?? null;

if (!$no_nomina) {
    echo json_encode(['success' => false, 'mensaje' => 'No se especificó usuario']);
    exit;
}

try {
    $sql = "SELECT id_interfaz, nombre_boton, nombre_campo 
            FROM permisos_op.permisos_user 
            WHERE no_nomina = :no_nomina";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':no_nomina' => $no_nomina]);
    $permisos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $permisosAgrupados = [];
    
    foreach ($permisos as $p) {
        $idInterfaz = $p['id_interfaz'];
        $nombreBoton = $p['nombre_boton'];
        $nombreCampo = $p['nombre_campo'];
        
        if (!isset($permisosAgrupados[$idInterfaz])) {
            $permisosAgrupados[$idInterfaz] = [];
        }
        
        // Si nombre_boton es NULL, significa que solo tiene permiso de interfaz
        if ($nombreBoton === null) {
            // Marcar que tiene acceso a la interfaz (sin botones específicos)
            $permisosAgrupados[$idInterfaz]['__interfaz_acceso__'] = true;
        } else {
            if (!isset($permisosAgrupados[$idInterfaz][$nombreBoton])) {
                $permisosAgrupados[$idInterfaz][$nombreBoton] = [];
            }
            if ($nombreCampo !== null) {
                $permisosAgrupados[$idInterfaz][$nombreBoton][] = $nombreCampo;
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'permisos' => $permisosAgrupados
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>