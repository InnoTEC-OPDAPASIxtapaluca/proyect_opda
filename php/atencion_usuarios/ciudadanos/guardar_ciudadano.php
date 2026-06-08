<?php
/**
 * guardar_ciudadano.php
 * Guarda (INSERT o UPDATE) un ciudadano en la tabla ciudadanos
 * Recibe JSON por POST
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../conexion/conexion.php';

// Leer datos JSON del cuerpo de la petición
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode([
        'success' => false,
        'error' => 'No se recibieron datos válidos'
    ]);
    exit;
}

try {
    $conn = $db->getAtencionUsuariosConnection();
    
    // Verificar si la tabla ciudadanos existe
    $checkTable = "SHOW TABLES LIKE 'ciudadanos'";
    $tableExists = $conn->query($checkTable)->rowCount() > 0;
    
    if (!$tableExists) {
        echo json_encode([
            'success' => false,
            'error' => 'La tabla ciudadanos no existe. Por favor, créela con el script SQL proporcionado.'
        ]);
        exit;
    }
    
    // Si tiene ID, es UPDATE; si no, es INSERT
    if (isset($input['id']) && !empty($input['id'])) {
        // UPDATE
        $query = "UPDATE ciudadanos SET 
                    formacionId = :formacionId,
                    nombre = :nombre,
                    apellidoPaterno = :apellidoPaterno,
                    apellidoMaterno = :apellidoMaterno,
                    telefonoCasa = :telefonoCasa,
                    telefonoCelular = :telefonoCelular,
                    calle = :calle,
                    numExterior = :numExterior,
                    numInterior = :numInterior,
                    tipoAsentamiento = :tipoAsentamiento,
                    asentamientoId = :asentamientoId,
                    municipio = :municipio,
                    codigoPostal = :codigoPostal,
                    dependenciaId = :dependenciaId,
                    dependenciaNombre = :dependenciaNombre,
                    asentamientoNombre = :asentamientoNombre,
                    fechaActualizacion = NOW()
                  WHERE id = :id";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $input['id']);
        
    } else {
        // INSERT
        $query = "INSERT INTO ciudadanos (
                    formacionId, nombre, apellidoPaterno, apellidoMaterno,
                    telefonoCasa, telefonoCelular, calle, numExterior, numInterior,
                    tipoAsentamiento, asentamientoId, municipio, codigoPostal,
                    dependenciaId, dependenciaNombre, asentamientoNombre, fechaRegistro, fechaActualizacion
                  ) VALUES (
                    :formacionId, :nombre, :apellidoPaterno, :apellidoMaterno,
                    :telefonoCasa, :telefonoCelular, :calle, :numExterior, :numInterior,
                    :tipoAsentamiento, :asentamientoId, :municipio, :codigoPostal,
                    :dependenciaId, :dependenciaNombre, :asentamientoNombre, NOW(), NOW()
                  )";
        
        $stmt = $conn->prepare($query);
    }
    
    // Bind de parámetros comunes
    $stmt->bindParam(':formacionId', $input['formacionId']);
    $stmt->bindParam(':nombre', $input['nombre']);
    $stmt->bindParam(':apellidoPaterno', $input['apellidoPaterno']);
    $stmt->bindParam(':apellidoMaterno', $input['apellidoMaterno']);
    $stmt->bindParam(':telefonoCasa', $input['telefonoCasa']);
    $stmt->bindParam(':telefonoCelular', $input['telefonoCelular']);
    $stmt->bindParam(':calle', $input['calle']);
    $stmt->bindParam(':numExterior', $input['numExterior']);
    $stmt->bindParam(':numInterior', $input['numInterior']);
    $stmt->bindParam(':tipoAsentamiento', $input['tipoAsentamiento']);
    $stmt->bindParam(':asentamientoId', $input['asentamientoId']);
    $stmt->bindParam(':municipio', $input['municipio']);
    $stmt->bindParam(':codigoPostal', $input['codigoPostal']);
    $stmt->bindParam(':dependenciaId', $input['dependenciaId']);
    $stmt->bindParam(':dependenciaNombre', $input['dependenciaNombre']);
    $stmt->bindParam(':asentamientoNombre', $input['asentamientoNombre']);
    
    $stmt->execute();
    
    // Si fue INSERT, obtener el ID generado
    if (!isset($input['id']) || empty($input['id'])) {
        $nuevoId = $conn->lastInsertId();
        $input['id'] = $nuevoId;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $input,
        'message' => isset($input['id']) && !empty($input['id']) ? 'Ciudadano actualizado correctamente' : 'Ciudadano registrado correctamente'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>