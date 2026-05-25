<?php
// php/mapa_general/plantas_sedimentadoras/obtener_datos_plantas_sedimentadoras.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    // SOLO los campos que existen en la tabla plantas_sedimentadoras
    $query = "SELECT IDPLANSEDI, WKT, LATITUD, LONGITUD, Nombre, Descripcion, Icono 
              FROM plantas_sedimentadoras";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $datos = [];
    foreach ($resultados as $row) {
        $geometria = parseWKT($row['WKT'], $row['LATITUD'], $row['LONGITUD']);
        if ($geometria) {
            $datos[] = [
                'tipo' => $geometria['tipo'],
                'coordenadas' => $geometria['coordenadas'],
                'idPlantaSed' => $row['IDPLANSEDI'],
                'nombre' => $row['Nombre'],
                'descripcion' => $row['Descripcion'] ?? 'Planta sedimentadora',
                'icono' => $row['Icono'] ?? 'plantas_sedimentadoras'
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

function parseWKT($wkt, $lat, $lng) {
    // Si hay WKT válido, usarlo
    if ($wkt && is_string($wkt) && strpos($wkt, 'POINT') === 0) {
        preg_match('/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)/', $wkt, $matches);
        if (count($matches) >= 3) {
            $longitud = floatval($matches[1]);
            $latitud = floatval($matches[2]);
            if (!is_nan($latitud) && !is_nan($longitud)) {
                return [
                    'tipo' => 'POINT',
                    'coordenadas' => [$latitud, $longitud]
                ];
            }
        }
    }
    
    // Si no hay WKT válido, usar LATITUD/LONGITUD
    if ($lat && $lng && !is_nan($lat) && !is_nan($lng)) {
        return [
            'tipo' => 'POINT',
            'coordenadas' => [floatval($lat), floatval($lng)]
        ];
    }
    
    return null;
}
?>