<?php
// php/mapa_general/carcamos/obtener_carcamos_lista.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../../conexion/conexion.php';

try {
    $conn_infra = $db->getInfraestructuraConnection();
    
    $query = "SELECT IDCARCAMOS, Nombre, 
                     `Q TOTAL LTS/SEG` as q_total,
                     `NO DE EQUIPOS DE BOMBEO` as no_equipos,
                     OPERANDO,
                     `Estatus de pago` as estatus_pago,
                     Icono 
              FROM carcamos 
              ORDER BY Nombre";
    $stmt = $conn_infra->prepare($query);
    $stmt->execute();
    
    $carcamos = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Convertir valores a números
        $noEquipos = $row['no_equipos'] !== null ? intval($row['no_equipos']) : 0;
        $operando = $row['OPERANDO'] !== null ? intval($row['OPERANDO']) : 0;
        
        $carcamos[] = [
            'id' => $row['IDCARCAMOS'],
            'nombre' => $row['Nombre'],
            'qTotal' => $row['q_total'],
            'noEquipos' => $noEquipos,
            'operando' => $operando,
            'estatusPago' => $row['estatus_pago'],
            'icono' => $row['Icono'] ?? 'carcamo'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'carcamos' => $carcamos,
        'total' => count($carcamos)
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>