<?php
// php/mapa_general/valvulas/obtener_valvulas_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDVALVULA, Descripcion, DIAMETRO, COLONIA, LATITUD, WKT 
              FROM valvulas 
              WHERE (LATITUD IS NOT NULL OR WKT IS NOT NULL)
              ORDER BY IDVALVULA";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $valvulas = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Verificar si tiene coordenadas válidas
        $tieneCoordenadas = false;
        
        if (!empty($row['WKT']) && strpos($row['WKT'], 'POINT') === 0) {
            $tieneCoordenadas = true;
        } elseif (!empty($row['LATITUD'])) {
            $tieneCoordenadas = true;
        }
        
        if (!$tieneCoordenadas) {
            continue;
        }
        
        // Extraer diámetro
        $diametro = $row['DIAMETRO'];
        if (!$diametro && $row['Descripcion']) {
            preg_match('/(\d+)\s*(pulgadas|pulg|")/i', $row['Descripcion'], $matches);
            if (isset($matches[1])) {
                $diametro = $matches[1] . '"';
            }
        }
        
        $valvulas[] = [
            'id' => $row['IDVALVULA'],
            'descripcion' => $row['Descripcion'],
            'diametro' => $diametro,
            'colonia' => $row['COLONIA']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'valvulas' => $valvulas,
        'total' => count($valvulas)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>