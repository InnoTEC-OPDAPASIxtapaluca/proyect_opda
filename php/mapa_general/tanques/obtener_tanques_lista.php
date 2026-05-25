<?php
// php/mapa_general/tanques/obtener_tanques_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDTANQUES, Nombre, Descripcion, Volumen_M3, Tipo, Rebombeos, 
                     LATITUD, LONGITUD, WKT, Icono 
              FROM tanques 
              WHERE (LATITUD IS NOT NULL OR WKT IS NOT NULL)
              ORDER BY Nombre";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $tanques = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Verificar si tiene coordenadas válidas usando WKT
        $tieneCoordenadas = false;
        
        if (!empty($row['WKT']) && strpos($row['WKT'], 'POINT') === 0) {
            $tieneCoordenadas = true;
        } elseif (!empty($row['LATITUD']) && !empty($row['LONGITUD'])) {
            $tieneCoordenadas = true;
        }
        
        if (!$tieneCoordenadas) {
            continue;
        }
        
        $tanques[] = [
            'id' => $row['IDTANQUES'],
            'nombre' => $row['Nombre'],
            'descripcion' => $row['Descripcion'],
            'volumen_m3' => $row['Volumen_M3'],
            'tipo' => $row['Tipo'],
            'rebombeos' => $row['Rebombeos'],
            'icono' => $row['Icono'] ?? 'tanques'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'tanques' => $tanques,
        'total' => count($tanques)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>