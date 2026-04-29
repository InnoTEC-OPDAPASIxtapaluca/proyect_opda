<?php
// php/login/get_areas.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../conexion/conexion.php';

class GetAreasHandler {
    private $conn;
    
    public function __construct() {
        $db = new Database();
        $this->conn = $db->getConnection('login');
        if (!$this->conn) {
            $this->sendResponse(false, "Error de conexión a la base de datos");
        }
    }
    
    /**
     * Obtener áreas (puede ser todas o filtradas por usuario)
     */
    public function getAreas($usuarioId = null) {
        try {
            // Si se proporciona un usuario, obtener SOLO el área a la que pertenece
            if ($usuarioId) {
                $query = "SELECT a.id, a.area 
                          FROM areas a
                          JOIN usuarios_internos u ON u.area_id = a.id
                          WHERE u.id = :usuario_id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':usuario_id', $usuarioId);
                $stmt->execute();
                
                $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $this->sendResponse(true, "Área del usuario obtenida", ['areas' => $areas]);
            } 
            // Si no hay usuario, obtener TODAS las áreas (para el selector)
            else {
                $query = "SELECT id, area FROM areas ORDER BY area";
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
                
                $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $this->sendResponse(true, "Todas las áreas obtenidas", ['areas' => $areas]);
            }
        } catch (PDOException $e) {
            error_log("Error en get_areas: " . $e->getMessage());
            $this->sendResponse(false, "Error interno del servidor");
        }
    }
    
    private function sendResponse($success, $message, $data = null) {
        $response = ['success' => $success, 'message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        echo json_encode($response);
        exit;
    }
}

// Procesar la solicitud
if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = [];
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $input = $_GET;
    }
    
    $usuarioId = isset($input['usuario_id']) ? (int)$input['usuario_id'] : null;
    
    $handler = new GetAreasHandler();
    $handler->getAreas($usuarioId);
} else {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>