/**
 * carcamos.js - Módulo de Cárcamos de Agua
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class CarcamosModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        // Configuración específica de Cárcamos
        const config = {
            phpBasePath: '../../php/mapa_general/carcamos/',
            
            // Colores específicos para cárcamos (azul agua)
            lineaColor: '#2980b9',        // Azul para líneas si tuvieran
            lineaWeight: 4,
            lineaOpacity: 0.8,
            poligonoColor: '#3498db',
            poligonoWeight: 2,
            poligonoFillColor: '#3498db',
            poligonoFillOpacity: 0.15,
            
            // Configuración de iconos
            iconSize: [35, 35],
            iconAnchor: [17, 35],
            popupAnchor: [0, -30],
            
            // Zoom al hacer clic
            zoomLevel: 17,
            
            // Tiene switches individuales por cárcamo
            tieneSwitchesIndividuales: true
        };
        
        super(map, categoriaId, config);
    }
    
    /**
     * Cargar datos desde el PHP
     */
    async cargarDatos() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_datos_carcamos.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error:", data.error);
                return;
            }
            
            console.log(`✅ Cárcamos: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.puntos.size} cárcamos cargados`);
            
            // Todo comienza DESACTIVADO
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Cárcamos:", error);
        }
    }
    
    /**
     * Sobrescribir procesarElemento para manejar datos específicos de cárcamos
     */
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, icono, idCarcamo, qTotal, noEquipos, 
                operando, volumenDesalojo, equiposElectromecanicos, equiposDanados,
                noDescargas, estatusPago, tipoCause, cuerpoDescarga } = item;
        
        if (tipo === 'POINT') {
            const [lat, lng] = coordenadas;
            const iconoPersonalizado = await this.obtenerIcono(icono || 'carcamo');
            
            const marker = L.marker([lat, lng], { icon: iconoPersonalizado });
            
            // Aplicar interacciones con información ENRIQUECIDA de cárcamos
            this.aplicarInteraccionesCarcamo(marker, {
                nombre,
                lat,
                lng,
                idCarcamo,
                qTotal,
                noEquipos,
                operando,
                volumenDesalojo,
                equiposElectromecanicos,
                equiposDanados,
                noDescargas,
                estatusPago,
                tipoCause,
                cuerpoDescarga
            });
            
            this.puntos.set(nombre, marker);
        }
    }
    
    /**
     * Interacciones específicas para cárcamos con información adicional
     */
    aplicarInteraccionesCarcamo(layer, carcamoData) {
        const { nombre, lat, lng, idCarcamo, qTotal, noEquipos, operando, 
                volumenDesalojo, equiposElectromecanicos, equiposDanados,
                noDescargas, estatusPago, tipoCause, cuerpoDescarga } = carcamoData;
        
        // Calcular porcentaje de operación
        const calcularPorcentajeOperacion = () => {
            if (!noEquipos || noEquipos === 0) return null;
            const operandoNum = parseInt(operando) || 0;
            const totalNum = parseInt(noEquipos) || 0;
            return Math.round((operandoNum / totalNum) * 100);
        };
        
        const porcentajeOp = calcularPorcentajeOperacion();
        
        // Determinar color de estatus de pago
        const getEstatusPagoColor = () => {
            if (estatusPago === 'AL DÍA') return '#2ecc71';
            if (estatusPago === 'ADEUDO') return '#e74c3c';
            return '#f39c12';
        };
        
        // Determinar icono de operación
        const getOperacionIcono = () => {
            if (porcentajeOp === null) return '❓';
            if (porcentajeOp >= 75) return '🟢';
            if (porcentajeOp >= 40) return '🟡';
            return '🔴';
        };
        
        // Contenido simple para hover
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>💧 ${this.escapeHtml(nombre || "Sin nombre")}</b><br>
                ${qTotal ? `📊 Caudal: ${qTotal} l/s` : ''}
                ${operando ? `<br>${getOperacionIcono()} Operando: ${operando}/${noEquipos} equipos` : ''}
                <br>📍 ID: ${this.escapeHtml(idCarcamo || 'N/A')}
            </div>
        `;
        
        // Contenido completo para click (con todos los detalles)
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 300px; max-width: 350px;">
                <b>💧 ${this.escapeHtml(nombre || "Sin nombre")}</b><br>
                <small style="color: #888;">ID: ${this.escapeHtml(idCarcamo || 'N/A')}</small><br><br>
                
                <!-- Información de caudal y operación -->
                <div style="background: rgba(52, 152, 219, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📊 Datos de operación:</strong><br>
                    ${qTotal ? `<span>💧 Caudal total: <b>${qTotal} l/s</b></span><br>` : ''}
                    ${volumenDesalojo ? `<span>📈 Volumen desalojo actual: <b>${this.escapeHtml(volumenDesalojo)}</b></span><br>` : ''}
                    ${noEquipos ? `<span>⚙️ Equipos de bombeo: <b>${operando || 0}/${noEquipos}</b> operando</span>` : ''}
                    ${porcentajeOp !== null ? `
                        <div style="margin-top: 5px;">
                            <div style="background: rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden;">
                                <div style="background: ${porcentajeOp >= 75 ? '#2ecc71' : (porcentajeOp >= 40 ? '#f39c12' : '#e74c3c')}; 
                                            width: ${porcentajeOp}%; height: 6px;"></div>
                            </div>
                            <small>${porcentajeOp}% operativo</small>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Equipos electromecánicos -->
                ${equiposElectromecanicos ? `
                <div style="background: rgba(52, 152, 219, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>⚙️ Equipos electromecánicos:</strong><br>
                    <small>${this.escapeHtml(equiposElectromecanicos.substring(0, 150))}${equiposElectromecanicos.length > 150 ? '...' : ''}</small>
                </div>
                ` : ''}
                
                <!-- Equipos dañados -->
                ${equiposDanados ? `
                <div style="background: rgba(231, 76, 60, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>⚠️ Equipos dañados:</strong><br>
                    <small style="color: #e74c3c;">${this.escapeHtml(equiposDanados)}</small>
                </div>
                ` : ''}
                
                <!-- Descargas -->
                <div style="background: rgba(52, 152, 219, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>🌊 Sistema de descarga:</strong><br>
                    ${noDescargas ? `<span>📋 No. descargas: ${this.escapeHtml(noDescargas)}</span><br>` : ''}
                    ${tipoCause ? `<span>🏞️ Tipo de cause: ${this.escapeHtml(tipoCause)}</span><br>` : ''}
                    ${cuerpoDescarga ? `<span>💧 Cuerpo de descarga: ${this.escapeHtml(cuerpoDescarga)}</span>` : ''}
                </div>
                
                <!-- Estatus de pago -->
                ${estatusPago ? `
                <div style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>💰 Estatus de pago:</strong><br>
                    <span style="color: ${getEstatusPagoColor()};">● ${this.escapeHtml(estatusPago)}</span>
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
            const response = await fetch(`${this.phpBasePath}obtener_carcamos_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.carcamos.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay cárcamos registrados</div></div>`;
            }
            
            // Calcular estado de operación para cada cárcamo
            const getEstadoOperacion = (carcamo) => {
                if (!carcamo.noEquipos || carcamo.noEquipos === 0) return 'desconocido';
                const porcentaje = (carcamo.operando / carcamo.noEquipos) * 100;
                if (porcentaje >= 75) return 'optimo';
                if (porcentaje >= 40) return 'regular';
                return 'critico';
            };
            
            const getIconoEstado = (estado) => {
                switch(estado) {
                    case 'optimo': return '🟢';
                    case 'regular': return '🟡';
                    case 'critico': return '🔴';
                    default: return '⚪';
                }
            };
            
            let carcamosHTML = '';
            
            // Separar cárcamos por estado de operación
            const optimos = data.carcamos.filter(c => getEstadoOperacion(c) === 'optimo');
            const regulares = data.carcamos.filter(c => getEstadoOperacion(c) === 'regular');
            const criticos = data.carcamos.filter(c => getEstadoOperacion(c) === 'critico');
            const sinDatos = data.carcamos.filter(c => getEstadoOperacion(c) === 'desconocido');
            
            // Función para generar HTML de un cárcamo
            const generarItemCarcamo = (carcamo) => {
                const estado = getEstadoOperacion(carcamo);
                const icono = getIconoEstado(estado);
                const porcentaje = carcamo.noEquipos ? Math.round((carcamo.operando / carcamo.noEquipos) * 100) : null;
                
                return `
                    <div class="menu-item" data-nombre="${this.escapeHtml(carcamo.nombre)}">
                        <span class="item-nombre" data-nombre="${this.escapeHtml(carcamo.nombre)}">
                            ${icono} ${this.escapeHtml(carcamo.nombre)}
                            ${porcentaje ? `<small style="color: #bb9358;"> (${porcentaje}% op.)</small>` : ''}
                            ${carcamo.qTotal ? `<small> | ${carcamo.qTotal} l/s</small>` : ''}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="${this.escapeHtml(carcamo.nombre)}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            };
            
            // Sección óptimos
            if (optimos.length > 0) {
                carcamosHTML += `
                    <div style="padding: 8px 12px; margin-top: 8px;">
                        <small style="color: #2ecc71;">🟢 ÓPTIMOS (${optimos.length})</small>
                    </div>
                `;
                optimos.forEach(carcamo => {
                    carcamosHTML += generarItemCarcamo(carcamo);
                });
            }
            
            // Sección regulares
            if (regulares.length > 0) {
                carcamosHTML += `
                    <div style="padding: 8px 12px; margin-top: 4px;">
                        <small style="color: #f39c12;">🟡 REGULARES (${regulares.length})</small>
                    </div>
                `;
                regulares.forEach(carcamo => {
                    carcamosHTML += generarItemCarcamo(carcamo);
                });
            }
            
            // Sección críticos
            if (criticos.length > 0) {
                carcamosHTML += `
                    <div style="padding: 8px 12px; margin-top: 4px;">
                        <small style="color: #e74c3c;">🔴 CRÍTICOS (${criticos.length})</small>
                    </div>
                `;
                criticos.forEach(carcamo => {
                    carcamosHTML += generarItemCarcamo(carcamo);
                });
            }
            
            // Sección sin datos
            if (sinDatos.length > 0) {
                carcamosHTML += `
                    <div style="padding: 8px 12px; margin-top: 4px;">
                        <small style="color: #888;">⚪ SIN DATOS (${sinDatos.length})</small>
                    </div>
                `;
                sinDatos.forEach(carcamo => {
                    carcamosHTML += generarItemCarcamo(carcamo);
                });
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>💧 Todos los cárcamos</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div id="carcamosLista-${this.categoriaId}">
                    ${carcamosHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de cárcamos:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando cárcamos</div></div>`;
        }
    }
}