/**
 * valvulas.js - Módulo de Válvulas de Distribución
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class ValvulasModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        const config = {
            phpBasePath: '../../php/mapa_general/valvulas/',
            
            // Colores específicos para válvulas (naranja/cobre)
            lineaColor: '#e67e22',
            lineaWeight: 4,
            lineaOpacity: 0.85,
            poligonoColor: '#e67e22',
            poligonoWeight: 2,
            poligonoFillColor: '#e67e22',
            poligonoFillOpacity: 0.15,
            
            // Configuración de iconos
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -28],
            
            zoomLevel: 18,
            tieneSwitchesIndividuales: true
        };
        
        super(map, categoriaId, config);
    }
    
    async cargarDatos() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_datos_valvulas.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error cargando válvulas:", data.error);
                return;
            }
            
            console.log(`✅ Válvulas: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.puntos.size} válvulas cargadas`);
            
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Válvulas:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, descripcion, diametro, colonia, icono, idValvula } = item;
        
        if (tipo === 'POINT' && coordenadas && coordenadas.length >= 2) {
            const [lat, lng] = coordenadas;
            
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                console.warn(`Coordenadas inválidas para válvula: ${idValvula}`, lat, lng);
                return;
            }
            
            const iconoPersonalizado = await this.obtenerIcono(icono || 'valvulas');
            
            const marker = L.marker([lat, lng], { icon: iconoPersonalizado });
            
            this.aplicarInteraccionesValvula(marker, {
                descripcion,
                diametro,
                colonia,
                lat,
                lng,
                idValvula
            });
            
            const nombreKey = `valvula_${idValvula}`;
            this.puntos.set(nombreKey, marker);
        }
    }
    
    aplicarInteraccionesValvula(layer, valvulaData) {
        const { descripcion, diametro, colonia, lat, lng, idValvula } = valvulaData;
        
        // Determinar icono según diámetro
        const getDiametroIcono = () => {
            if (!diametro) return '🔧';
            const diam = parseInt(diametro);
            if (isNaN(diam)) return '🔧';
            if (diam >= 8) return '🔴';
            if (diam >= 4) return '🟠';
            return '🟡';
        };
        
        const diametroIcono = getDiametroIcono();
        
        // Contenido simple para hover
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>🔧 Válvula ${this.escapeHtml(idValvula || '')}</b><br>
                ${diametro ? `<span>📏 Diámetro: ${this.escapeHtml(diametro)}</span><br>` : ''}
                <small>${this.escapeHtml(descripcion?.substring(0, 40) || "Válvula de distribución")}</small>
            </div>
        `;
        
        // Contenido completo para click
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 280px; max-width: 350px;">
                <b>🔧 Válvula ${this.escapeHtml(idValvula || '')}</b><br><br>
                
                <div style="background: rgba(230, 126, 34, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📋 Información de la válvula:</strong><br>
                    ${diametro ? `<span>📏 Diámetro: <b>${this.escapeHtml(diametro)}</b></span><br>` : ''}
                    <span>${diametroIcono} Tipo: Válvula de distribución</span>
                </div>
                
                <div style="background: rgba(230, 126, 34, 0.1); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>📝 Descripción:</strong><br>
                    ${this.escapeHtml(descripcion || "Sin descripción disponible")}
                </div>
                
                ${colonia ? `
                <div style="background: rgba(230, 126, 34, 0.1); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>📍 Colonia:</strong><br>
                    ${this.escapeHtml(colonia)}
                </div>
                ` : ''}
                
                <div style="background: rgba(230, 126, 34, 0.1); padding: 10px; border-radius: 8px;">
                    <strong>💧 Función:</strong><br>
                    <small>• Control de flujo de agua</small><br>
                    <small>• Seccionamiento de red</small><br>
                    <small>• Mantenimiento hidráulico</small>
                </div>
                
                ${lat && lng ? `
                <button class="btn-direcciones" onclick="window.abrirGoogleMaps(${lat}, ${lng})" style="margin-top: 10px; width: 100%;">
                    🚗 Cómo llegar
                </button>
                ` : ''}
            </div>
        `;
        
        let popupFijado = false;
        
        layer.bindPopup(contenidoSimple);
        
        layer.on("mouseover", function() {
            if (!popupFijado) this.openPopup();
        });
        
        layer.on("mouseout", function() {
            if (!popupFijado) this.closePopup();
        });
        
        layer.on("click", () => {
            popupFijado = true;
            layer.setPopupContent(contenidoCompleto);
            layer.openPopup();
        });
        
        layer.on("popupclose", () => {
            popupFijado = false;
            layer.setPopupContent(contenidoSimple);
        });
    }
    
    async obtenerHTML() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_valvulas_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.valvulas.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay válvulas registradas con coordenadas</div></div>`;
            }
            
            let valvulasHTML = '';
            
            for (const valvula of data.valvulas) {
                const getDiametroIcono = () => {
                    if (!valvula.diametro) return '🔧';
                    const diam = parseInt(valvula.diametro);
                    if (isNaN(diam)) return '🔧';
                    if (diam >= 8) return '🔴';
                    if (diam >= 4) return '🟠';
                    return '🟡';
                };
                
                const diametroIcono = getDiametroIcono();
                
                valvulasHTML += `
                    <div class="menu-item" data-nombre="valvula_${valvula.id}">
                        <span class="item-nombre" data-nombre="valvula_${valvula.id}" title="${this.escapeHtml(valvula.descripcion || '')}">
                            ${diametroIcono} Válvula ${this.escapeHtml(valvula.id || '')}
                            ${valvula.diametro ? `<small style="color: #e67e22;"> (${valvula.diametro})</small>` : ''}
                            ${valvula.colonia ? `<small style="color: #888;"> - ${this.escapeHtml(valvula.colonia)}</small>` : ''}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="valvula_${valvula.id}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            }
            
            // Contar por diámetro
            const diametros = {};
            data.valvulas.forEach(v => {
                if (v.diametro) {
                    const diam = v.diametro;
                    diametros[diam] = (diametros[diam] || 0) + 1;
                }
            });
            
            let resumenHTML = '';
            if (Object.keys(diametros).length > 0) {
                resumenHTML = `
                    <div style="padding: 6px 12px; border-bottom: 1px solid rgba(230,126,34,0.2); text-align: center;">
                        <small style="color: #e67e22;">
                            📊 ${Object.entries(diametros).map(([diam, count]) => `${diam}: ${count}`).join(' | ')}
                        </small>
                    </div>
                `;
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>🔧 Todas las válvulas</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                ${resumenHTML}
                <div id="valvulasLista-${this.categoriaId}" style="max-height: 400px; overflow-y: auto;">
                    ${valvulasHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de válvulas:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando válvulas</div></div>`;
        }
    }
}