<?php
// php/cambio_contraseña/update_password.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../conexion/conexion.php';

class UpdatePasswordHandler {
    private $conn;
    
    public function __construct() {
        $this->conn = getDB();
        if (!$this->conn) {
            $this->sendResponse(false, "Error de conexión a la base de datos");
        }
    }
    
    /**
     * Validar que la contraseña cumpla con los requisitos
     */
    private function validatePassword($password) {
        // Mínimo 8 caracteres
        if (strlen($password) < 8) {
            return false;
        }
        // Al menos 1 mayúscula
        if (!preg_match('/[A-Z]/', $password)) {
            return false;
        }
        // Al menos 1 carácter especial
        if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $password)) {
            return false;
        }
        // Al menos 1 número
        if (!preg_match('/[0-9]/', $password)) {
            return false;
        }
        return true;
    }
    
    /**
     * Actualizar la contraseña del usuario y marcar que ya NO es primer inicio
     */
    public function updatePassword($userId, $newPassword) {
        // Validar que los campos no estén vacíos
        if (empty($userId) || empty($newPassword)) {
            $this->sendResponse(false, "ID de usuario y contraseña son requeridos");
        }
        
        // Validar la nueva contraseña
        if (!$this->validatePassword($newPassword)) {
            $this->sendResponse(false, "La contraseña no cumple con los requisitos de seguridad");
        }
        
        try {
            // Verificar que el usuario existe y obtener su estado actual
            $checkQuery = "SELECT id, No_Inicio FROM usuarios_internos WHERE id = :id";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':id', $userId);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() == 0) {
                $this->sendResponse(false, "Usuario no encontrado");
            }
            
            $usuario = $checkStmt->fetch();
            
            // CORREGIDO: Solo permitir cambio si No_Inicio es 0 (primer inicio)
            if ($usuario['No_Inicio'] == 1) {
                $this->sendResponse(false, "Este usuario ya ha cambiado su contraseña anteriormente");
            }
            
            // Hashear la nueva contraseña
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            
            // CORREGIDO: Actualizar contraseña y marcar como primer inicio completado (No_Inicio = 1)
            // Esto SOLO ocurre cuando el usuario confirma el cambio
            $updateQuery = "UPDATE usuarios_internos SET Contraseña = :password, No_Inicio = 1 WHERE id = :id AND No_Inicio = 0";
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->bindParam(':password', $hashedPassword);
            $updateStmt->bindParam(':id', $userId);
            
            if ($updateStmt->execute()) {
                if ($updateStmt->rowCount() > 0) {
                    $this->sendResponse(true, "Contraseña actualizada correctamente");
                } else {
                    // Esto puede pasar si otro proceso ya cambió el No_Inicio
                    $this->sendResponse(false, "No se pudo actualizar. Verifique que sea su primer inicio de sesión.");
                }
            } else {
                $this->sendResponse(false, "Error al actualizar la contraseña");
            }
            
        } catch (PDOException $e) {
            error_log("Error en update_password: " . $e->getMessage());
            $this->sendResponse(false, "Error interno del servidor");
        }
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
    
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $newPassword = isset($input['new_password']) ? $input['new_password'] : '';
    
    $handler = new UpdatePasswordHandler();
    $handler->updatePassword($userId, $newPassword);
} else {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>