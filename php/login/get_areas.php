<?php
// php/login/get_areas.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

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
    
    public function getAreas() {
        try {
            $query = "SELECT id, area FROM areas ORDER BY id";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->sendResponse(true, "Áreas obtenidas", ['areas' => $areas]);
        } catch (PDOException $e) {
            error_log("Error en get_areas: " . $e->getMessage());
            $this->sendResponse(false, "Error interno del servidor");
        }
    }
    
    private function sendResponse($success, $message, $data = null) {
        $response = ['success' => $success, 'message' => $message];
        if ($data !== null) {
            $response = array_merge($response, $data);
        }
        echo json_encode($response);
        exit;
    }
}

// Procesar la solicitud GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $handler = new GetAreasHandler();
    $handler->getAreas();
} else {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>