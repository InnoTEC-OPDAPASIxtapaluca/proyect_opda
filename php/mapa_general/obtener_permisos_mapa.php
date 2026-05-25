<?php
// php/mapa_general/obtener_permisos_mapa.php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/conexion/conexion.php';

if (!isset($_SESSION['no_nomina'])) {
    echo json_encode(['success' => false, 'mensaje' => 'No hay sesión activa']);
    exit;
}

$no_nomina = $_SESSION['no_nomina'];
$id_interfaz_mapa = 7; // ID de la interfaz Mapa General

try {
    // Verificar si es usuario MAESTRO
    $sql_usuario = "SELECT es_maestro FROM usuarios_internos WHERE no_nomina = :no_nomina";
    $stmt = $conn->prepare($sql_usuario);
    $stmt->execute([':no_nomina' => $no_nomina]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $es_maestro = ($usuario && $usuario['es_maestro'] == 1);
    
    // Si es MAESTRO, tiene todos los permisos
    if ($es_maestro) {
        echo json_encode([
            'success' => true,
            'tiene_boton_capas' => true,
            'modulos_permitidos' => ['TROLEBUS', 'CARCAMOS', 'PLANTAS', 'CANALES_CIELO_ABIERTO', 'PLANTAS_SEDIMENTADORAS', 'POZOS', 'PRESAS_GAVION', 'TANQUES', 'VALVULAS']
        ]);
        exit;
    }
    
    // Obtener permisos del usuario
    $sql_permisos = "SELECT nombre_boton 
                     FROM permisos_user 
                     WHERE no_nomina = :no_nomina AND id_interfaz = :id_interfaz";
    $stmt = $conn->prepare($sql_permisos);
    $stmt->execute([
        ':no_nomina' => $no_nomina,
        ':id_interfaz' => $id_interfaz_mapa
    ]);
    $permisos = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $tiene_boton_capas = false;
    $modulos_permitidos = [];
    
    foreach ($permisos as $permiso) {
        // Los permisos vienen como cadena separada por comas
        $botones = explode(',', $permiso);
        
        foreach ($botones as $boton) {
            $boton = trim($boton);
            
            if ($boton === 'CAPAS') {
                $tiene_boton_capas = true;
            } elseif ($boton === 'TROLEBUS' && !in_array('TROLEBUS', $modulos_permitidos)) {
                $modulos_permitidos[] = 'TROLEBUS';
            } elseif ($boton === 'CARCAMOS' && !in_array('CARCAMOS', $modulos_permitidos)) {
                $modulos_permitidos[] = 'CARCAMOS';
            } elseif ($boton === 'PLANTAS' && !in_array('PLANTAS', $modulos_permitidos)) {
                $modulos_permitidos[] = 'PLANTAS';
            } elseif ($boton === 'CANALES_CIELO_ABIERTO' && !in_array('CANALES_CIELO_ABIERTO', $modulos_permitidos)) {
                $modulos_permitidos[] = 'CANALES_CIELO_ABIERTO';
            } elseif ($boton === 'PLANTAS_SEDIMENTADORAS' && !in_array('PLANTAS_SEDIMENTADORAS', $modulos_permitidos)) {
                $modulos_permitidos[] = 'PLANTAS_SEDIMENTADORAS';
            } elseif ($boton === 'POZOS' && !in_array('POZOS', $modulos_permitidos)) {
                $modulos_permitidos[] = 'POZOS';
            } elseif ($boton === 'PRESAS_GAVION' && !in_array('PRESAS_GAVION', $modulos_permitidos)) {
                $modulos_permitidos[] = 'PRESAS_GAVION';
            } elseif ($boton === 'TANQUES' && !in_array('TANQUES', $modulos_permitidos)) {
                $modulos_permitidos[] = 'TANQUES';
            } elseif ($boton === 'VALVULAS' && !in_array('VALVULAS', $modulos_permitidos)) {
                $modulos_permitidos[] = 'VALVULAS';
            } 
        }
    }
    
    echo json_encode([
        'success' => true,
        'tiene_boton_capas' => $tiene_boton_capas,
        'modulos_permitidos' => $modulos_permitidos
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
}
?>