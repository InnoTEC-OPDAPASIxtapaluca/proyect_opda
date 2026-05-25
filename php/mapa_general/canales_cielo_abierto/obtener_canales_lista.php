<?php
// php/mapa_general/canales_cielo_abierto/obtener_canales_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    // SOLO obtener los canales (filtramos por LINESTRING para la lista)
    $query = "SELECT IDCANALESCIEABI, `NOMBRE DE CANAL`, Nombre, Descripcion, WKT 
              FROM canales_cielo_abierto 
              WHERE WKT LIKE 'LINESTRING%'
              ORDER BY `NOMBRE DE CANAL`";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $canales = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $nombreMostrar = !empty($row['Nombre']) ? $row['Nombre'] : $row['NOMBRE DE CANAL'];
        $longitud_km = calcularLongitudDesdeWKT($row['WKT']);
        
        $canales[] = [
            'id' => $row['IDCANALESCIEABI'],
            'nombre' => $nombreMostrar,
            'nombre_canal' => $row['NOMBRE DE CANAL'],
            'descripcion' => $row['Descripcion'],
            'longitud_km' => $longitud_km
            // NO hay icono
        ];
    }
    
    echo json_encode([
        'success' => true,
        'canales' => $canales,
        'total' => count($canales)
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
            $lng = floatval($coord[0]);
            $lat = floatval($coord[1]);
            $coordenadas[] = ['lat' => $lat, 'lng' => $lng];
        }
    }
    
    $longitud_total = 0;
    for ($i = 0; $i < count($coordenadas) - 1; $i++) {
        $longitud_total += haversineDistance(
            $coordenadas[$i]['lat'], $coordenadas[$i]['lng'],
            $coordenadas[$i + 1]['lat'], $coordenadas[$i + 1]['lng']
        );
    }
    
    return round($longitud_total, 2);
}

function haversineDistance($lat1, $lng1, $lat2, $lng2) {
    $earthRadius = 6371;
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLng / 2) * sin($dLng / 2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    
    return $earthRadius * $c;
}
?>