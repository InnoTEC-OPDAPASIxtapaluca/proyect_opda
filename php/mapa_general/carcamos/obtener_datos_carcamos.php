<?php
// php/mapa_general/carcamos/obtener_datos_carcamos.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDCARCAMOS, WKT, LATITUD, LONGITUD, Nombre, 
                     `Q TOTAL LTS/SEG` as q_total,
                     `NO DE EQUIPOS DE BOMBEO` as no_equipos,
                     OPERANDO,
                     `VOLUMEN DE DESALOJO ACTUAL LS` as volumen_desalojo,
                     `EQUIPOS Electromecanicos` as equipos_electromecanicos,
                     `EQUIPOS DANADOS` as equipos_danados,
                     `No descargas` as no_descargas,
                     `Estatus de pago` as estatus_pago,
                     `Tipo de cause` as tipo_cause,
                     CUERPODESCARGA as cuerpo_descarga,
                     Icono
              FROM carcamos";
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
                'idCarcamo' => $row['IDCARCAMOS'],
                'nombre' => $row['Nombre'],
                'qTotal' => $row['q_total'],
                'noEquipos' => $row['no_equipos'],
                'operando' => $row['OPERANDO'],
                'volumenDesalojo' => $row['volumen_desalojo'],
                'equiposElectromecanicos' => $row['equipos_electromecanicos'],
                'equiposDanados' => $row['equipos_danados'],
                'noDescargas' => $row['no_descargas'],
                'estatusPago' => $row['estatus_pago'],
                'tipoCause' => $row['tipo_cause'],
                'cuerpoDescarga' => $row['cuerpo_descarga'],
                'icono' => $row['Icono'] ?? 'carcamo'
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
    
    return null;
}
?>