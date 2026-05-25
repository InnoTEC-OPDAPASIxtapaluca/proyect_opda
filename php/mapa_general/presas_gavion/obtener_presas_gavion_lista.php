<?php
// php/mapa_general/presas_gavion/obtener_presas_gavion_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDPRESAS, Nombre, Descripcion, LATITUD, LONGITUD, WKT, Icono 
              FROM presas_gavion 
              WHERE (LATITUD IS NOT NULL OR WKT IS NOT NULL)
              ORDER BY Nombre";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $presas = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Verificar si tiene coordenadas válidas
        $tieneCoordenadas = false;
        
        if (!empty($row['WKT']) && strpos($row['WKT'], 'POINT') === 0) {
            $tieneCoordenadas = true;
        } elseif (!empty($row['LATITUD']) && !empty($row['LONGITUD']) && $row['LATITUD'] != 0 && $row['LONGITUD'] != 0) {
            $tieneCoordenadas = true;
        }
        
        if (!$tieneCoordenadas) {
            continue;
        }
        
        $presas[] = [
            'id' => $row['IDPRESAS'],
            'nombre' => $row['Nombre'],
            'descripcion' => $row['Descripcion'] ?? 'Presa de Gavión',
            'icono' => $row['Icono'] ?? 'presas_gavion'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'presas' => $presas,
        'total' => count($presas)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>