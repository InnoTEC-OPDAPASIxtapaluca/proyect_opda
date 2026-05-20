<?php
// php/agregar_usuario/template_correo_tecnico.php

/**
 * Genera el HTML del correo electrónico para nuevo usuario
 */

function generarTemplateCorreoTecnico($datosUsuario, $passwordTemporal) {
    $nombreCompleto = trim($datosUsuario['nombre'] . ' ' .
                           $datosUsuario['apellido_paterno'] . ' ' .
                           ($datosUsuario['apellido_materno'] ?? ''));
    
    $rolMostrar = strtoupper($datosUsuario['rol']);
    $identificador = $datosUsuario['identificador'];
    
    $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
    <title>Bienvenido a OPDAPAS IXTAPALUCA</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 20px;
            background-color: #0f0218;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
        }
        
        .container {
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a040b 0%, #0f0218 100%);
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid rgba(187, 147, 88, 0.3);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        
        .header {
            background: linear-gradient(135deg, #691a30, #8b2c3e);
            padding: 35px 25px;
            text-align: center;
            border-bottom: 1px solid rgba(187, 147, 88, 0.3);
        }
        
        .logo-area {
            margin-bottom: 15px;
        }
        
        .logo-icon {
            font-size: 48px;
            color: #bb9358;
        }
        
        .header h1 {
            color: #bb9358;
            font-size: clamp(24px, 6vw, 32px);
            font-weight: 700;
            margin: 0;
            letter-spacing: 2px;
        }
        
        .header .subtitulo {
            color: #e8d1d9;
            font-size: clamp(11px, 3vw, 13px);
            margin-top: 10px;
            font-weight: normal;
        }
        
        .content {
            padding: 30px 25px;
        }
        
        .saludo {
            font-size: clamp(16px, 4vw, 18px);
            color: #ffffff;
            margin-bottom: 20px;
            border-left: 4px solid #bb9358;
            padding-left: 18px;
        }
        
        .saludo strong {
            color: #bb9358;
            font-size: clamp(18px, 5vw, 20px);
        }
        
        .mensaje {
            color: rgba(255,255,255,0.8);
            line-height: 1.6;
            margin-bottom: 25px;
            font-size: clamp(13px, 3.5vw, 14px);
        }
        
        .datos-usuario {
            background: rgba(0,0,0,0.4);
            border-radius: 16px;
            margin: 25px 0;
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
        }
        
        .datos-usuario tr {
            border-bottom: 1px solid rgba(187, 147, 88, 0.2);
        }
        
        .datos-usuario tr:last-child {
            border-bottom: none;
        }
        
        .datos-usuario td {
            padding: 14px 18px;
            font-size: clamp(13px, 3.5vw, 14px);
        }
        
        .label {
            font-weight: 600;
            color: #bb9358;
            width: 40%;
            background: rgba(187, 147, 88, 0.05);
        }
        
        .valor {
            color: #ffffff;
            font-weight: 500;
            word-break: break-word;
        }
        
        .password-box {
            background: rgba(187, 147, 88, 0.1);
            border: 1px solid rgba(187, 147, 88, 0.4);
            border-radius: 16px;
            padding: 20px 15px;
            text-align: center;
            margin: 25px 0;
        }
        
        .password-label {
            font-size: clamp(11px, 3vw, 13px);
            font-weight: 600;
            color: #bb9358;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 12px;
        }
        
        .password-value {
            font-size: clamp(22px, 6vw, 28px);
            font-weight: 700;
            font-family: 'Courier New', monospace;
            color: #bb9358;
            letter-spacing: 3px;
            background: rgba(0,0,0,0.5);
            display: inline-block;
            padding: 10px 20px;
            border-radius: 12px;
            border: 1px solid rgba(187, 147, 88, 0.3);
        }
        
        .aviso {
            background: rgba(105, 26, 48, 0.3);
            border-left: 4px solid #bb9358;
            border-radius: 12px;
            padding: 16px;
            margin: 25px 0;
            font-size: clamp(12px, 3.5vw, 13px);
        }
        
        .aviso strong {
            color: #bb9358;
            display: block;
            margin-bottom: 8px;
        }
        
        .aviso p {
            color: rgba(255,255,255,0.8);
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0 20px;
        }
        
        .btn-acceso {
            background: linear-gradient(135deg, #691a30, #8b2c3e);
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            display: inline-block;
            font-weight: 600;
            font-size: clamp(13px, 3.5vw, 14px);
            border-radius: 40px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        
        .btn-acceso:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(187, 147, 88, 0.3);
        }
        
        .notas {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(187, 147, 88, 0.2);
            font-size: clamp(11px, 3vw, 12px);
        }
        
        .notas p {
            margin: 8px 0;
            color: rgba(255,255,255,0.5);
        }
        
        .notas strong {
            color: #bb9358;
        }
        
        .footer {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            text-align: center;
            font-size: clamp(10px, 2.5vw, 11px);
            border-top: 1px solid rgba(187, 147, 88, 0.2);
        }
        
        .footer p {
            margin: 5px 0;
            color: rgba(255,255,255,0.4);
        }
        
        @media only screen and (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .content {
                padding: 20px 18px;
            }
            
            .datos-usuario, .datos-usuario tbody, .datos-usuario tr, .datos-usuario td {
                display: block;
                width: 100%;
            }
            
            .label {
                width: 100%;
                padding-bottom: 6px;
            }
            
            .btn-acceso {
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-area">
                <i class="fas fa-tint logo-icon" style="font-family: 'Font Awesome 6 Free'; font-weight: 900;">&#xf043;</i>
            </div>
            <h1>OPDAPAS IXTAPALUCA</h1>
            <div class="subtitulo">
                Sistema de Gestión de Agua Potable y Saneamiento<br>
                H. Ayuntamiento de Ixtapaluca
            </div>
        </div>
        
        <div class="content">
            <div class="saludo">
                <strong>BIENVENID@ {$nombreCompleto}</strong>
            </div>
            
            <div class="mensaje">
                Su cuenta ha sido creada exitosamente en el sistema Ixtec-Digital. A continuación encontrará sus credenciales de acceso:
            </div>
            
            <table class="datos-usuario">
                <tr>
                    <td class="label">NUMERO DE NOMINA</td>
                    <td class="valor">{$identificador}</td>
                </tr>
                <tr>
                    <td class="label">ROL ASIGNADO</td>
                    <td class="valor">{$rolMostrar}</td>
                </tr>
            </table>
            
            <div class="password-box">
                <div class="password-label">CONTRASEÑA TEMPORAL</div>
                <div class="password-value">{$passwordTemporal}</div>
            </div>
            
            <div class="aviso">
                <strong>⚠️ IMPORTANTE:</strong>
                <p>Esta es una contraseña temporal. Al iniciar sesión por primera vez, el sistema le solicitará cambiar su contraseña por una personalizada para mayor seguridad.</p>
            </div>
            
            <div class="button-container">
                <a href="#" class="btn-acceso" style="color: #ffffff; text-decoration: none;">🔐 ACCEDER AL SISTEMA</a>
            </div>
            
            <div class="notas">
                <p><strong>📋 Notas importantes:</strong></p>
                <p>• Guarde esta información en un lugar seguro.</p>
                <p>• Si no solicitó esta cuenta, haga omiso a este mensaje.</p>
                <p>• Para mayor seguridad, no comparta su contraseña con nadie.</p>
                <p>• Recomendamos cambiar su contraseña en el primer inicio de sesión.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2026 OPDAPAS IXTAPALUCA - H. Ayuntamiento de Ixtapaluca</p>
            <p>Este es un mensaje automático, por favor no responder a este correo.</p>
            <p>Sistema de Gestión de Agua Potable y Saneamiento</p>
        </div>
    </div>
</body>
</html>
HTML;

    return $html;
}
?>