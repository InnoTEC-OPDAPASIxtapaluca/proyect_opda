<?php
// php/agregar_usuario/config_mail_tecnico.php

/**
 * CONFIGURACIÓN DE CORREO ELECTRÓNICO - AGREGAR USUARIO
 * Soporta múltiples entornos (Local y Hostinger)
 */

class MailConfigTecnico {
    // Configuración por entorno
    private static $environments = [
        'local' => [
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'auth' => true,
            'secure' => 'tls',
            'username' => 'jesusguzz24@gmail.com',
            'password' => 'wnox hdzr cotf hswk',  // Contraseña de aplicación
            'from_name' => 'OPDAPAS IXTAPALUCA - LOCAL',
            'from_email' => 'jesusguzz24@gmail.com'
        ],
        'hostinger' => [
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'auth' => true,
            'secure' => 'tls',
            'username' => 'innovacion.tecnologica.2024@gmail.com',
            'password' => 'jgfp mdmu rgtq aghf',  // ⚠️ DEBES AGREGAR LA CONTRASEÑA DE APLICACIÓN
            'from_name' => 'OPDAPAS IXTAPALUCA',
            'from_email' => 'innovacion.tecnologica.2024@gmail.com'
        ]
    ];
    
    /**
     * Detecta el entorno actual
     */
    private static function getEnvironment() {
        // Detectar si estamos en local
        $isLocal = (
            $_SERVER['SERVER_NAME'] == 'localhost' || 
            $_SERVER['SERVER_ADDR'] == '127.0.0.1' ||
            strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
            strpos($_SERVER['HTTP_HOST'], '192.168.') !== false ||
            strpos($_SERVER['HTTP_HOST'], '10.0.') !== false
        );
        
        return $isLocal ? 'local' : 'hostinger';
    }
    
    /**
     * Obtiene la configuración de correo para el entorno actual
     */
    public static function getConfig() {
        $env = self::getEnvironment();
        return self::$environments[$env];
    }
    
    /**
     * Obtiene la configuración completa de todos los entornos
     */
    public static function getAllConfigs() {
        return self::$environments;
    }
    
    /**
     * Obtiene el entorno actual
     */
    public static function getCurrentEnvironment() {
        return self::getEnvironment();
    }
    
    /**
     * Valida si la configuración está completa
     */
    public static function isValid() {
        $config = self::getConfig();
        return !empty($config['username']) && 
               !empty($config['password']) &&
               $config['password'] !== '';
    }
    
    /**
     * Valida una configuración específica
     */
    public static function isConfigValid($environment) {
        if (!isset(self::$environments[$environment])) {
            return false;
        }
        $config = self::$environments[$environment];
        return !empty($config['username']) && 
               !empty($config['password']) &&
               $config['password'] !== '';
    }
    
    /**
     * Actualiza la contraseña de un entorno (útil para configuración dinámica)
     */
    public static function updatePassword($environment, $newPassword) {
        if (isset(self::$environments[$environment])) {
            self::$environments[$environment]['password'] = $newPassword;
            self::$environments[$environment]['from_email'] = self::$environments[$environment]['username'];
            return true;
        }
        return false;
    }
}

// Crear constantes útiles para el resto de la aplicación
define('MAIL_ENV', MailConfigTecnico::getCurrentEnvironment());
define('MAIL_CONFIG', MailConfigTecnico::getConfig());
?>