<?php
// php/mapa_general/presas_gavion/obtener_datos_presas_gavion.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDPRESAS, WKT, Nombre, Descripcion, LATITUD, LONGITUD, Icono 
              FROM presas_gavion";
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
                'idPresa' => $row['IDPRESAS'],
                'nombre' => $row['Nombre'],
                'descripcion' => $row['Descripcion'] ?? 'Presa de Gavión',
                'icono' => $row['Icono'] ?? 'presas_gavion'
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
            // Formato POINT(lng lat)
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
    
    // Si no hay WKT válido, usar LATITUD y LONGITUD
    if (!empty($row['LATITUD']) && !empty($row['LONGITUD'])) {
        $latitud = floatval($row['LATITUD']);
        $longitud = floatval($row['LONGITUD']);
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