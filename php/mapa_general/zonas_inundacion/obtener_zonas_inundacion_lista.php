<?php
// php/mapa_general/zonas_inundacion/obtener_zonas_inundacion_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT Nombre, `Descripcion/Problematica` as problematica, WKT 
              FROM zonas_inundacion 
              WHERE WKT LIKE 'POLYGON%'
              ORDER BY Nombre";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $zonas = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $zonas[] = [
            'nombre' => $row['Nombre'],
            'problematica' => $row['problematica']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'zonas' => $zonas,
        'total' => count($zonas)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>