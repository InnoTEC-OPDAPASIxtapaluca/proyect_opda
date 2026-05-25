<?php
// php/mapa_general/valvulas/obtener_datos_valvulas.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDVALVULA, WKT, Descripcion, LATITUD, LONGITUD, LATLONG, DIAMETRO, COLONIA 
              FROM valvulas";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $datos = [];
    foreach ($resultados as $row) {
        $geometria = parseCoordenadas($row);
        if ($geometria) {
            // Extraer diámetro de la descripción si no viene en campo DIAMETRO
            $diametro = $row['DIAMETRO'];
            if (!$diametro && $row['Descripcion']) {
                preg_match('/(\d+)\s*(pulgadas|pulg|")/i', $row['Descripcion'], $matches);
                if (isset($matches[1])) {
                    $diametro = $matches[1] . '"';
                }
            }
            
            $datos[] = [
                'tipo' => $geometria['tipo'],
                'coordenadas' => $geometria['coordenadas'],
                'idValvula' => $row['IDVALVULA'],
                'descripcion' => $row['Descripcion'] ?? 'Válvula de distribución',
                'diametro' => $diametro,
                'colonia' => $row['COLONIA'],
                'icono' => 'valvulas'
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

function parseCoordenadas($row) {
    // Intentar primero con WKT
    if (!empty($row['WKT']) && is_string($row['WKT'])) {
        $wkt = trim($row['WKT']);
        if (strpos($wkt, 'POINT') === 0) {
            preg_match('/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)/', $wkt, $matches);
            if (count($matches) >= 3) {
                $longitud = floatval($matches[1]);
                $latitud = floatval($matches[2]);
                if (!is_nan($latitud) && !is_nan($longitud) && $latitud != 0 && $longitud != 0) {
                    return [
                        'tipo' => 'POINT',
                        'coordenadas' => [$latitud, $longitud]
                    ];
                }
            }
        }
    }
    
    // Si no hay WKT válido, usar LATITUD y LONGITUD (pueden estar en el mismo campo separados por espacio)
    if (!empty($row['LATITUD']) && is_string($row['LATITUD'])) {
        $coords = trim($row['LATITUD']);
        $partes = preg_split('/\s+/', $coords);
        if (count($partes) >= 2) {
            $longitud = floatval($partes[0]);
            $latitud = floatval($partes[1]);
            if (!is_nan($latitud) && !is_nan($longitud) && $latitud != 0 && $longitud != 0) {
                return [
                    'tipo' => 'POINT',
                    'coordenadas' => [$latitud, $longitud]
                ];
            }
        }
    }
    
    return null;
}
?>