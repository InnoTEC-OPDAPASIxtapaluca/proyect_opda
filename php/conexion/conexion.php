<?php
// php/conexion/conexion.php
class Database {
    private $host = "localhost";
    private $username = "root";
    private $password = "";
    private $connections = [];
    
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
    
    public function getDefaultConnection() {
        return $this->getConnection("login_op");
    }
    
    public function getAccesosConnection() {
        return $this->getConnection("accesos_op");
    }
    
    public function getPermisosConnection() {
        return $this->getConnection("permisos_op");
    }
}

$db = new Database();
$conn = $db->getDefaultConnection();
$conn_accesos = $db->getAccesosConnection();
$conn_permisos = $db->getPermisosConnection();
?>