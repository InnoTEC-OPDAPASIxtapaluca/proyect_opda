<?php
// php/conexion/conexion.php
class Database {
    private $host;
    private $port = "3306";
    private $credentials = [];
    private $connections = [];
    private $isLocal;
    
    public function __construct() {
        // Detectar si estamos en entorno local
        $this->isLocal = ($_SERVER['SERVER_NAME'] == 'localhost' || 
                          $_SERVER['SERVER_ADDR'] == '127.0.0.1' ||
                          strpos($_SERVER['HTTP_HOST'], 'localhost') !== false);
        
        if ($this->isLocal) {
            // Configuración LOCAL
            $this->host = "localhost";
            $this->credentials = [
                'login_op' => [
                    'username' => 'root',
                    'password' => ''
                ],
                'accesos_op' => [
                    'username' => 'root',
                    'password' => ''
                ],
                'infraestructura_op' => [
                    'username' => 'root',
                    'password' => ''
                ]
            ];
        } else {
            // Configuración HOSTINGER
            $this->host = "localhost";
            $this->credentials = [
                'login_op' => [
                    'username' => 'u167111103_opda0',
                    'password' => '24092004.Jgl'
                ],
                'accesos_op' => [
                    'username' => 'u167111103_opda1',
                    'password' => '24092004.Jgl'
                ],
                'infra_op' => [
                    'username' => 'u167111103_infra_op',
                    'password' => '24092004.Jgl'
                ]
            ];
        }
    }
    
    public function getConnection($dbname) {
        if (!isset($this->connections[$dbname])) {
            try {
                // Verificar si existe el nombre de la base de datos en las credenciales
                if (!isset($this->credentials[$dbname])) {
                    throw new Exception("No hay credenciales definidas para la base de datos: {$dbname}");
                }
                
                $username = $this->credentials[$dbname]['username'];
                $password = $this->credentials[$dbname]['password'];
                
                // Obtener nombre real de la base de datos según el entorno
                $realDbName = $this->getRealDatabaseName($dbname);
                
                $dsn = "mysql:host={$this->host};port={$this->port};dbname={$realDbName};charset=utf8mb4";
                $this->connections[$dbname] = new PDO($dsn, $username, $password);
                $this->connections[$dbname]->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->connections[$dbname]->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                
            } catch(PDOException $e) {
                die("Error de conexión a {$dbname}: " . $e->getMessage());
            } catch(Exception $e) {
                die($e->getMessage());
            }
        }
        return $this->connections[$dbname];
    }
    
    private function getRealDatabaseName($dbname) {
        if ($this->isLocal) {
            // En LOCAL, los nombres son directos
            return $dbname;
        } else {
            // En HOSTINGER, mapeo de nombres internos a reales
            $realDbNames = [
                'login_op' => 'u167111103_login_op',
                'accesos_op' => 'u167111103_accesos_op',
                'infraestructura_op' => 'u167111103_infra_op' // Si existe en Hostinger
            ];
            
            return isset($realDbNames[$dbname]) ? $realDbNames[$dbname] : $dbname;
        }
    }
    
    // Métodos de conveniencia
    public function getDefaultConnection() {
        return $this->getConnection("login_op");
    }
    
    public function getAccesosConnection() {
        return $this->getConnection("accesos_op");
    }
    
    public function getInfraestructuraConnection() {
        return $this->getConnection("infraestructura_op");
    }
    
    // Método para cerrar todas las conexiones
    public function closeAllConnections() {
        foreach ($this->connections as $key => $connection) {
            $this->connections[$key] = null;
        }
    }
    
    // Método útil para debugging
    public function getEnvironment() {
        return $this->isLocal ? "LOCAL" : "HOSTINGER";
    }
}

// Crear instancia global
$db = new Database();

// Establecer las conexiones según disponibilidad
try {
    $conn = $db->getDefaultConnection();
    $conn_accesos = $db->getAccesosConnection();
    
    // Solo intentar infraestructura si estamos en local
    // o si sabes que existe en Hostinger
    if ($db->getEnvironment() == "LOCAL") {
        $conn_infraestructura = $db->getInfraestructuraConnection();
    }
} catch (Exception $e) {
    die("Error al establecer conexiones: " . $e->getMessage());
}

// Opcional: puedes definir variables globales por compatibilidad
// con código existente
if (!isset($conn_infraestructura) && $db->getEnvironment() == "HOSTINGER") {
    $conn_infraestructura = null; // o manejarlo de otra forma
}
?>