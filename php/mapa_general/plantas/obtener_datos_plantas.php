<?php
// php/mapa_general/plantas/obtener_datos_plantas.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDPLANTAS, WKT, DESCRIPCION, LATITUD, LONGITUD, Nombre, 
                     `Capacidad (l/s)` as capacidad, `Capacidad actual (l/s)` as capacidad_actual, 
                     ESTATUS, ESTADO, `Consumo promedio mensual CFE` as consumo_cfe, 
                     `Adeudo actual CFE` as adeudo_cfe, `Equipos electromecǭnicos` as equipos, 
                     Icono 
              FROM plantas";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $datos = [];
    foreach ($resultados as $row) {
        $geometria = parseWKT($row['WKT']);
        if ($geometria) {
            $datos[] = [
                'tipo' => $geometria['tipo'],
                'coordenadas' => $geometria['coordenadas'],
                'idPlanta' => $row['IDPLANTAS'],
                'nombre' => $row['Nombre'],
                'descripcion' => $row['DESCRIPCION'] ?? 'Planta de tratamiento',
                'capacidad' => $row['capacidad'],
                'capacidadActual' => $row['capacidad_actual'],
                'estatus' => $row['ESTATUS'],
                'estado' => $row['ESTADO'],
                'consumo_cfe' => $row['consumo_cfe'],
                'adeudo_cfe' => $row['adeudo_cfe'],
                'equipos' => $row['equipos'],
                'icono' => $row['Icono'] ?? 'planta'
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $datos,
        'total' => count($datos)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function parseWKT($wkt) {
    if (!$wkt || !is_string($wkt)) return null;
    $wkt = trim($wkt);
    
    // POINT
    if (strpos($wkt, 'POINT') === 0) {
        preg_match('/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)/', $wkt, $matches);
        if (count($matches) >= 3) {
            $lng = floatval($matches[1]);
            $lat = floatval($matches[2]);
            if (!is_nan($lat) && !is_nan($lng)) {
                return [
                    'tipo' => 'POINT',
                    'coordenadas' => [$lat, $lng]
                ];
            }
        }
    }
    
    // Si el WKT no es válido, intentar usar LATITUD/LONGITUD
    return null;
}
?>