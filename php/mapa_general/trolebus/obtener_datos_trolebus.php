<?php
// php/mapa_general/trolebus/obtener_datos_trolebus.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT WKT, Nombre, Descripcion, Apartado, Bloque, NomCort, Icono FROM trolebus";
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
                'nombre' => $row['Nombre'],
                'descripcion' => $row['Descripcion'] ?? 'N/A',
                'apartado' => $row['Apartado'],
                'bloque' => $row['Bloque'],
                'nombre_corto' => $row['NomCort'],
                'icono' => $row['Icono'] ?? 'trolebus',
                'wkt_original' => $row['WKT']
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
        // Extraer coordenadas: POINT (lng lat)
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
    
    // LINESTRING
    if (strpos($wkt, 'LINESTRING') === 0) {
        preg_match('/LINESTRING\s*\(\s*(.*?)\s*\)/', $wkt, $matches);
        if (isset($matches[1])) {
            $coordsStr = $matches[1];
            $pares = explode(',', $coordsStr);
            $coordenadas = [];
            foreach ($pares as $par) {
                $coord = explode(' ', trim($par));
                if (count($coord) >= 2) {
                    $lng = floatval($coord[0]);
                    $lat = floatval($coord[1]);
                    $coordenadas[] = [$lat, $lng];
                }
            }
            if (count($coordenadas) >= 2) {
                return [
                    'tipo' => 'LINESTRING',
                    'coordenadas' => $coordenadas
                ];
            }
        }
    }
    
    // POLYGON
    if (strpos($wkt, 'POLYGON') === 0) {
        preg_match('/POLYGON\s*\(\s*\(\s*(.*?)\s*\)\s*\)/', $wkt, $matches);
        if (isset($matches[1])) {
            $coordsStr = $matches[1];
            $pares = explode(',', $coordsStr);
            $coordenadas = [];
            foreach ($pares as $par) {
                $coord = explode(' ', trim($par));
                if (count($coord) >= 2) {
                    $lng = floatval($coord[0]);
                    $lat = floatval($coord[1]);
                    $coordenadas[] = [$lat, $lng];
                }
            }
            if (count($coordenadas) >= 3) {
                return [
                    'tipo' => 'POLYGON',
                    'coordenadas' => $coordenadas
                ];
            }
        }
    }
    
    return null;
}
?>