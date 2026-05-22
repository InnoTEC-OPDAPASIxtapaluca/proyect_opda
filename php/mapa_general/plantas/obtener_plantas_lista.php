<?php
// php/mapa_general/plantas/obtener_plantas_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDPLANTAS, Nombre, ESTATUS, `Capacidad (l/s)` as capacidad, Icono 
              FROM plantas 
              ORDER BY ESTATUS DESC, Nombre";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $plantas = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $plantas[] = [
            'id' => $row['IDPLANTAS'],
            'nombre' => $row['Nombre'],
            'estatus' => $row['ESTATUS'],
            'capacidad' => $row['capacidad'],
            'icono' => $row['Icono'] ?? 'planta'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'plantas' => $plantas,
        'total' => count($plantas)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>