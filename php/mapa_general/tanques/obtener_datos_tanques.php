<?php
// php/mapa_general/tanques/obtener_datos_tanques.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDTANQUES, WKT, LATITUD, LONGITUD, Nombre, Descripcion, 
                     Volumen_M3, Capacidad, Tipo, Rebombeos, Icono 
              FROM tanques";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $datos = [];
    foreach ($resultados as $row) {
        $geometria = parseCoordenadas($row);
        if ($geometria) {
            $datos[] = [
                'tipo' => $geometria['tipo'],
                'coordenadas' => $geometria['coordenadas'],
                'idTanque' => $row['IDTANQUES'],
                'nombre' => $row['Nombre'],
                'descripcion' => $row['Descripcion'] ?? 'Tanque de almacenamiento',
                'volumen_m3' => $row['Volumen_M3'],
                'capacidad' => $row['Capacidad'],
                'tipo_tanque' => $row['Tipo'],
                'rebombeos' => $row['Rebombeos'],
                'icono' => $row['Icono'] ?? 'tanques'
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
    // Intentar primero con WKT (es la fuente más confiable)
    if (!empty($row['WKT']) && is_string($row['WKT'])) {
        $wkt = trim($row['WKT']);
        if (strpos($wkt, 'POINT') === 0) {
            // Formato POINT(lng lat)
            preg_match('/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)/', $wkt, $matches);
            if (count($matches) >= 3) {
                $longitud = floatval($matches[1]);  // longitud (ej: -98.93)
                $latitud = floatval($matches[2]);   // latitud (ej: 19.34)
                if (!is_nan($latitud) && !is_nan($longitud) && $latitud != 0 && $longitud != 0) {
                    // Leaflet usa [lat, lng]
                    return [
                        'tipo' => 'POINT',
                        'coordenadas' => [$latitud, $longitud]
                    ];
                }
            }
        }
    }
    
    // Si no hay WKT válido, usar LATITUD y LONGITUD (pero están invertidos en la BD)
    if (!empty($row['LATITUD']) && !empty($row['LONGITUD'])) {
        // En la BD: LATITUD = longitud, LONGITUD = latitud (están invertidos)
        $longitud = floatval($row['LATITUD']);   // el campo LATITUD contiene longitud
        $latitud = floatval($row['LONGITUD']);   // el campo LONGITUD contiene latitud
        
        if (!is_nan($latitud) && !is_nan($longitud) && $latitud != 0 && $longitud != 0) {
            return [
                'tipo' => 'POINT',
                'coordenadas' => [$latitud, $longitud]
            ];
        }
    }
    
    return null;
}
?>