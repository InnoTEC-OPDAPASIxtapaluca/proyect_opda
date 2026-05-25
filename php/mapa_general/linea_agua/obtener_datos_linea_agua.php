<?php
// php/mapa_general/linea_agua/obtener_datos_linea_agua.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDLINAGU, WKT, Nombre, Colonia 
              FROM linea_agua";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $datos = [];
    foreach ($resultados as $row) {
        $geometria = parseWKT($row['WKT']);
        if ($geometria && $geometria['tipo'] === 'LINESTRING') {
            // Extraer diámetro del nombre si existe
            $diametro = null;
            if ($row['Nombre']) {
                preg_match('/(\d+)\s*(pulgadas|pulg|")/i', $row['Nombre'], $matches);
                if (isset($matches[1])) {
                    $diametro = $matches[1] . '"';
                }
            }
            
            $datos[] = [
                'tipo' => $geometria['tipo'],
                'coordenadas' => $geometria['coordenadas'],
                'idLinea' => $row['IDLINAGU'],
                'nombre' => $row['Nombre'],
                'colonia' => $row['Colonia'],
                'diametro' => $diametro,
                'icono' => 'linea_agua'
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