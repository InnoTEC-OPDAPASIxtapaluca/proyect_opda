/**
 * plantas.js - Módulo de Plantas de Tratamiento
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class PlantasModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        // Configuración específica de Plantas
        const config = {
            phpBasePath: '../../php/mapa_general/plantas/',
            
            // Colores específicos para plantas (verde agua/azul verdoso)
            lineaColor: '#2ecc71',        // Verde para líneas si tuvieran
            lineaWeight: 4,
            lineaOpacity: 0.8,
            poligonoColor: '#27ae60',
            poligonoWeight: 2,
            poligonoFillColor: '#2ecc71',
            poligonoFillOpacity: 0.15,
            
            // Configuración de iconos
            iconSize: [35, 35],
            iconAnchor: [17, 35],
            popupAnchor: [0, -30],
            
            // Zoom al hacer clic
            zoomLevel: 17,
            
            // Tiene switches individuales por planta
            tieneSwitchesIndividuales: true
        };
        
        super(map, categoriaId, config);
    }
    
    /**
     * Cargar datos desde el PHP
     */
    async cargarDatos() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_datos_plantas.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error:", data.error);
                return;
            }
            
            console.log(`✅ Plantas: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.puntos.size} plantas cargadas`);
            
            // Todo comienza DESACTIVADO
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Plantas:", error);
        }
    }
    
    /**
     * Sobrescribir procesarElemento para manejar datos específicos de plantas
     * (como capacidad, estatus, etc. en el popup)
     */
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, descripcion, icono, capacidad, capacidadActual, estatus, estado, equipos, idPlanta } = item;
        
        if (tipo === 'POINT') {
            const [lat, lng] = coordenadas;
            const iconoPersonalizado = await this.obtenerIcono(icono || 'planta');
            
            const marker = L.marker([lat, lng], { icon: iconoPersonalizado });
            
            // Aplicar interacciones con información ENRIQUECIDA de plantas
            this.aplicarInteraccionesPlanta(marker, {
                nombre,
                descripcion,
                lat,
                lng,
                capacidad,
                capacidadActual,
                estatus,
                estado,
                equipos,
                idPlanta
            });
            
            this.puntos.set(nombre, marker);
        }
        // Nota: Las plantas solo tienen puntos, no líneas ni polígonos por ahora
    }
    
    /**
     * Interacciones específicas para plantas con información adicional
     */
    aplicarInteraccionesPlanta(layer, plantaData) {
        const { nombre, descripcion, lat, lng, capacidad, capacidadActual, estatus, estado, equipos, idPlanta } = plantaData;
        
        // Determinar color de estatus para el popup
        const getEstatusColor = () => {
            if (estatus === 'ACTIVO') return '#2ecc71';
            if (estatus === 'INACTIVO') return '#e74c3c';
            return '#f39c12';
        };
        
        // Contenido simple para hover
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>🏭 ${this.escapeHtml(nombre || "Sin nombre")}</b><br>
                <span style="color: ${getEstatusColor()}">● ${this.escapeHtml(estatus || "N/A")}</span>
                ${capacidad ? `<br>📊 Capacidad: ${capacidad} l/s` : ''}
                ${capacidadActual ? `<br>⚡ Actual: ${capacidadActual} l/s` : ''}
                <br>📍 ${this.escapeHtml(descripcion || "Planta de tratamiento")}
            </div>
        `;
        
        // Contenido completo para click (con todos los detalles)
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 260px;">
                <b>🏭 ${this.escapeHtml(nombre || "Sin nombre")}</b><br>
                <small style="color: #888;">ID: ${this.escapeHtml(idPlanta || 'N/A')}</small><br><br>
                
                <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <span style="color: ${getEstatusColor()};">● Estatus: ${this.escapeHtml(estatus || "N/A")}</span><br>
                        <span>🏁 Estado: ${this.escapeHtml(estado || "N/A")}</span>
                    </div>
                    <div style="flex: 1;">
                        ${capacidad ? `<span>💧 Capacidad: <b>${capacidad} l/s</b></span><br>` : ''}
                        ${capacidadActual ? `<span>⚡ Actual: <b>${capacidadActual} l/s</b></span>` : ''}
                    </div>
                </div>
                
                <div style="background: rgba(187, 147, 88, 0.1); padding: 8px; border-radius: 8px; margin: 8px 0;">
                    <strong>📋 Descripción:</strong><br>
                    ${this.escapeHtml(descripcion || "Sin descripción")}
                </div>
                
                ${equipos ? `
                <div style="background: rgba(187, 147, 88, 0.1); padding: 8px; border-radius: 8px; margin: 8px 0;">
                    <strong>⚙️ Equipos electromecánicos:</strong><br>
                    <small>${this.escapeHtml(equipos)}</small>
                </div>
                ` : ''}
                
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
    
    /**
     * Obtener HTML para el menú lateral
     */
    async obtenerHTML() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_plantas_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.plantas.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay plantas registradas</div></div>`;
            }
            
            // Separar plantas por estatus
            const plantasActivas = data.plantas.filter(p => p.estatus === 'ACTIVO');
            const plantasInactivas = data.plantas.filter(p => p.estatus === 'INACTIVO');
            
            let plantasHTML = '';
            
            // Función para generar HTML de una planta
            const generarItemPlanta = (planta) => {
                const estatusClass = planta.estatus === 'ACTIVO' ? 'estatus-activo' : 'estatus-inactivo';
                const estatusIcono = planta.estatus === 'ACTIVO' ? '✅' : '❌';
                
                return `
                    <div class="menu-item" data-nombre="${this.escapeHtml(planta.nombre)}">
                        <span class="item-nombre" data-nombre="${this.escapeHtml(planta.nombre)}">
                            ${estatusIcono} ${this.escapeHtml(planta.nombre)}
                            ${planta.capacidad ? `<small style="color: #bb9358;"> (${planta.capacidad} l/s)</small>` : ''}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="${this.escapeHtml(planta.nombre)}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            };
            
            // Agregar sección de plantas activas
            if (plantasActivas.length > 0) {
                plantasHTML += `
                    <div style="padding: 8px 12px; margin-top: 8px;">
                        <small style="color: #2ecc71;">🟢 ACTIVAS (${plantasActivas.length})</small>
                    </div>
                `;
                plantasActivas.forEach(planta => {
                    plantasHTML += generarItemPlanta(planta);
                });
            }
            
            // Agregar sección de plantas inactivas
            if (plantasInactivas.length > 0) {
                plantasHTML += `
                    <div style="padding: 8px 12px; margin-top: 4px;">
                        <small style="color: #e74c3c;">🔴 INACTIVAS (${plantasInactivas.length})</small>
                    </div>
                `;
                plantasInactivas.forEach(planta => {
                    plantasHTML += generarItemPlanta(planta);
                });
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>🏭 Todas las plantas</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div id="plantasLista-${this.categoriaId}">
                    ${plantasHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de plantas:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando plantas</div></div>`;
        }
    }
}