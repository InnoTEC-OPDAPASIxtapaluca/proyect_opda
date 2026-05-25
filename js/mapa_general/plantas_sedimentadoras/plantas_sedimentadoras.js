/**
 * plantas_sedimentadoras.js - Módulo de Plantas Sedimentadoras
 * Extiende la clase base ModuloBaseMapa
 * NOTA: Esta tabla tiene su propia estructura con campos específicos
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class PlantasSedimentadorasModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        const config = {
            phpBasePath: '../../php/mapa_general/plantas_sedimentadoras/',
            
            // Colores específicos para plantas sedimentadoras (azul turquesa)
            lineaColor: '#1abc9c',
            lineaWeight: 4,
            lineaOpacity: 0.85,
            poligonoColor: '#1abc9c',
            poligonoWeight: 2,
            poligonoFillColor: '#1abc9c',
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
            const response = await fetch(`${this.phpBasePath}obtener_datos_plantas_sedimentadoras.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error cargando plantas sedimentadoras:", data.error);
                return;
            }
            
            console.log(`✅ Plantas Sedimentadoras: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.puntos.size} plantas sedimentadoras cargadas`);
            
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Plantas Sedimentadoras:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, descripcion, icono, idPlantaSed } = item;
        
        if (tipo === 'POINT') {
            const [lat, lng] = coordenadas;
            const iconoPersonalizado = await this.obtenerIcono(icono || 'plantas_sedimentadoras');
            
            const marker = L.marker([lat, lng], { icon: iconoPersonalizado });
            
            this.aplicarInteraccionesPlantaSed(marker, {
                nombre,
                descripcion,
                lat,
                lng,
                idPlantaSed
            });
            
            this.puntos.set(nombre, marker);
        }
    }
    
    aplicarInteraccionesPlantaSed(layer, plantaData) {
        const { nombre, descripcion, lat, lng, idPlantaSed } = plantaData;
        
        // Determinar estado por la descripción
        const getEstadoInfo = () => {
            const desc = (descripcion || '').toLowerCase();
            if (desc.includes('operando') || desc.includes('minimo')) {
                return { texto: '⚠️ Operando al mínimo', color: '#f39c12' };
            }
            if (desc.includes('inactivo') || desc.includes('parada')) {
                return { texto: '🔴 Inactiva', color: '#e74c3c' };
            }
            return { texto: '🟢 Activa', color: '#2ecc71' };
        };
        
        const estadoInfo = getEstadoInfo();
        
        // Contenido simple para hover
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>🏭 ${this.escapeHtml(nombre || "Planta sedimentadora")}</b><br>
                <span style="color: ${estadoInfo.color}">${estadoInfo.texto}</span><br>
                <small>${this.escapeHtml(descripcion?.substring(0, 80) || "Planta sedimentadora")}</small>
            </div>
        `;
        
        // Contenido completo para click
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 280px;">
                <b>🏭 ${this.escapeHtml(nombre || "Planta sedimentadora sin nombre")}</b><br>
                ${idPlantaSed ? `<small style="color: #888;">ID: ${this.escapeHtml(idPlantaSed)}</small><br><br>` : '<br>'}
                
                <div style="background: rgba(26, 188, 156, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📋 Estado operativo:</strong><br>
                    <span style="color: ${estadoInfo.color}; font-weight: bold;">${estadoInfo.texto}</span>
                </div>
                
                <div style="background: rgba(26, 188, 156, 0.1); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>📝 Descripción:</strong><br>
                    ${this.escapeHtml(descripcion || "Sin descripción disponible")}
                </div>
                
                <div style="background: rgba(26, 188, 156, 0.1); padding: 10px; border-radius: 8px;">
                    <strong>💧 Función:</strong><br>
                    <small>• Sedimentación de partículas sólidas</small><br>
                    <small>• Tratamiento primario de agua</small><br>
                    <small>• Remoción de arenas y sedimentos</small>
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
            const response = await fetch(`${this.phpBasePath}obtener_plantas_sedimentadoras_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.plantas.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay plantas sedimentadoras registradas</div></div>`;
            }
            
            let plantasHTML = '';
            
            for (const planta of data.plantas) {
                // Determinar icono de estado por descripción
                const getEstadoIcono = () => {
                    const desc = (planta.descripcion || '').toLowerCase();
                    if (desc.includes('operando al minimo')) return '⚠️';
                    if (desc.includes('minimo')) return '⚠️';
                    return '🏭';
                };
                
                const estadoIcono = getEstadoIcono();
                
                plantasHTML += `
                    <div class="menu-item" data-nombre="${this.escapeHtml(planta.nombre)}">
                        <span class="item-nombre" data-nombre="${this.escapeHtml(planta.nombre)}">
                            ${estadoIcono} ${this.escapeHtml(planta.nombre)}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="${this.escapeHtml(planta.nombre)}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>🏭 Todas las plantas sedimentadoras</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div id="plantasSedLista-${this.categoriaId}" style="max-height: 400px; overflow-y: auto;">
                    ${plantasHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de plantas sedimentadoras:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando plantas sedimentadoras</div></div>`;
        }
    }
}