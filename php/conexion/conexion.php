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
    
    // ELIMINADO: getPermisosConnection()
    
    public function getInfraestructuraConnection() {
        return $this->getConnection("infraestructura_op");
    }
}

$db = new Database();
$conn = $db->getDefaultConnection(); // Esta es la conexión a login_op (usuarios + permisos)
$conn_accesos = $db->getAccesosConnection();
$conn_infraestructura = $db->getInfraestructuraConnection();
// ELIMINADO: $conn_permisos
?>