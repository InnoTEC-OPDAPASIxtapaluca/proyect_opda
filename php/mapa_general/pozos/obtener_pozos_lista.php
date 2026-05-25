<?php
// php/mapa_general/pozos/obtener_pozos_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT idpozos, NUMERO_DE_POZO, POZO, ESTATUS, ESTADO, GASTO_LITROS, 
                     ZONA_DE_INFLUENCIA, LATITUD, LONGITUD, WKT
              FROM pozos 
              WHERE (LATITUD IS NOT NULL OR WKT IS NOT NULL)
              ORDER BY POZO";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $pozos = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Verificar si tiene coordenadas válidas
        $tieneCoordenadas = false;
        
        if (!empty($row['WKT']) && strpos($row['WKT'], 'POINT') === 0) {
            $tieneCoordenadas = true;
        } elseif (!empty($row['LATITUD']) && !empty($row['LONGITUD']) && $row['LATITUD'] != 0 && $row['LONGITUD'] != 0) {
            $tieneCoordenadas = true;
        }
        
        if (!$tieneCoordenadas) {
            continue; // Saltar pozos sin coordenadas
        }
        
        $pozos[] = [
            'id' => $row['idpozos'],
            'numero_pozo' => $row['NUMERO_DE_POZO'],
            'nombre' => $row['POZO'],
            'estatus' => $row['ESTATUS'],
            'estado' => $row['ESTADO'],
            'gasto_litros' => $row['GASTO_LITROS'],
            'zona_influencia' => $row['ZONA_DE_INFLUENCIA']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'pozos' => $pozos,
        'total' => count($pozos)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>