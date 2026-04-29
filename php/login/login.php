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
        $this->conn = getDB();
        if (!$this->conn) {
            $this->sendResponse(false, "Error de conexión a la base de datos");
        }
    }
    
    public function login($identificador, $password) {
        // Validar que los campos no estén vacíos
        if (empty($identificador) || empty($password)) {
            $this->sendResponse(false, "Identificador y contraseña son requeridos");
        }
        
        try {
            // Buscar usuario por identificador
            $query = "SELECT u.*, r.rol FROM usuarios_internos u 
                      JOIN roles r ON u.id_rol = r.id 
                      WHERE u.identificador = :identificador";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':identificador', $identificador);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                $this->sendResponse(false, "Identificador o contraseña incorrectos");
            }
            
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verificar contraseña
            if (!password_verify($password, $usuario['Contraseña'])) {
                $this->sendResponse(false, "Identificador o contraseña incorrectos");
            }
            
            // ============================================================
            // IMPORTANTE: INICIAR SESIÓN Y GUARDAR DATOS DEL USUARIO
            // ============================================================
            session_start();
            
            $esPrimerInicio = ($usuario['No_Inicio'] == 0);
            $rol = $usuario['rol'];
            
            // Preparar datos del usuario
            $userData = [
                'id' => $usuario['id'],
                'nombre' => $usuario['Nombre'],
                'apellido_paterno' => $usuario['Apellido_Paterno'],
                'apellido_materno' => $usuario['Apellido_Materno'],
                'identificador' => $usuario['identificador'],
                'rol' => $rol,
                'correo' => $usuario['Correo'],
                'primer_inicio' => $esPrimerInicio
            ];
            
            // Guardar en sesión
            $_SESSION['usuario'] = $userData;
            
            // Guardar también en cookie para los iframes
            setcookie('usuario_simple', json_encode($userData), time() + 3600, '/');
            
            // Determinar redirección según el rol
            $redirectTo = $this->getRedirectUrlByRole($rol);
            
            $this->sendResponse(true, "Acceso concedido", [
                'user' => $userData,
                'redirect' => $redirectTo
            ]);
            
        } catch (PDOException $e) {
            error_log("Error en login: " . $e->getMessage());
            $this->sendResponse(false, "Error interno del servidor");
        }
    }
    
    private function getRedirectUrlByRole($rol) {
        if (strpos($rol, 'tecnico') !== false) {
            return "/proyect_opda/html/usuario_tecnico/tecnico.html";
        }
        
        if (strpos($rol, 'operativo') !== false) {
            return "/proyect_opda/html/usuario_operativo/operativo.html";
        }
        
        return "/proyect_opda/login.html";
    }
    
    private function sendResponse($success, $message, $data = null) {
        $response = [
            'success' => $success,
            'message' => $message
        ];
        
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
    
    if (!$input) {
        $input = $_POST;
    }
    
    $identificador = isset($input['nomina']) ? trim($input['nomina']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    
    $loginHandler = new LoginHandler();
    $loginHandler->login($identificador, $password);
} else {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>