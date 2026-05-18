<?php
header('Content-Type: application/json');
require_once dirname(__DIR__) . '/conexion/conexion.php';

$id_interfaz = $_GET['id_interfaz'] ?? null;
$nombre_boton = $_GET['nombre_boton'] ?? null;

if (!$id_interfaz || !$nombre_boton) {
    echo json_encode(['success' => false, 'mensaje' => 'Parámetros incompletos']);
    exit;
}

try {
    // Buscar el registro que CONTENGA este botón en la cadena
    $sql = "SELECT id, nombre_campo 
            FROM accesos_op.campos 
            WHERE id_interfaz = :id_interfaz 
            AND FIND_IN_SET(:nombre_boton, nombre_boton) > 0
            ORDER BY nombre_campo";
    
    $stmt = $conn_accesos->prepare($sql);
    $stmt->execute([
        ':id_interfaz' => $id_interfaz,
        ':nombre_boton' => $nombre_boton
    ]);
    $campos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si no encuentra con FIND_IN_SET, probar con LIKE (más lento pero compatible)
    if (empty($campos)) {
        $sqlLike = "SELECT id, nombre_campo 
                    FROM accesos_op.campos 
                    WHERE id_interfaz = :id_interfaz 
                    AND (nombre_campo LIKE :patron1 OR nombre_campo LIKE :patron2 OR nombre_campo = :nombre_boton_exacto)
                    ORDER BY nombre_campo";
        
        $patronInicio = $nombre_boton . ',%';
        $patronFin = '%,' . $nombre_boton;
        
        $stmt = $conn_accesos->prepare($sqlLike);
        $stmt->execute([
            ':id_interfaz' => $id_interfaz,
            ':patron1' => $patronInicio,
            ':patron2' => $patronFin,
            ':nombre_boton_exacto' => $nombre_boton
        ]);
        $campos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Los campos también pueden venir como cadena separada por comas
    // Necesitamos separarlos también
    $camposSeparados = [];
    foreach ($campos as $campo) {
        $camposArray = explode(',', $campo['nombre_campo']);
        $camposArray = array_map('trim', $camposArray);
        
        foreach ($camposArray as $nombreCampo) {
            if (!empty($nombreCampo)) {
                $camposSeparados[] = [
                    'id' => $campo['id'],
                    'nombre_campo' => $nombreCampo
                ];
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'campos' => $camposSeparados
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>