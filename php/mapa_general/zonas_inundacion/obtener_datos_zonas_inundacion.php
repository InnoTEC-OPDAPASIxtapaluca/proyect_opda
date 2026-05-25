<?php
// php/mapa_general/zonas_inundacion/obtener_datos_zonas_inundacion.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT WKT, Nombre, `Descripcion/Problematica` as problematica 
              FROM zonas_inundacion";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $datos = [];
    foreach ($resultados as $row) {
        $geometria = parseWKT($row['WKT']);
        if ($geometria && $geometria['tipo'] === 'POLYGON') {
            $datos[] = [
                'tipo' => $geometria['tipo'],
                'coordenadas' => $geometria['coordenadas'],
                'nombre' => $row['Nombre'],
                'problematica' => $row['problematica'],
                'icono' => 'zonas_inundacion'
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
    
    // POLYGON
    if (strpos($wkt, 'POLYGON') === 0) {
        // Extraer todos los anillos del polígono
        preg_match_all('/\(\s*([^()]+?)\s*\)/', $wkt, $anillos);
        
        if (isset($anillos[1]) && count($anillos[1]) > 0) {
            $coordenadas = [];
            
            foreach ($anillos[1] as $anillo) {
                $pares = explode(',', $anillo);
                $anilloCoords = [];
                
                foreach ($pares as $par) {
                    $coord = preg_split('/\s+/', trim($par));
                    if (count($coord) >= 2) {
                        $longitud = floatval($coord[0]);
                        $latitud = floatval($coord[1]);
                        $anilloCoords[] = [$latitud, $longitud];
                    }
                }
                
                if (count($anilloCoords) >= 3) {
                    $coordenadas[] = $anilloCoords;
                }
            }
            
            if (count($coordenadas) > 0) {
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