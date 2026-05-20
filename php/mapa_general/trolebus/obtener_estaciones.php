<?php
// php/mapa_general/trolebus/obtener_estaciones.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    // Obtener solo las estaciones tipo POINT (no la línea completa)
    $query = "SELECT Nombre, Icono, WKT FROM trolebus WHERE WKT LIKE 'POINT%' ORDER BY Nombre";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $estaciones = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $estaciones[] = [
            'nombre' => $row['Nombre'],
            'icono' => $row['Icono'] ?? 'trolebus'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'estaciones' => $estaciones,
        'total' => count($estaciones)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>