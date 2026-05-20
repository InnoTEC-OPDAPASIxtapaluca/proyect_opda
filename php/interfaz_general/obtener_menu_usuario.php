<?php
// php/interfaz_general/obtener_menu_usuario.php
header('Content-Type: application/json');
session_start();

require_once dirname(__DIR__) . '/conexion/conexion.php';

if (!isset($_SESSION['no_nomina'])) {
    echo json_encode(['success' => false, 'mensaje' => 'No hay sesión']);
    exit;
}

$no_nomina = $_SESSION['no_nomina'];

try {
    // ============================================
    // OBTENER DATOS DEL USUARIO (incluye es_maestro)
    // ============================================
    $sql_usuario = "SELECT u.rol_id, u.area_id, u.es_maestro, r.rol, a.area 
                    FROM usuarios_internos u
                    LEFT JOIN roles r ON u.rol_id = r.id_rol
                    LEFT JOIN areas a ON u.area_id = a.id_area
                    WHERE u.no_nomina = :no_nomina";
    $stmt = $conn->prepare($sql_usuario);
    $stmt->execute([':no_nomina' => $no_nomina]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $rol = strtoupper($usuario['rol'] ?? '');
    $area = strtoupper($usuario['area'] ?? '');
    $es_maestro = ($usuario['es_maestro'] ?? 0) == 1;
    
    // ============================================
    // USUARIO MAESTRO: ACCESO TOTAL (detectado desde BD)
    // ============================================
    if ($es_maestro) {
        // Obtener TODAS las interfaces
        $sql_interfaces = "SELECT id, nombre_interfaz, ruta FROM interfaces";
        $stmt_interfaces = $conn_accesos->prepare($sql_interfaces);
        $stmt_interfaces->execute();
        $todas_interfaces = $stmt_interfaces->fetchAll(PDO::FETCH_ASSOC);
        
        $menu = [];
        foreach ($todas_interfaces as $interfaz) {
            // Obtener todos los botones de esta interfaz
            $sql_botones = "SELECT nombre_boton FROM botones WHERE id_interfaz = :id_interfaz";
            $stmt_botones = $conn_accesos->prepare($sql_botones);
            $stmt_botones->execute([':id_interfaz' => $interfaz['id']]);
            $botones = $stmt_botones->fetchAll(PDO::FETCH_COLUMN);
            $botones_str = implode(',', $botones);
            
            // Obtener campos organizados por botón
            $sql_campos = "SELECT nombre_campo, nombre_boton FROM campos WHERE id_interfaz = :id_interfaz";
            $stmt_campos = $conn_accesos->prepare($sql_campos);
            $stmt_campos->execute([':id_interfaz' => $interfaz['id']]);
            $campos_data = $stmt_campos->fetchAll(PDO::FETCH_ASSOC);
            
            // Organizar campos por botón
            $campos_por_boton = [];
            foreach ($campos_data as $campo) {
                $boton = $campo['nombre_boton'];
                if (!isset($campos_por_boton[$boton])) {
                    $campos_por_boton[$boton] = [];
                }
                $campos_por_boton[$boton][] = $campo['nombre_campo'];
            }
            
            // Convertir arrays a strings con comas
            foreach ($campos_por_boton as $boton => $campos_array) {
                $campos_por_boton[$boton] = implode(',', $campos_array);
            }
            
            $menu[] = [
                'id' => $interfaz['id'],
                'nombre' => strtoupper(str_replace('_', ' ', $interfaz['nombre_interfaz'])),
                'ruta' => $interfaz['ruta'],
                'botones' => $botones_str,
                'campos_por_boton' => $campos_por_boton
            ];
        }
        
        echo json_encode([
            'success' => true,
            'menu' => $menu,
            'usuario' => [
                'no_nomina' => $no_nomina,
                'nombre_completo' => $_SESSION['nombre_completo'] ?? '',
                'rol' => $rol,
                'area' => $area,
                'tipo' => 'MAESTRO'
            ]
        ]);
        exit;
    }
    
    // ============================================
    // RESTO DE USUARIOS (NO MAESTROS)
    // LOS PERMISOS AHORA ESTÁN EN login_op (misma BD que $conn)
    // ============================================
    
    // Obtener permisos específicos DESDE login_op (tabla permisos_user)
    $sql_permisos = "SELECT id_interfaz, nombre_boton, nombre_campo 
                     FROM permisos_user 
                     WHERE no_nomina = :no_nomina";
    $stmt_permisos = $conn->prepare($sql_permisos);
    $stmt_permisos->execute([':no_nomina' => $no_nomina]);
    $permisos_especificos = $stmt_permisos->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($permisos_especificos)) {
        echo json_encode([
            'success' => true,
            'menu' => [],
            'usuario' => [
                'no_nomina' => $no_nomina,
                'nombre_completo' => $_SESSION['nombre_completo'] ?? '',
                'rol' => $rol,
                'area' => $area,
                'tipo' => 'SIN_PERMISOS'
            ]
        ]);
        exit;
    }
    
    // Agrupar permisos por interfaz
    $interfaces_permitidas = [];
    foreach ($permisos_especificos as $p) {
        $id_interfaz = $p['id_interfaz'];
        $nombre_boton = $p['nombre_boton'];
        $campos = $p['nombre_campo'];
        
        if (!isset($interfaces_permitidas[$id_interfaz])) {
            $interfaces_permitidas[$id_interfaz] = [
                'botones' => [],
                'campos_por_boton' => []
            ];
        }
        
        if (!in_array($nombre_boton, $interfaces_permitidas[$id_interfaz]['botones'])) {
            $interfaces_permitidas[$id_interfaz]['botones'][] = $nombre_boton;
        }
        
        $interfaces_permitidas[$id_interfaz]['campos_por_boton'][$nombre_boton] = $campos;
    }
    
    $ids_permitidos = array_keys($interfaces_permitidas);
    
    if (empty($ids_permitidos)) {
        echo json_encode([
            'success' => true,
            'menu' => [],
            'usuario' => [
                'no_nomina' => $no_nomina,
                'nombre_completo' => $_SESSION['nombre_completo'] ?? '',
                'rol' => $rol,
                'area' => $area,
                'tipo' => 'SIN_PERMISOS'
            ]
        ]);
        exit;
    }
    
    $placeholders = implode(',', array_fill(0, count($ids_permitidos), '?'));
    $sql_interfaces = "SELECT id, nombre_interfaz, ruta 
                       FROM accesos_op.interfaces 
                       WHERE id IN ($placeholders)";
    $stmt_interfaces = $conn_accesos->prepare($sql_interfaces);
    $stmt_interfaces->execute($ids_permitidos);
    $interfaces_usuario = $stmt_interfaces->fetchAll(PDO::FETCH_ASSOC);
    
    $menu = [];
    foreach ($interfaces_usuario as $interfaz) {
        $id = $interfaz['id'];
        $menu[] = [
            'id' => $id,
            'nombre' => strtoupper(str_replace('_', ' ', $interfaz['nombre_interfaz'])),
            'ruta' => $interfaz['ruta'],
            'botones' => implode(',', $interfaces_permitidas[$id]['botones']),
            'campos_por_boton' => $interfaces_permitidas[$id]['campos_por_boton']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'menu' => $menu,
        'usuario' => [
            'no_nomina' => $no_nomina,
            'nombre_completo' => $_SESSION['nombre_completo'] ?? '',
            'rol' => $rol,
            'area' => $area,
            'tipo' => 'PERMISOS_CONFIGURADOS'
        ]
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false, 
        'mensaje' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
}
?>