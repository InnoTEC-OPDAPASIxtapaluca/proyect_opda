<?php
date_default_timezone_set('America/Mexico_City');
/**
 * agenda_api.php - API para gestión de la agenda
 * VERSIÓN CON COMPARTIR POR ÁREA - ELIMINACIÓN FÍSICA
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../conexion/conexion.php';

class AgendaAPI {
    private $conn;
    private $db;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection('agn_cal_op');
        
        if (!$this->conn) {
            error_log("ERROR: No se pudo conectar a agn_cal_op");
        }
    }
    
    public function procesarPeticion() {
        $action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';
        
        switch($action) {
            case 'getAll':
                $this->getAll();
                break;
            case 'getByDate':
                $this->getByDate();
                break;
            case 'getByMonth':
                $this->getByMonth();
                break;
            case 'getUsuariosPorArea':
                $this->getUsuariosPorArea();
                break;
            case 'insert':
                $this->insert();
                break;
            case 'update':
                $this->update();
                break;
            case 'delete':
                $this->delete();
                break;
            default:
                echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        }
    }
    
    /**
     * OBTENER USUARIOS AGRUPADOS POR ÁREA
     */
    private function getUsuariosPorArea() {
        try {
            $identificadorActual = isset($_GET['identificador']) ? $_GET['identificador'] : '';
            
            $db = new Database();
            $connLogin = $db->getConnection('login_op');
            
            if (!$connLogin) {
                throw new Exception('No se pudo conectar a login_op');
            }
            
            $query = "SELECT 
                        a.id_area, 
                        a.area as area_nombre,
                        ui.no_nomina as identificador,
                        ui.nombre_s as nombre,
                        ui.apellido_paterno,
                        ui.apellido_materno
                      FROM usuarios_internos ui
                      INNER JOIN areas a ON ui.area_id = a.id_area
                      WHERE ui.no_nomina IS NOT NULL";
            
            if (!empty($identificadorActual)) {
                $query .= " AND ui.no_nomina != :identificador";
            }
            
            $query .= " ORDER BY a.area ASC, ui.nombre_s ASC";
            
            $stmt = $connLogin->prepare($query);
            
            if (!empty($identificadorActual)) {
                $stmt->bindParam(':identificador', $identificadorActual, PDO::PARAM_STR);
            }
            
            $stmt->execute();
            $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $areasMap = [];
            foreach ($resultados as $row) {
                $areaId = $row['id_area'];
                $areaNombre = $row['area_nombre'];
                
                if (!isset($areasMap[$areaId])) {
                    $areasMap[$areaId] = [
                        'area_id' => $areaId,
                        'area_nombre' => $areaNombre,
                        'usuarios' => []
                    ];
                }
                
                $areasMap[$areaId]['usuarios'][] = [
                    'identificador' => $row['identificador'],
                    'nombre' => $row['nombre'],
                    'apellido_paterno' => $row['apellido_paterno'],
                    'apellido_materno' => $row['apellido_materno']
                ];
            }
            
            $areas = array_values($areasMap);
            
            echo json_encode([
                'success' => true,
                'data' => $areas,
                'total_areas' => count($areas),
                'total_usuarios' => array_sum(array_map(function($area) { return count($area['usuarios']); }, $areas)),
                'usuario_actual' => $identificadorActual
            ]);
            
        } catch(Exception $e) {
            error_log("Error en getUsuariosPorArea: " . $e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener usuarios por área: ' . $e->getMessage()
            ]);
        }
    }
    
    private function guardarUsuariosCompartidos($id_evento, $usuariosCompartidos) {
        try {
            $queryDelete = "DELETE FROM anotaciones_compartidas WHERE id_evento = :id_evento";
            $stmtDelete = $this->conn->prepare($queryDelete);
            $stmtDelete->bindParam(':id_evento', $id_evento);
            $stmtDelete->execute();
            
            if (!empty($usuariosCompartidos) && is_array($usuariosCompartidos)) {
                $queryInsert = "INSERT INTO anotaciones_compartidas (id_evento, identificador_usuario) VALUES (:id_evento, :identificador)";
                $stmtInsert = $this->conn->prepare($queryInsert);
                
                foreach ($usuariosCompartidos as $identificador) {
                    if (!empty($identificador)) {
                        $stmtInsert->bindParam(':id_evento', $id_evento);
                        $stmtInsert->bindParam(':identificador', $identificador);
                        $stmtInsert->execute();
                    }
                }
            }
            
            return true;
        } catch(Exception $e) {
            error_log("Error guardando usuarios compartidos: " . $e->getMessage());
            return false;
        }
    }
    
    private function getUsuariosCompartidos($id_evento) {
        try {
            $query = "SELECT identificador_usuario FROM anotaciones_compartidas WHERE id_evento = :id_evento";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id_evento', $id_evento);
            $stmt->execute();
            
            $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_column($resultados, 'identificador_usuario');
        } catch(Exception $e) {
            return [];
        }
    }
    
    private function getAll() {
        try {
            $identificador = isset($_GET['identificador']) ? $_GET['identificador'] : '';
            
            $query = "SELECT ae.* 
                      FROM agenda_eventos ae 
                      WHERE ae.estatus = 1 
                      AND (ae.identificador_creador = :identificador 
                           OR EXISTS (SELECT 1 FROM anotaciones_compartidas ac WHERE ac.id_evento = ae.id_evento AND ac.identificador_usuario = :identificador2))
                      ORDER BY ae.fecha DESC, ae.hora DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':identificador', $identificador);
            $stmt->bindParam(':identificador2', $identificador);
            $stmt->execute();
            
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($eventos as &$evento) {
                if (!empty($evento['archivos'])) {
                    $evento['archivos'] = $this->blobToJson($evento['archivos'], $evento['id_evento'], 'agenda');
                }
                $evento['usuarios_compartidos'] = $this->getUsuariosCompartidos($evento['id_evento']);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $eventos,
                'total' => count($eventos)
            ]);
            
        } catch(Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener eventos: ' . $e->getMessage()
            ]);
        }
    }
    
    private function getByDate() {
        try {
            $fecha = isset($_GET['fecha']) ? $_GET['fecha'] : '';
            $identificador = isset($_GET['identificador']) ? $_GET['identificador'] : '';
            
            if(empty($fecha)) {
                echo json_encode(['success' => false, 'message' => 'Fecha no proporcionada']);
                return;
            }
            
            $query = "SELECT ae.* 
                      FROM agenda_eventos ae 
                      WHERE ae.fecha = :fecha AND ae.estatus = 1 
                      AND (ae.identificador_creador = :identificador 
                           OR EXISTS (SELECT 1 FROM anotaciones_compartidas ac WHERE ac.id_evento = ae.id_evento AND ac.identificador_usuario = :identificador2))
                      ORDER BY ae.hora ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':fecha', $fecha);
            $stmt->bindParam(':identificador', $identificador);
            $stmt->bindParam(':identificador2', $identificador);
            $stmt->execute();
            
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($eventos as &$evento) {
                if (!empty($evento['archivos'])) {
                    $evento['archivos'] = $this->blobToJson($evento['archivos'], $evento['id_evento'], 'agenda');
                }
                $evento['usuarios_compartidos'] = $this->getUsuariosCompartidos($evento['id_evento']);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $eventos,
                'total' => count($eventos)
            ]);
            
        } catch(Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener eventos: ' . $e->getMessage()
            ]);
        }
    }
    
    private function getByMonth() {
        try {
            $anio = isset($_GET['anio']) ? $_GET['anio'] : date('Y');
            $mes = isset($_GET['mes']) ? str_pad($_GET['mes'], 2, '0', STR_PAD_LEFT) : date('m');
            $identificador = isset($_GET['identificador']) ? $_GET['identificador'] : '';
            
            $fechaInicio = $anio . '-' . $mes . '-01';
            $fechaFin = date('Y-m-t', strtotime($fechaInicio));
            
            $query = "SELECT ae.* 
                      FROM agenda_eventos ae 
                      WHERE ae.fecha BETWEEN :fechaInicio AND :fechaFin 
                      AND ae.estatus = 1 
                      AND (ae.identificador_creador = :identificador 
                           OR EXISTS (SELECT 1 FROM anotaciones_compartidas ac WHERE ac.id_evento = ae.id_evento AND ac.identificador_usuario = :identificador2))
                      ORDER BY ae.fecha ASC, ae.hora ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':fechaInicio', $fechaInicio);
            $stmt->bindParam(':fechaFin', $fechaFin);
            $stmt->bindParam(':identificador', $identificador);
            $stmt->bindParam(':identificador2', $identificador);
            $stmt->execute();
            
            $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($eventos as &$evento) {
                if (!empty($evento['archivos'])) {
                    $evento['archivos'] = $this->blobToJson($evento['archivos'], $evento['id_evento'], 'agenda');
                }
                $evento['usuarios_compartidos'] = $this->getUsuariosCompartidos($evento['id_evento']);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $eventos,
                'total' => count($eventos)
            ]);
            
        } catch(Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener eventos: ' . $e->getMessage()
            ]);
        }
    }
    
    private function procesarArchivosParaBlob() {
        $archivos = [];
        
        if (isset($_FILES['archivos'])) {
            $files = $_FILES['archivos'];
            
            if (is_array($files['name'])) {
                for ($i = 0; $i < count($files['name']); $i++) {
                    if ($files['error'][$i] == 0) {
                        $contenido = file_get_contents($files['tmp_name'][$i]);
                        $archivos[] = [
                            'nombre' => $files['name'][$i],
                            'tipo' => $files['type'][$i],
                            'tamaño' => $files['size'][$i],
                            'contenido' => base64_encode($contenido)
                        ];
                    }
                }
            } else {
                if ($files['error'] == 0) {
                    $contenido = file_get_contents($files['tmp_name']);
                    $archivos[] = [
                        'nombre' => $files['name'],
                        'tipo' => $files['type'],
                        'tamaño' => $files['size'],
                        'contenido' => base64_encode($contenido)
                    ];
                }
            }
        }
        
        return !empty($archivos) ? json_encode($archivos) : null;
    }
    
    private function blobToJson($blob, $id_evento = null, $origen = 'agenda') {
        if (empty($blob)) return null;
        
        $jsonString = $blob;
        if (is_resource($blob)) {
            $jsonString = stream_get_contents($blob);
        }
        
        $archivos = json_decode($jsonString, true);
        
        if (!is_array($archivos)) {
            return null;
        }
        
        foreach ($archivos as &$archivo) {
            unset($archivo['contenido']);
            if ($id_evento) {
                $archivo['id_evento'] = $id_evento;
            }
            $archivo['origen'] = $origen;
        }
        
        return json_encode($archivos);
    }
    
    private function obtenerArchivo($id_evento, $nombreArchivo) {
        try {
            $query = "SELECT archivos FROM agenda_eventos WHERE id_evento = :id_evento";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id_evento', $id_evento);
            $stmt->execute();
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($resultado && !empty($resultado['archivos'])) {
                $jsonString = is_resource($resultado['archivos']) ? stream_get_contents($resultado['archivos']) : $resultado['archivos'];
                $archivos = json_decode($jsonString, true);
                foreach ($archivos as $archivo) {
                    if ($archivo['nombre'] === $nombreArchivo) {
                        return [
                            'contenido' => base64_decode($archivo['contenido']),
                            'tipo' => $archivo['tipo'],
                            'nombre' => $archivo['nombre']
                        ];
                    }
                }
            }
            return null;
        } catch(Exception $e) {
            return null;
        }
    }
    
    private function insert() {
        try {
            $fecha = isset($_POST['fecha']) ? $_POST['fecha'] : '';
            $hora = isset($_POST['hora']) ? $_POST['hora'] : null;
            $titulo = isset($_POST['titulo']) ? strtoupper(trim($_POST['titulo'])) : '';
            $descripcion = isset($_POST['descripcion']) ? strtoupper(trim($_POST['descripcion'])) : null;
            $identificadorCreador = isset($_POST['identificador_creador']) ? $_POST['identificador_creador'] : '';
            $usuariosCompartidos = isset($_POST['usuarios_compartidos']) ? json_decode($_POST['usuarios_compartidos'], true) : [];
            
            $ubicacionLink = isset($_POST['ubicacion_link']) ? $_POST['ubicacion_link'] : null;
            $ubicacionLat = isset($_POST['ubicacion_lat']) && $_POST['ubicacion_lat'] !== '' ? $_POST['ubicacion_lat'] : null;
            $ubicacionLng = isset($_POST['ubicacion_lng']) && $_POST['ubicacion_lng'] !== '' ? $_POST['ubicacion_lng'] : null;
            
            $archivosJson = $this->procesarArchivosParaBlob();
            
            if(empty($fecha)) {
                $fecha = date('Y-m-d');
            }
            if(empty($titulo)) {
                $titulo = "SIN TÍTULO";
            }
            
            $this->conn->beginTransaction();
            
            $queryCalendario = "INSERT INTO calendario_eventos (fecha, hora, titulo, descripcion, archivos, ubicacion_link, ubicacion_lat, ubicacion_lng, identificador_creador) 
                                VALUES (:fecha, :hora, :titulo, :descripcion, :archivos, :ubicacion_link, :ubicacion_lat, :ubicacion_lng, :identificador_creador)";
            
            $stmtCalendario = $this->conn->prepare($queryCalendario);
            $stmtCalendario->bindParam(':fecha', $fecha);
            $stmtCalendario->bindParam(':hora', $hora);
            $stmtCalendario->bindParam(':titulo', $titulo);
            $stmtCalendario->bindParam(':descripcion', $descripcion);
            $stmtCalendario->bindParam(':archivos', $archivosJson);
            $stmtCalendario->bindParam(':ubicacion_link', $ubicacionLink);
            $stmtCalendario->bindParam(':ubicacion_lat', $ubicacionLat);
            $stmtCalendario->bindParam(':ubicacion_lng', $ubicacionLng);
            $stmtCalendario->bindParam(':identificador_creador', $identificadorCreador);
            
            if(!$stmtCalendario->execute()) {
                $this->conn->rollBack();
                echo json_encode(['success' => false, 'message' => 'Error al guardar en calendario']);
                return;
            }
            
            $id_calendario = $this->conn->lastInsertId();
            
            $queryAgenda = "INSERT INTO agenda_eventos (id_calendario, fecha, hora, titulo, descripcion, archivos, ubicacion_link, ubicacion_lat, ubicacion_lng, identificador_creador) 
                            VALUES (:id_calendario, :fecha, :hora, :titulo, :descripcion, :archivos, :ubicacion_link, :ubicacion_lat, :ubicacion_lng, :identificador_creador)";
            
            $stmtAgenda = $this->conn->prepare($queryAgenda);
            $stmtAgenda->bindParam(':id_calendario', $id_calendario);
            $stmtAgenda->bindParam(':fecha', $fecha);
            $stmtAgenda->bindParam(':hora', $hora);
            $stmtAgenda->bindParam(':titulo', $titulo);
            $stmtAgenda->bindParam(':descripcion', $descripcion);
            $stmtAgenda->bindParam(':archivos', $archivosJson);
            $stmtAgenda->bindParam(':ubicacion_link', $ubicacionLink);
            $stmtAgenda->bindParam(':ubicacion_lat', $ubicacionLat);
            $stmtAgenda->bindParam(':ubicacion_lng', $ubicacionLng);
            $stmtAgenda->bindParam(':identificador_creador', $identificadorCreador);
            
            if($stmtAgenda->execute()) {
                $id_evento = $this->conn->lastInsertId();
                $this->guardarUsuariosCompartidos($id_evento, $usuariosCompartidos);
                $this->conn->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Evento guardado exitosamente',
                    'id_evento' => $id_evento,
                    'id_calendario' => $id_calendario
                ]);
            } else {
                $this->conn->rollBack();
                echo json_encode(['success' => false, 'message' => 'Error al guardar en agenda']);
            }
            
        } catch(Exception $e) {
            if($this->conn->inTransaction()) $this->conn->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Error en la operación: ' . $e->getMessage()
            ]);
        }
    }
    
    private function update() {
        try {
            $id_evento = isset($_POST['id_evento']) ? $_POST['id_evento'] : 0;
            $fecha = isset($_POST['fecha']) ? $_POST['fecha'] : '';
            $hora = isset($_POST['hora']) ? $_POST['hora'] : null;
            $titulo = isset($_POST['titulo']) ? strtoupper(trim($_POST['titulo'])) : '';
            $descripcion = isset($_POST['descripcion']) ? strtoupper(trim($_POST['descripcion'])) : null;
            $usuariosCompartidos = isset($_POST['usuarios_compartidos']) ? json_decode($_POST['usuarios_compartidos'], true) : [];
            
            $ubicacionLink = isset($_POST['ubicacion_link']) ? $_POST['ubicacion_link'] : null;
            $ubicacionLat = isset($_POST['ubicacion_lat']) && $_POST['ubicacion_lat'] !== '' ? $_POST['ubicacion_lat'] : null;
            $ubicacionLng = isset($_POST['ubicacion_lng']) && $_POST['ubicacion_lng'] !== '' ? $_POST['ubicacion_lng'] : null;
            
            if (!is_array($usuariosCompartidos)) {
                $usuariosCompartidos = [];
            }
            
            $archivosNuevos = [];
            if (isset($_FILES['archivos'])) {
                $files = $_FILES['archivos'];
                if (is_array($files['name'])) {
                    for ($i = 0; $i < count($files['name']); $i++) {
                        if ($files['error'][$i] == 0) {
                            $contenido = file_get_contents($files['tmp_name'][$i]);
                            $archivosNuevos[] = [
                                'nombre' => $files['name'][$i],
                                'tipo' => $files['type'][$i],
                                'tamaño' => $files['size'][$i],
                                'contenido' => base64_encode($contenido)
                            ];
                        }
                    }
                } else {
                    if ($files['error'] == 0) {
                        $contenido = file_get_contents($files['tmp_name']);
                        $archivosNuevos[] = [
                            'nombre' => $files['name'],
                            'tipo' => $files['type'],
                            'tamaño' => $files['size'],
                            'contenido' => base64_encode($contenido)
                        ];
                    }
                }
            }
            
            $querySelect = "SELECT archivos, id_calendario FROM agenda_eventos WHERE id_evento = :id_evento";
            $stmtSelect = $this->conn->prepare($querySelect);
            $stmtSelect->bindParam(':id_evento', $id_evento);
            $stmtSelect->execute();
            $resultado = $stmtSelect->fetch(PDO::FETCH_ASSOC);
            
            if(!$resultado) {
                echo json_encode(['success' => false, 'message' => 'Evento no encontrado']);
                return;
            }
            
            $id_calendario = $resultado['id_calendario'];
            $archivosExistentes = [];
            
            if (!empty($resultado['archivos'])) {
                $jsonString = is_resource($resultado['archivos']) ? stream_get_contents($resultado['archivos']) : $resultado['archivos'];
                $archivosExistentes = json_decode($jsonString, true);
                if (!is_array($archivosExistentes)) $archivosExistentes = [];
            }
            
            $archivosAEliminar = isset($_POST['archivos_eliminar']) ? json_decode($_POST['archivos_eliminar'], true) : [];
            $nombresAEliminar = array_column($archivosAEliminar, 'nombre');
            
            $archivosExistentesFiltrados = array_filter($archivosExistentes, function($archivo) use ($nombresAEliminar) {
                return !in_array($archivo['nombre'], $nombresAEliminar);
            });
            
            $archivos = array_merge($archivosExistentesFiltrados, $archivosNuevos);
            $archivosJson = !empty($archivos) ? json_encode($archivos) : null;
            
            if($id_evento == 0 || empty($fecha)) {
                echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                return;
            }
            if(empty($titulo)) {
                $titulo = "SIN TÍTULO";
            }
            
            $this->conn->beginTransaction();
            
            if($id_calendario) {
                $queryCalendario = "UPDATE calendario_eventos SET 
                                    fecha = :fecha,
                                    hora = :hora,
                                    titulo = :titulo,
                                    descripcion = :descripcion,
                                    archivos = :archivos,
                                    ubicacion_link = :ubicacion_link,
                                    ubicacion_lat = :ubicacion_lat,
                                    ubicacion_lng = :ubicacion_lng
                                    WHERE id_evento = :id_calendario";
                
                $stmtCalendario = $this->conn->prepare($queryCalendario);
                $stmtCalendario->bindParam(':id_calendario', $id_calendario);
                $stmtCalendario->bindParam(':fecha', $fecha);
                $stmtCalendario->bindParam(':hora', $hora);
                $stmtCalendario->bindParam(':titulo', $titulo);
                $stmtCalendario->bindParam(':descripcion', $descripcion);
                $stmtCalendario->bindParam(':archivos', $archivosJson);
                $stmtCalendario->bindParam(':ubicacion_link', $ubicacionLink);
                $stmtCalendario->bindParam(':ubicacion_lat', $ubicacionLat);
                $stmtCalendario->bindParam(':ubicacion_lng', $ubicacionLng);
                $stmtCalendario->execute();
            }
            
            $queryAgenda = "UPDATE agenda_eventos SET 
                            fecha = :fecha,
                            hora = :hora,
                            titulo = :titulo,
                            descripcion = :descripcion,
                            archivos = :archivos,
                            ubicacion_link = :ubicacion_link,
                            ubicacion_lat = :ubicacion_lat,
                            ubicacion_lng = :ubicacion_lng
                            WHERE id_evento = :id_evento";
            
            $stmtAgenda = $this->conn->prepare($queryAgenda);
            $stmtAgenda->bindParam(':id_evento', $id_evento);
            $stmtAgenda->bindParam(':fecha', $fecha);
            $stmtAgenda->bindParam(':hora', $hora);
            $stmtAgenda->bindParam(':titulo', $titulo);
            $stmtAgenda->bindParam(':descripcion', $descripcion);
            $stmtAgenda->bindParam(':archivos', $archivosJson);
            $stmtAgenda->bindParam(':ubicacion_link', $ubicacionLink);
            $stmtAgenda->bindParam(':ubicacion_lat', $ubicacionLat);
            $stmtAgenda->bindParam(':ubicacion_lng', $ubicacionLng);
            
            if($stmtAgenda->execute()) {
                $this->guardarUsuariosCompartidos($id_evento, $usuariosCompartidos);
                $this->conn->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Evento actualizado exitosamente'
                ]);
            } else {
                $this->conn->rollBack();
                echo json_encode(['success' => false, 'message' => 'Error al actualizar el evento']);
            }
            
        } catch(Exception $e) {
            if($this->conn->inTransaction()) $this->conn->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Error en la operación: ' . $e->getMessage()
            ]);
        }
    }
    
    private function delete() {
        try {
            $id_evento = isset($_POST['id_evento']) ? $_POST['id_evento'] : 0;
            
            if($id_evento == 0) {
                echo json_encode(['success' => false, 'message' => 'ID de evento no proporcionado']);
                return;
            }
            
            // Obtener id_calendario antes de eliminar
            $querySelect = "SELECT id_calendario FROM agenda_eventos WHERE id_evento = :id_evento";
            $stmtSelect = $this->conn->prepare($querySelect);
            $stmtSelect->bindParam(':id_evento', $id_evento);
            $stmtSelect->execute();
            $resultado = $stmtSelect->fetch(PDO::FETCH_ASSOC);
            $id_calendario = $resultado ? $resultado['id_calendario'] : null;
            
            $this->conn->beginTransaction();
            
            // 1. Eliminar de anotaciones_compartidas
            $queryDeleteCompartidas = "DELETE FROM anotaciones_compartidas WHERE id_evento = :id_evento";
            $stmtDeleteCompartidas = $this->conn->prepare($queryDeleteCompartidas);
            $stmtDeleteCompartidas->bindParam(':id_evento', $id_evento);
            $stmtDeleteCompartidas->execute();
            
            // 2. Eliminar de agenda_eventos
            $queryAgenda = "DELETE FROM agenda_eventos WHERE id_evento = :id_evento";
            $stmtAgenda = $this->conn->prepare($queryAgenda);
            $stmtAgenda->bindParam(':id_evento', $id_evento);
            
            if(!$stmtAgenda->execute()) {
                $this->conn->rollBack();
                echo json_encode(['success' => false, 'message' => 'Error al eliminar de agenda']);
                return;
            }
            
            // 3. Eliminar de calendario_eventos si existe
            if($id_calendario) {
                $queryCalendario = "DELETE FROM calendario_eventos WHERE id_evento = :id_calendario";
                $stmtCalendario = $this->conn->prepare($queryCalendario);
                $stmtCalendario->bindParam(':id_calendario', $id_calendario);
                $stmtCalendario->execute();
            }
            
            $this->conn->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Evento eliminado exitosamente'
            ]);
            
        } catch(Exception $e) {
            if($this->conn->inTransaction()) $this->conn->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Error en la operación: ' . $e->getMessage()
            ]);
        }
    }
    
    public function descargarArchivo() {
        $id_evento = isset($_GET['id_evento']) ? $_GET['id_evento'] : 0;
        $nombreArchivo = isset($_GET['nombre']) ? urldecode($_GET['nombre']) : '';
        
        if (!$id_evento || !$nombreArchivo) {
            header('HTTP/1.0 400 Bad Request');
            echo json_encode(['success' => false, 'message' => 'Parámetros incompletos']);
            return;
        }
        
        $archivo = $this->obtenerArchivo($id_evento, $nombreArchivo);
        
        if ($archivo) {
            header('Content-Type: ' . $archivo['tipo']);
            header('Content-Disposition: attachment; filename="' . $archivo['nombre'] . '"');
            header('Content-Length: ' . strlen($archivo['contenido']));
            echo $archivo['contenido'];
        } else {
            header('HTTP/1.0 404 Not Found');
            echo json_encode(['success' => false, 'message' => 'Archivo no encontrado']);
        }
    }
}

$api = new AgendaAPI();

if (isset($_GET['descargar']) && $_GET['descargar'] == 1) {
    $api->descargarArchivo();
} else {
    $api->procesarPeticion();
}
?>