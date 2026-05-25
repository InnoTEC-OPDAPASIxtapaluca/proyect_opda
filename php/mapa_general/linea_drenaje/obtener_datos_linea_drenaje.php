<?php
// php/mapa_general/linea_drenaje/obtener_datos_linea_drenaje.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDLINEADRENAJE, WKT, CALLE, DIAMETRO, Descripcion, COLONIA 
              FROM linea_drenaje";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $datos = [];
    foreach ($resultados as $row) {
        $geometria = parseWKT($row['WKT']);
        if ($geometria && $geometria['tipo'] === 'LINESTRING') {
            $datos[] = [
                'tipo' => $geometria['tipo'],
                'coordenadas' => $geometria['coordenadas'],
                'idLinea' => $row['IDLINEADRENAJE'],
                'calle' => $row['CALLE'],
                'diametro' => $row['DIAMETRO'],
                'descripcion' => $row['Descripcion'] ?? 'Línea de drenaje',
                'colonia' => $row['COLONIA'],
                'icono' => 'linea_drenaje'
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
    
    // LINESTRING
    if (strpos($wkt, 'LINESTRING') === 0) {
        preg_match('/LINESTRING\s*\(\s*(.*?)\s*\)/', $wkt, $matches);
        if (isset($matches[1])) {
            $coordsStr = $matches[1];
            $pares = explode(',', $coordsStr);
            $coordenadas = [];
            foreach ($pares as $par) {
                $coord = preg_split('/\s+/', trim($par));
                if (count($coord) >= 2) {
                    $longitud = floatval($coord[0]);
                    $latitud = floatval($coord[1]);
                    $coordenadas[] = [$latitud, $longitud];
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
    
    return null;
}
?>