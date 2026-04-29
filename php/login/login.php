<?php
// php/login/login.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../conexion/conexion.php';

class LoginHandler {
    private $conn;
    
    public function __construct() {
        $db = new Database();
        $this->conn = $db->getConnection('login');
        if (!$this->conn) {
            $this->sendResponse(false, "Error de conexión a la base de datos");
        }
    }
    
    public function login($nomina, $password, $selectedAreaId = null) {
        if (empty($nomina) || empty($password)) {
            $this->sendResponse(false, "Nómina y contraseña son requeridos");
        }
        
        try {
            // Obtener usuario por nómina
            $query = "SELECT u.*, a.area as area_nombre, r.rol as rol_nombre 
                      FROM usuarios_internos u 
                      JOIN areas a ON u.area_id = a.id 
                      JOIN roles r ON u.rol_id = r.id 
                      WHERE u.no_nomina = :nomina";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':nomina', $nomina);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                $this->sendResponse(false, "Nómina o contraseña incorrectos");
            }
            
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verificar contraseña
            if (!password_verify($password, $usuario['password'])) {
                $this->sendResponse(false, "Nómina o contraseña incorrectos");
            }
            
            // Validar si el usuario puede cambiar de área
            $areasPermitidasCambio = ['INNOVACION_TECNOLOGICA', 'DIRECCION_GENERAL'];
            $puedeCambiarArea = in_array($usuario['area_nombre'], $areasPermitidasCambio);
            
            // Si seleccionó un área diferente y tiene permiso, actualizar el área
            $areaFinalId = $usuario['area_id'];
            $areaFinalNombre = $usuario['area_nombre'];
            
            if ($puedeCambiarArea && $selectedAreaId && $selectedAreaId != $usuario['area_id']) {
                $areaQuery = "SELECT id, area FROM areas WHERE id = :area_id";
                $areaStmt = $this->conn->prepare($areaQuery);
                $areaStmt->bindParam(':area_id', $selectedAreaId);
                $areaStmt->execute();
                
                if ($areaStmt->rowCount() > 0) {
                    $selectedArea = $areaStmt->fetch();
                    $areaFinalId = $selectedArea['id'];
                    $areaFinalNombre = $selectedArea['area'];
                }
            }
            
            // Iniciar sesión
            session_start();
            
            $esPrimerInicio = ($usuario['numero_inicio'] == 0);
            
            // Preparar datos del usuario (NO incluye redirección, eso va en JS)
            $userData = [
                'id' => $usuario['id'],
                'nombre' => $usuario['nombre'],
                'apellido_paterno' => $usuario['apellido_paterno'],
                'apellido_materno' => $usuario['apellido_materno'],
                'identificador' => $usuario['no_nomina'],
                'area_id' => $areaFinalId,
                'area_nombre' => $areaFinalNombre,
                'rol_id' => $usuario['rol_id'],
                'rol_nombre' => $usuario['rol_nombre'],
                'correo' => $usuario['correo_electronico'],
                'primer_inicio' => $esPrimerInicio
            ];
            
            $_SESSION['usuario'] = $userData;
            setcookie('usuario_simple', json_encode($userData), time() + 3600, '/');
            
            // Solo enviamos los datos, la redirección la maneja JS
            $this->sendResponse(true, "Acceso concedido", [
                'user' => $userData
            ]);
            
        } catch (PDOException $e) {
            error_log("Error en login: " . $e->getMessage());
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

// Procesar la solicitud POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $nomina = isset($input['nomina']) ? trim($input['nomina']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    $selectedAreaId = isset($input['area_id']) ? (int)$input['area_id'] : null;
    
    $loginHandler = new LoginHandler();
    $loginHandler->login($nomina, $password, $selectedAreaId);
} else {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>