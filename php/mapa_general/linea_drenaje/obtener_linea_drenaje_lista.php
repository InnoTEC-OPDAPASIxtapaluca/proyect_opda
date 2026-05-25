<?php
// php/mapa_general/linea_drenaje/obtener_linea_drenaje_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDLINEADRENAJE, CALLE, DIAMETRO, Descripcion, COLONIA, WKT 
              FROM linea_drenaje 
              WHERE WKT LIKE 'LINESTRING%'
              ORDER BY CALLE";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $lineas = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Calcular longitud aproximada
        $longitud_km = calcularLongitudDesdeWKT($row['WKT']);
        
        $lineas[] = [
            'id' => $row['IDLINEADRENAJE'],
            'calle' => $row['CALLE'],
            'diametro' => $row['DIAMETRO'],
            'descripcion' => $row['Descripcion'],
            'colonia' => $row['COLONIA'],
            'longitud_km' => $longitud_km
        ];
    }
    
    echo json_encode([
        'success' => true,
        'lineas' => $lineas,
        'total' => count($lineas)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function calcularLongitudDesdeWKT($wkt) {
    if (!$wkt || strpos($wkt, 'LINESTRING') !== 0) return null;
    
    preg_match('/LINESTRING\s*\(\s*(.*?)\s*\)/', $wkt, $matches);
    if (!isset($matches[1])) return null;
    
    $coordsStr = $matches[1];
    $pares = explode(',', $coordsStr);
    $coordenadas = [];
    
    foreach ($pares as $par) {
        $coord = preg_split('/\s+/', trim($par));
        if (count($coord) >= 2) {
            $longitud = floatval($coord[0]);
            $latitud = floatval($coord[1]);
            $coordenadas[] = ['lat' => $latitud, 'lng' => $longitud];
        }
    }
    
    $longitud_total = 0;
    for ($i = 0; $i < count($coordenadas) - 1; $i++) {
        $longitud_total += haversineDistance(
            $coordenadas[$i]['lat'], $coordenadas[$i]['lng'],
            $coordenadas[$i + 1]['lat'], $coordenadas[$i + 1]['lng']
        );
    }
    
    return round($longitud_total, 3);
}

function haversineDistance($lat1, $lng1, $lat2, $lng2) {
    $earthRadius = 1; // km
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLng / 2) * sin($dLng / 2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    
    return $earthRadius * $c;
}
?>