<?php
// php/login/get_all_areas.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../conexion/conexion.php';

class GetAllAreasHandler {
    private $conn;
    
    public function __construct() {
        $db = new Database();
        $this->conn = $db->getConnection('login');
        if (!$this->conn) {
            $this->sendResponse(false, "Error de conexión a la base de datos");
        }
    }
    
    public function getAllAreas() {
        try {
            $query = "SELECT id, area FROM areas ORDER BY area";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $areas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $this->sendResponse(true, "Áreas obtenidas correctamente", [
                'areas' => $areas
            ]);
        } catch (PDOException $e) {
            error_log("Error en get_all_areas: " . $e->getMessage());
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
    $handler = new GetAllAreasHandler();
    $handler->getAllAreas();
} else {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>