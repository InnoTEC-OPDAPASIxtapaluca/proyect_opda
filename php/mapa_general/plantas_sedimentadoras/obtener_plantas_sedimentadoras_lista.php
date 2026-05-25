<?php
// php/mapa_general/plantas_sedimentadoras/obtener_plantas_sedimentadoras_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDPLANSEDI, Nombre, Descripcion, Icono 
              FROM plantas_sedimentadoras 
              ORDER BY Nombre";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $plantas = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $plantas[] = [
            'id' => $row['IDPLANSEDI'],
            'nombre' => $row['Nombre'],
            'descripcion' => $row['Descripcion'] ?? 'Planta sedimentadora',
            'icono' => $row['Icono'] ?? 'plantas_sedimentadoras'
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