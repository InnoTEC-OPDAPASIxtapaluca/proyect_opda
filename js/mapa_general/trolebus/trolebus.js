/**
 * trolebus.js - Módulo de Trolebús
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class TrolebusModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        // Configuración específica del Trolebús
        const config = {
            phpBasePath: '../../php/mapa_general/trolebus/',
            
            // Colores específicos
            lineaColor: '#3498db',        // AZUL
            lineaWeight: 5,
            lineaOpacity: 0.9,
            poligonoColor: '#3498db',
            poligonoWeight: 2,
            poligonoFillColor: '#3498db',
            poligonoFillOpacity: 0.15,
            
            // Configuración de iconos
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -28],
            
            // Zoom al hacer clic
            zoomLevel: 16,
            
            // Tiene switches individuales por estación
            tieneSwitchesIndividuales: true
        };
        
        super(map, categoriaId, config);
    }
    
    /**
     * Cargar datos desde el PHP
     */
    async cargarDatos() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_datos_trolebus.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error:", data.error);
                return;
            }
            
            console.log(`✅ Trolebús: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.puntos.size} puntos, ${this.lineas.length} líneas, ${this.poligonos.length} polígonos`);
            
            // Todo comienza DESACTIVADO
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Trolebús:", error);
        }
    }
    
    /**
     * Obtener HTML para el menú lateral
     */
    async obtenerHTML() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_estaciones.php`);
            const data = await response.json();
            
            if (!data.success || data.estaciones.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay estaciones</div></div>`;
            }
            
            let estacionesHTML = '';
            
            for (const estacion of data.estaciones) {
                estacionesHTML += `
                    <div class="menu-item">
                        <span class="item-nombre" data-nombre="${this.escapeHtml(estacion.nombre)}">${this.escapeHtml(estacion.nombre)}</span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="${this.escapeHtml(estacion.nombre)}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>Todas las estaciones</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>Línea completa</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleLinea-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div id="estacionesLista-${this.categoriaId}">
                    ${estacionesHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo estaciones:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando estaciones</div></div>`;
        }
    }
}