<?php
// php/mapa_general/pozos/obtener_datos_pozos.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT idpozos, NUMERO_DE_POZO, POZO, LATITUD, LONGITUD, WKT, HORAS_OPERACION, 
                     ESTATUS, ESTADO, EQUIPO, GASTO_LITROS, ZONA_DE_INFLUENCIA, M3_mensual,
                     Consumo_promedio_mensual_CFE, `Adeudo_actual_ CFE` as Adeudo_actual_CFE, 
                     `TITULO_DE _CONCESION` as TITULO_DE_CONCESION, VIGENCIA, VOLUMEN, 
                     DOCUMENTO_PROPIEDAD, DOMICILIO
              FROM pozos";
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
                'idPozo' => $row['idpozos'],
                'numero_pozo' => $row['NUMERO_DE_POZO'],
                'nombre' => $row['POZO'],
                'horas_operacion' => $row['HORAS_OPERACION'],
                'estatus' => $row['ESTATUS'],
                'estado' => $row['ESTADO'],
                'equipo' => $row['EQUIPO'],
                'gasto_litros' => $row['GASTO_LITROS'],
                'zona_influencia' => $row['ZONA_DE_INFLUENCIA'],
                'm3_mensual' => $row['M3_mensual'],
                'consumo_cfe' => $row['Consumo_promedio_mensual_CFE'],
                'adeudo_cfe' => $row['Adeudo_actual_CFE'],
                'titulo_concesion' => $row['TITULO_DE_CONCESION'],
                'vigencia' => $row['VIGENCIA'],
                'volumen' => $row['VOLUMEN'],
                'documento_propiedad' => $row['DOCUMENTO_PROPIEDAD'],
                'domicilio' => $row['DOMICILIO'],
                'icono' => 'POZOS'
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