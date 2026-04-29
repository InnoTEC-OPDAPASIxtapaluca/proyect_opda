<?php
// php/login/validate_nomina.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../conexion/conexion.php';

class ValidateNominaHandler {
    private $conn;
    
    public function __construct() {
        $db = new Database();
        $this->conn = $db->getConnection('login');
        if (!$this->conn) {
            $this->sendResponse(false, "Error de conexión a la base de datos");
        }
    }
    
    public function validate($nomina) {
        if (empty($nomina)) {
            $this->sendResponse(false, "Nómina requerida");
        }
        
        try {
            $query = "SELECT 
                        u.id, 
                        u.nombre, 
                        u.apellido_paterno, 
                        u.apellido_materno,
                        u.no_nomina,
                        u.area_id,
                        a.area as area_nombre,
                        u.rol_id,
                        r.rol as rol_nombre,
                        u.numero_inicio
                      FROM usuarios_internos u
                      JOIN areas a ON u.area_id = a.id
                      JOIN roles r ON u.rol_id = r.id
                      WHERE u.no_nomina = :nomina";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':nomina', $nomina);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Determinar si el usuario puede cambiar de área 
                $areasPermitidasCambio = ['INNOVACION_TECNOLOGICA', 'DIRECCION_GENERAL'];
                $puedeCambiarArea = in_array($user['area_nombre'], $areasPermitidasCambio);
                
                $this->sendResponse(true, "Usuario encontrado", [
                    'user' => [
                        'id' => $user['id'],
                        'nombre' => $user['nombre'],
                        'apellido_paterno' => $user['apellido_paterno'],
                        'apellido_materno' => $user['apellido_materno'],
                        'no_nomina' => $user['no_nomina'],
                        'area_id' => $user['area_id'],
                        'area_nombre' => $user['area_nombre'],
                        'rol_id' => $user['rol_id'],
                        'rol_nombre' => $user['rol_nombre'],
                        'numero_inicio' => $user['numero_inicio'],
                        'puede_cambiar_area' => $puedeCambiarArea
                    ]
                ]);
            } else {
                $this->sendResponse(false, "Nómina no encontrada");
            }
        } catch (PDOException $e) {
            error_log("Error en validate_nomina: " . $e->getMessage());
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $nomina = isset($input['nomina']) ? trim($input['nomina']) : '';
    
    $handler = new ValidateNominaHandler();
    $handler->validate($nomina);
} else {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>