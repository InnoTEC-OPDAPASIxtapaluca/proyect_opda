/**
 * zonas_inundacion.js - Módulo de Zonas de Inundación
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class ZonasInundacionModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        const config = {
            phpBasePath: '../../php/mapa_general/zonas_inundacion/',
            
            // Colores específicos para zonas de inundación (morado/lavanda con transparencia)
            lineaColor: '#b43ce7',
            lineaWeight: 2,
            lineaOpacity: 0.8,
            poligonoColor: '#b43ce7',
            poligonoWeight: 2,
            poligonoFillColor: '#b43ce7',
            poligonoFillOpacity: 0.35,
            
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -28],
            
            zoomLevel: 15,
            tieneSwitchesIndividuales: true
        };
        
        super(map, categoriaId, config);
    }
    
    async cargarDatos() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_datos_zonas_inundacion.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error cargando zonas de inundación:", data.error);
                return;
            }
            
            console.log(`✅ Zonas de Inundación: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.poligonos.length} zonas de inundación cargadas`);
            
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Zonas de Inundación:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, problematica } = item;
        
        if (tipo === 'POLYGON' && coordenadas && coordenadas.length > 0) {
            this.crearPoligonoInundacion(coordenadas, {
                nombre,
                problematica
            });
        }
    }
    
    crearPoligonoInundacion(coordenadas, datos) {
        const { nombre, problematica } = datos;
        
        // Determinar nivel de riesgo basado en la problemática
        const getNivelRiesgo = () => {
            const prob = (problematica || '').toLowerCase();
            if (prob.includes('tirante alto') || prob.includes('mas de 60')) return 'ALTO';
            if (prob.includes('susceptible') || prob.includes('inundacion')) return 'MEDIO';
            if (prob.includes('requiere') || prob.includes('necesario')) return 'BAJO';
            return 'MEDIO';
        };
        
        const nivelRiesgo = getNivelRiesgo();
        
        // Colores según nivel de riesgo (variaciones del morado)
        const getColorByRiesgo = () => {
            switch(nivelRiesgo) {
                case 'ALTO': return '#9b2d9e';
                case 'MEDIO': return '#b43ce7';
                case 'BAJO': return '#c96eef';
                default: return '#b43ce7';
            }
        };
        
        const fillColorByRiesgo = () => {
            switch(nivelRiesgo) {
                case 'ALTO': return '#9b2d9e';
                case 'MEDIO': return '#b43ce7';
                case 'BAJO': return '#c96eef';
                default: return '#b43ce7';
            }
        };
        
        const polygon = L.polygon(coordenadas, {
            color: getColorByRiesgo(),
            weight: this.config.poligonoWeight,
            fillColor: fillColorByRiesgo(),
            fillOpacity: this.config.poligonoFillOpacity,
            smoothFactor: 1
        });
        
        this.aplicarInteraccionesInundacion(polygon, {
            nombre,
            problematica,
            nivelRiesgo
        });
        
        this.poligonos.push(polygon);
    }
    
    aplicarInteraccionesInundacion(layer, zonaData) {
        const { nombre, problematica, nivelRiesgo } = zonaData;
        
        const getRiesgoIcono = () => {
            switch(nivelRiesgo) {
                case 'ALTO': return '🔴';
                case 'MEDIO': return '🟠';
                case 'BAJO': return '🟡';
                default: return '⚠️';
            }
        };
        
        const getRiesgoTexto = () => {
            switch(nivelRiesgo) {
                case 'ALTO': return 'ALTO';
                case 'MEDIO': return 'MEDIO';
                case 'BAJO': return 'BAJO';
                default: return 'NO DEFINIDO';
            }
        };
        
        const riesgoIcono = getRiesgoIcono();
        const riesgoTexto = getRiesgoTexto();
        
        // Resumen corto de la problemática
        const resumenProblematica = () => {
            if (!problematica) return 'Sin descripción disponible';
            if (problematica.length > 150) {
                return problematica.substring(0, 150) + '...';
            }
            return problematica;
        };
        
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>${riesgoIcono} ${this.escapeHtml(nombre || "Zona de inundación")}</b><br>
                <span style="color: ${nivelRiesgo === 'ALTO' ? '#9b2d9e' : (nivelRiesgo === 'MEDIO' ? '#b43ce7' : '#c96eef')}">
                    Nivel de riesgo: ${riesgoTexto}
                </span>
            </div>
        `;
        
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 320px; max-width: 450px; max-height: 500px; overflow-y: auto;">
                <b>${riesgoIcono} ${this.escapeHtml(nombre || "Zona de inundación")}</b><br><br>
                
                <div style="background: rgba(180, 60, 231, 0.15); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>⚠️ Nivel de riesgo:</strong><br>
                    <span style="color: ${nivelRiesgo === 'ALTO' ? '#9b2d9e' : (nivelRiesgo === 'MEDIO' ? '#b43ce7' : '#c96eef')}; font-weight: bold;">
                        ${riesgoTexto}
                    </span>
                </div>
                
                <div style="background: rgba(180, 60, 231, 0.15); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>📝 Descripción / Problemática:</strong><br>
                    <small>${this.escapeHtml(problematica || "Sin descripción disponible")}</small>
                </div>
                
                <div style="background: rgba(180, 60, 231, 0.15); padding: 10px; border-radius: 8px;">
                    <strong>💡 Recomendaciones:</strong><br>
                    <small>• Mantenerse informado sobre alertas meteorológicas</small><br>
                    <small>• Evitar circular por esta zona durante lluvias intensas</small><br>
                    <small>• Tener rutas de evacuación alternas</small>
                </div>
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
            const response = await fetch(`${this.phpBasePath}obtener_zonas_inundacion_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.zonas.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay zonas de inundación registradas</div></div>`;
            }
            
            let zonasHTML = '';
            
            // Clasificar por nivel de riesgo (simplificado)
            const altoRiesgo = [];
            const medioRiesgo = [];
            const bajoRiesgo = [];
            
            data.zonas.forEach(zona => {
                const prob = (zona.problematica || '').toLowerCase();
                if (prob.includes('tirante alto') || prob.includes('mas de 60')) {
                    altoRiesgo.push(zona);
                } else if (prob.includes('susceptible') || prob.includes('inundacion')) {
                    medioRiesgo.push(zona);
                } else {
                    bajoRiesgo.push(zona);
                }
            });
            
            const generarItemZona = (zona) => {
                return `
                    <div class="menu-item" data-nombre="${this.escapeHtml(zona.nombre)}">
                        <span class="item-nombre" data-nombre="${this.escapeHtml(zona.nombre)}" title="${this.escapeHtml(zona.problematica?.substring(0, 100) || '')}">
                            ⚠️ ${this.escapeHtml(zona.nombre)}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="${this.escapeHtml(zona.nombre)}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            };
            
            if (altoRiesgo.length > 0) {
                zonasHTML += `
                    <div style="padding: 8px 12px; margin-top: 8px; background: rgba(155, 45, 158, 0.15); border-radius: 5px;">
                        <small style="color: #9b2d9e;">🔴 RIESGO ALTO (${altoRiesgo.length})</small>
                    </div>
                `;
                altoRiesgo.forEach(zona => {
                    zonasHTML += generarItemZona(zona);
                });
            }
            
            if (medioRiesgo.length > 0) {
                zonasHTML += `
                    <div style="padding: 8px 12px; margin-top: 4px; background: rgba(180, 60, 231, 0.15); border-radius: 5px;">
                        <small style="color: #b43ce7;">🟠 RIESGO MEDIO (${medioRiesgo.length})</small>
                    </div>
                `;
                medioRiesgo.forEach(zona => {
                    zonasHTML += generarItemZona(zona);
                });
            }
            
            if (bajoRiesgo.length > 0) {
                zonasHTML += `
                    <div style="padding: 8px 12px; margin-top: 4px; background: rgba(201, 110, 239, 0.15); border-radius: 5px;">
                        <small style="color: #c96eef;">🟡 RIESGO BAJO (${bajoRiesgo.length})</small>
                    </div>
                `;
                bajoRiesgo.forEach(zona => {
                    zonasHTML += generarItemZona(zona);
                });
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>⚠️ Todas las zonas de inundación</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>🗺️ Polígonos de riesgo</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleLinea-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div style="padding: 8px 12px; border-bottom: 1px solid rgba(180,60,231,0.2); text-align: center;">
                    <small style="color: #b43ce7;">📊 Total de zonas: ${data.zonas.length}</small>
                </div>
                <div id="zonasInundacionLista-${this.categoriaId}" style="max-height: 400px; overflow-y: auto;">
                    ${zonasHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de zonas de inundación:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando zonas de inundación</div></div>`;
        }
    }
}