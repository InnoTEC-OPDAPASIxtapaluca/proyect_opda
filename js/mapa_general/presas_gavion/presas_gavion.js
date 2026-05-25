/**
 * presas_gavion.js - Módulo de Presas de Gavión
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class PresasGavionModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        const config = {
            phpBasePath: '../../php/mapa_general/presas_gavion/',
            
            // Colores específicos para presas de gavión (marrón/terracota)
            lineaColor: '#8B6914',
            lineaWeight: 4,
            lineaOpacity: 0.85,
            poligonoColor: '#8B6914',
            poligonoWeight: 2,
            poligonoFillColor: '#8B6914',
            poligonoFillOpacity: 0.15,
            
            // Configuración de iconos
            iconSize: [35, 35],
            iconAnchor: [17, 35],
            popupAnchor: [0, -30],
            
            zoomLevel: 17,
            tieneSwitchesIndividuales: true
        };
        
        super(map, categoriaId, config);
    }
    
    async cargarDatos() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_datos_presas_gavion.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error cargando presas de gavión:", data.error);
                return;
            }
            
            console.log(`✅ Presas de Gavión: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.puntos.size} presas de gavión cargadas`);
            
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Presas de Gavión:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, descripcion, icono, idPresa } = item;
        
        if (tipo === 'POINT' && coordenadas && coordenadas.length >= 2) {
            const [lat, lng] = coordenadas;
            
            // Validar coordenadas
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                console.warn(`Coordenadas inválidas para presa: ${nombre}`, lat, lng);
                return;
            }
            
            const iconoPersonalizado = await this.obtenerIcono(icono || 'presas_gavion');
            
            const marker = L.marker([lat, lng], { icon: iconoPersonalizado });
            
            this.aplicarInteraccionesPresa(marker, {
                nombre,
                descripcion,
                lat,
                lng,
                idPresa
            });
            
            const nombreKey = nombre || `presa_${idPresa}`;
            this.puntos.set(nombreKey, marker);
        }
    }
    
    aplicarInteraccionesPresa(layer, presaData) {
        const { nombre, descripcion, lat, lng, idPresa } = presaData;
        
        // Determinar tipo de información por la descripción
        const getInfoAdicional = () => {
            const desc = (descripcion || '').toLowerCase();
            if (desc.includes('calle') || desc.includes('av')) {
                return '📍 Ubicación urbana';
            }
            if (desc.includes('barranca')) {
                return '🏞️ Barranca';
            }
            return '🏗️ Infraestructura hidráulica';
        };
        
        // Contenido simple para hover
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>🏗️ ${this.escapeHtml(nombre || "Presa de Gavión")}</b><br>
                <small>${this.escapeHtml(descripcion?.substring(0, 60) || "Presa de gavión")}</small>
            </div>
        `;
        
        // Contenido completo para click
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 280px; max-width: 350px;">
                <b>🏗️ ${this.escapeHtml(nombre || "Presa de Gavión sin nombre")}</b><br>
                ${idPresa ? `<small style="color: #888;">ID: ${this.escapeHtml(idPresa)}</small><br><br>` : '<br>'}
                
                <div style="background: rgba(139, 105, 20, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📋 Información de la presa:</strong><br>
                    <span>🏷️ Tipo: Presa de Gavión</span><br>
                    <span>${getInfoAdicional()}</span>
                </div>
                
                <div style="background: rgba(139, 105, 20, 0.1); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>📝 Ubicación/Descripción:</strong><br>
                    ${this.escapeHtml(descripcion || "Sin descripción disponible")}
                </div>
                
                <div style="background: rgba(139, 105, 20, 0.1); padding: 10px; border-radius: 8px;">
                    <strong>💧 Función:</strong><br>
                    <small>• Control de avenidas e inundaciones</small><br>
                    <small>• Retención de sedimentos</small><br>
                    <small>• Estabilización de cauces</small><br>
                    <small>• Protección de zonas vulnerables</small>
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
            const response = await fetch(`${this.phpBasePath}obtener_presas_gavion_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.presas.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay presas de gavión registradas con coordenadas</div></div>`;
            }
            
            let presasHTML = '';
            
            for (const presa of data.presas) {
                // Extraer información resumida de la descripción
                const getResumenDescripcion = () => {
                    const desc = presa.descripcion || '';
                    if (desc.length > 50) {
                        return desc.substring(0, 50) + '...';
                    }
                    return desc;
                };
                
                presasHTML += `
                    <div class="menu-item" data-nombre="${this.escapeHtml(presa.nombre)}">
                        <span class="item-nombre" data-nombre="${this.escapeHtml(presa.nombre)}" title="${this.escapeHtml(presa.descripcion || '')}">
                            🏗️ ${this.escapeHtml(presa.nombre)}
                            ${presa.descripcion ? `<small style="color: #8B6914;"> - ${this.escapeHtml(getResumenDescripcion())}</small>` : ''}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="${this.escapeHtml(presa.nombre)}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>🏗️ Todas las presas de gavión</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div id="presasLista-${this.categoriaId}" style="max-height: 400px; overflow-y: auto;">
                    ${presasHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de presas de gavión:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando presas de gavión</div></div>`;
        }
    }
}