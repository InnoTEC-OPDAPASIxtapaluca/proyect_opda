<?php
date_default_timezone_set('America/Mexico_City');
/**
 * reporte_pdf.php - Genera reporte PDF y lo guarda en BD
 * OPDAPAS Ixtapaluca - Dirección General
 * VERSIÓN CON IDENTIFICADOR Y CONEXIÓN A agn_cal_reg
 */

// ============================================
// 1. CONFIGURAR REPORTE DE ERRORES
// ============================================
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// ============================================
// 2. CARGAR AUTOLOAD DE COMPOSER
// ============================================
$ruta_autoload = __DIR__ . '/../../vendor/autoload.php';

if (!file_exists($ruta_autoload)) {
    $ruta_autoload = __DIR__ . '/../vendor/autoload.php';
}

if (!file_exists($ruta_autoload)) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false, 
        'message' => 'Autoload no encontrado: ' . $ruta_autoload
    ]);
    exit;
}

require_once $ruta_autoload;

if (!class_exists('Dompdf\Dompdf')) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false, 
        'message' => 'Dompdf no está instalado. Ejecuta: composer require dompdf/dompdf'
    ]);
    exit;
}

use Dompdf\Dompdf;
use Dompdf\Options;

// ============================================
// 3. CONEXIÓN A BD
// ============================================
require_once __DIR__ . '/../conexion/conexion.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $tipo = $_GET['tipo'] ?? '';
    $formato = $_GET['formato'] ?? 'visor';
    $identificador = $_GET['identificador'] ?? '';
    
    if (empty($tipo)) {
        throw new Exception('Tipo de reporte no especificado');
    }
    
    if (empty($identificador)) {
        throw new Exception('Usuario no autenticado');
    }
    
    $db = new Database();
    $conn = $db->getConnection('agn_cal_op');
    
    if (!$conn) {
        throw new Exception('Error de conexión a la base de datos');
    }
    
    // Construir consulta
    $where = "WHERE ae.estatus = 1 
              AND (ae.identificador_creador = :identificador 
                   OR EXISTS (SELECT 1 FROM anotaciones_compartidas ac 
                              WHERE ac.id_evento = ae.id_evento 
                              AND ac.identificador_usuario = :identificador2))";
    
    $periodoTexto = "";
    $tituloPeriodo = "";
    $fechaInicioReporte = null;
    $fechaFinReporte = null;
    
    switch($tipo) {
        case 'dia':
            $dia = $_GET['dia'] ?? '';
            $mes = $_GET['mes'] ?? '';
            $anio = $_GET['anio'] ?? '';
            if (empty($dia) || empty($mes) || empty($anio)) {
                throw new Exception('Día, mes y año requeridos');
            }
            $fecha = sprintf("%04d-%02d-%02d", $anio, $mes, $dia);
            $where .= " AND ae.fecha = :fecha";
            $periodoTexto = date('d/m/Y', strtotime($fecha));
            $tituloPeriodo = "REPORTE DEL DÍA";
            $fechaInicioReporte = $fecha;
            $fechaFinReporte = $fecha;
            break;
            
        case 'semana':
            $semana = $_GET['semana'] ?? '';
            $anio = $_GET['anio'] ?? '';
            if (empty($semana) || empty($anio)) {
                throw new Exception('Semana y año requeridos');
            }
            $fechaInicio = new DateTime();
            $fechaInicio->setISODate($anio, $semana);
            $fechaFin = clone $fechaInicio;
            $fechaFin->modify('+6 days');
            $where .= " AND ae.fecha BETWEEN :fechaInicio AND :fechaFin";
            $periodoTexto = "Semana " . $semana . " (" . $fechaInicio->format('d/m/Y') . " - " . $fechaFin->format('d/m/Y') . ")";
            $tituloPeriodo = "REPORTE SEMANAL";
            $fechaInicioReporte = $fechaInicio->format('Y-m-d');
            $fechaFinReporte = $fechaFin->format('Y-m-d');
            break;
            
        case 'mes':
            $mes = $_GET['mes'] ?? '';
            $anio = $_GET['anio'] ?? '';
            if (empty($mes) || empty($anio)) {
                throw new Exception('Mes y año requeridos');
            }
            $fechaInicio = sprintf("%04d-%02d-01", $anio, $mes);
            $fechaFin = date('Y-m-t', strtotime($fechaInicio));
            $where .= " AND ae.fecha BETWEEN :fechaInicio AND :fechaFin";
            $meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            $periodoTexto = $meses[$mes - 1] . " " . $anio;
            $tituloPeriodo = "REPORTE MENSUAL";
            $fechaInicioReporte = $fechaInicio;
            $fechaFinReporte = $fechaFin;
            break;
            
        default:
            throw new Exception('Tipo de reporte no válido: ' . $tipo);
    }
    
    $query = "SELECT ae.* FROM agenda_eventos ae $where ORDER BY ae.fecha ASC, ae.hora ASC";
    $stmt = $conn->prepare($query);
    
    $stmt->bindParam(':identificador', $identificador);
    $stmt->bindParam(':identificador2', $identificador);
    
    switch($tipo) {
        case 'dia':
            $stmt->bindParam(':fecha', $fecha);
            break;
        case 'semana':
            $fechaInicioStr = $fechaInicio->format('Y-m-d');
            $fechaFinStr = $fechaFin->format('Y-m-d');
            $stmt->bindParam(':fechaInicio', $fechaInicioStr);
            $stmt->bindParam(':fechaFin', $fechaFinStr);
            break;
        case 'mes':
            $stmt->bindParam(':fechaInicio', $fechaInicio);
            $stmt->bindParam(':fechaFin', $fechaFin);
            break;
    }
    
    $stmt->execute();
    $anotaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($anotaciones)) {
        throw new Exception('No hay anotaciones para este período');
    }
    
    $eventos = [];
    foreach ($anotaciones as $row) {
        $numArchivos = 0;
        if (!empty($row['archivos'])) {
            $archivos = json_decode($row['archivos'], true);
            $numArchivos = is_array($archivos) ? count($archivos) : 0;
        }
        $eventos[] = [
            'fecha' => date('d/m/Y', strtotime($row['fecha'])),
            'hora' => !empty($row['hora']) ? date('H:i', strtotime($row['hora'])) : '—',
            'titulo' => htmlspecialchars($row['titulo']),
            'descripcion' => htmlspecialchars(!empty($row['descripcion']) ? $row['descripcion'] : '—'),
            'archivos_texto' => $numArchivos > 0 ? $numArchivos . ' ARCHIVOS' : '—'
        ];
    }
    
    // Cargar plantilla
    $ruta_plantilla = __DIR__ . '/hoja_membretada.html';
    if (!file_exists($ruta_plantilla)) {
        $ruta_plantilla = __DIR__ . '/../../html/agenda_calendario/hoja_membretada.html';
    }
    
    if (!file_exists($ruta_plantilla)) {
        throw new Exception('Plantilla no encontrada');
    }
    
    $html = file_get_contents($ruta_plantilla);
    
    $html = str_replace(
        '<h2 id="tituloPeriodo">DIRECCIÓN GENERAL</h2>',
        '<h2 id="tituloPeriodo">' . $tituloPeriodo . '</h2>',
        $html
    );
    
    $html = str_replace(
        '<span class="info-valor" id="periodo">--</span>',
        '<span class="info-valor" id="periodo">' . $periodoTexto . '</span>',
        $html
    );
    
    $html = str_replace(
        '<span class="info-valor" id="fechaGeneracion">--</span>',
        '<span class="info-valor" id="fechaGeneracion">' . date('d/m/Y H:i:s') . '</span>',
        $html
    );
    
    $html = str_replace(
        '<span class="info-valor" id="totalEventos">0</span>',
        '<span class="info-valor" id="totalEventos">' . count($eventos) . '</span>',
        $html
    );
    
    $filas = '';
    foreach ($eventos as $e) {
        $filas .= '<tr>';
        $filas .= '<td class="centrado">' . $e['fecha'] . '</td>';
        $filas .= '<td class="centrado">' . $e['hora'] . '</td>';
        $filas .= '<td>' . $e['titulo'] . '</td>';
        $filas .= '<td>' . $e['descripcion'] . '</td>';
        $filas .= '<td class="centrado">' . $e['archivos_texto'] . '</td>';
        $filas .= '</tr>';
    }
    $html = preg_replace('/<tbody id="cuerpoTabla">.*?<\/tbody>/s', '<tbody id="cuerpoTabla">' . $filas . '</tbody>', $html);
    
    $options = new Options();
    $options->set('isRemoteEnabled', true);
    $options->set('isHtml5ParserEnabled', true);
    $options->set('defaultFont', 'Arial');
    
    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();
    
    $pdfContent = $dompdf->output();
    $pdfBase64 = base64_encode($pdfContent);
    
    $nombreArchivo = 'reporte_' . $tipo . '_' . date('Ymd_His') . '.pdf';
    $metadata = json_encode([
        'nombre' => $nombreArchivo,
        'tipo' => 'application/pdf',
        'tamaño' => strlen($pdfContent),
        'fecha_generacion' => date('Y-m-d H:i:s'),
        'usuario' => $identificador
    ]);
    
    $queryInsert = "INSERT INTO reportes (fecha_generacion, tipo_reporte, periodo, archivo_pdf, metadata, fecha_inicio, fecha_fin, identificador_usuario, estatus) 
                    VALUES (NOW(), :tipo_reporte, :periodo, :archivo_pdf, :metadata, :fecha_inicio, :fecha_fin, :identificador_usuario, 1)";
    
    $stmtInsert = $conn->prepare($queryInsert);
    $stmtInsert->bindParam(':tipo_reporte', $tipo);
    $stmtInsert->bindParam(':periodo', $periodoTexto);
    $stmtInsert->bindParam(':archivo_pdf', $pdfContent, PDO::PARAM_LOB);
    $stmtInsert->bindParam(':metadata', $metadata);
    $stmtInsert->bindParam(':fecha_inicio', $fechaInicioReporte);
    $stmtInsert->bindParam(':fecha_fin', $fechaFinReporte);
    $stmtInsert->bindParam(':identificador_usuario', $identificador);
    
    $stmtInsert->execute();
    $id_reporte = $conn->lastInsertId();
    
    $archivoPDF = [
        'nombre' => $nombreArchivo,
        'tipo' => 'application/pdf',
        'tamaño' => strlen($pdfContent),
        'id_reporte' => $id_reporte,
        'id_evento' => $id_reporte,
        'origen' => 'reporte',
        'ruta' => null,
        'contenido' => $pdfBase64
    ];
    
    echo json_encode([
        'success' => true,
        'id_reporte' => $id_reporte,
        'archivo' => $archivoPDF,
        'message' => 'Reporte generado exitosamente'
    ]);
    
} catch(Exception $e) {
    error_log("Error en reporte_pdf.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
}
?>