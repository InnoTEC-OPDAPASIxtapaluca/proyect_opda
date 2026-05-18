<?php
// php/agregar_usuario/config_mail_tecnico.php

/**
 * CONFIGURACIÓN DE CORREO ELECTRÓNICO - AGREGAR USUARIO
 */

class MailConfigTecnico {
    // Configuración de Gmail
    private static $config = [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'auth' => true,
        'secure' => 'tls',
        'username' => 'jesusguzz24@gmail.com', // ⚠️ CAMBIA ESTO por tu correo
        'password' => 'wnox hdzr cotf hswk',   // ⚠️ CAMBIA ESTO por tu contraseña de aplicación
        'from_name' => 'OPDAPAS IXTAPALUCA',
        'from_email' => 'jesusguzz24@gmail.com'
    ];
    
    /**
     * Obtiene la configuración de correo
     */
    public static function getConfig() {
        return self::$config;
    }
    
    /**
     * Valida si la configuración está completa
     */
    public static function isValid() {
        $config = self::$config;
        return !empty($config['username']) && 
               $config['username'] !== 'TU_CORREO@gmail.com' &&
               !empty($config['password']) &&
               $config['password'] !== 'TU_CONTRASEÑA_APP';
    }
}
?>