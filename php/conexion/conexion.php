<?php
// php/conexion/conexion.php - Configuración para múltiples bases de datos
class Database {
    private $host = "localhost";
    private $username = "root";
    private $password = "";
    
    // Array de conexiones activas
    private $connections = [];
    
    // Método para conectar a una base de datos específica
    public function getConnection($dbname) {
        if (!isset($this->connections[$dbname])) {
            try {
                $dsn = "mysql:host={$this->host};dbname={$dbname};charset=utf8mb4";
                $this->connections[$dbname] = new PDO($dsn, $this->username, $this->password);
                $this->connections[$dbname]->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch(PDOException $e) {
                die("Error de conexión a {$dbname}: " . $e->getMessage());
            }
        }
        return $this->connections[$dbname];
    }
    
    // Conexión por defecto a login_op
    public function getDefaultConnection() {
        return $this->getConnection("login_op");
    }
}

// Crear instancia única
$db = new Database();
$conn = $db->getDefaultConnection();
?>