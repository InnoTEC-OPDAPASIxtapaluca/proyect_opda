<?php
header('Content-Type: application/json');
require_once dirname(__DIR__) . '/conexion/conexion.php';

$id_interfaz = $_GET['id_interfaz'] ?? null;

if (!$id_interfaz) {
    echo json_encode(['success' => false, 'mensaje' => 'ID de interfaz requerido']);
    exit;
}

try {
    $sql = "SELECT id, nombre_boton FROM accesos_op.botones WHERE id_interfaz = :id_interfaz";
    $stmt = $conn_accesos->prepare($sql);
    $stmt->execute([':id_interfaz' => $id_interfaz]);
    $botonesRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $botonesSeparados = [];
    
    foreach ($botonesRaw as $boton) {
        // Separar la cadena por comas
        $botonesArray = explode(',', $boton['nombre_boton']);
        
        // Limpiar espacios en blanco
        $botonesArray = array_map('trim', $botonesArray);
        
        // Crear un objeto por cada botón
        foreach ($botonesArray as $nombreBoton) {
            if (!empty($nombreBoton)) {
                $botonesSeparados[] = [
                    'id' => $boton['id'],
                    'nombre_boton' => $nombreBoton
                ];
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'botones' => $botonesSeparados
    ]);
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
}
?>