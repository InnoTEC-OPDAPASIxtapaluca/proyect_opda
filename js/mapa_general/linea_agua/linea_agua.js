/**
 * linea_agua.js - Módulo de Líneas de Agua
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class LineaAguaModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        const config = {
            phpBasePath: '../../php/mapa_general/linea_agua/',
            
            // Colores específicos para líneas de agua (azul agua)
            lineaColor: '#3498db',
            lineaWeight: 4,
            lineaOpacity: 0.8,
            poligonoColor: '#3498db',
            poligonoWeight: 2,
            poligonoFillColor: '#3498db',
            poligonoFillOpacity: 0.15,
            
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -28],
            
            zoomLevel: 17,
            tieneSwitchesIndividuales: true
        };
        
        super(map, categoriaId, config);
    }
    
    async cargarDatos() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_datos_linea_agua.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error cargando líneas de agua:", data.error);
                return;
            }
            
            console.log(`✅ Líneas de Agua: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.lineas.length} líneas de agua cargadas`);
            
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Líneas de Agua:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, colonia, diametro, idLinea } = item;
        
        if (tipo === 'LINESTRING' && coordenadas && coordenadas.length >= 2) {
            this.crearLineaAgua(coordenadas, {
                nombre,
                colonia,
                diametro,
                idLinea
            });
        }
    }
    
    crearLineaAgua(coordenadas, datos) {
        const { nombre, colonia, diametro, idLinea } = datos;
        
        // Determinar color según diámetro
        const getColorByDiametro = () => {
            if (!diametro) return this.config.lineaColor;
            const diam = parseInt(diametro);
            if (isNaN(diam)) return this.config.lineaColor;
            if (diam >= 8) return '#2980b9';
            if (diam >= 4) return '#3498db';
            return '#5dade2';
        };
        
        const polyline = L.polyline(coordenadas, {
            color: getColorByDiametro(),
            weight: this.config.lineaWeight,
            opacity: this.config.lineaOpacity,
            smoothFactor: 1
        });
        
        this.aplicarInteraccionesAgua(polyline, {
            nombre,
            colonia,
            diametro,
            idLinea,
            longitud: this.calcularLongitud(coordenadas)
        });
        
        this.lineas.push(polyline);
    }
    
    calcularLongitud(coordenadas) {
        let total = 0;
        for (let i = 0; i < coordenadas.length - 1; i++) {
            total += this.haversineDistance(
                coordenadas[i][0], coordenadas[i][1],
                coordenadas[i + 1][0], coordenadas[i + 1][1]
            );
        }
        return total;
    }
    
    haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 1; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    aplicarInteraccionesAgua(layer, aguaData) {
        const { nombre, colonia, diametro, idLinea, longitud } = aguaData;
        
        const formatoLongitud = () => {
            if (!longitud) return null;
            if (longitud < 0.1) {
                return `${Math.round(longitud * 1000)} metros`;
            }
            return `${longitud.toFixed(2)} km`;
        };
        
        const longitudTexto = formatoLongitud();
        
        // Extraer tipo de línea del nombre
        const getTipoLinea = () => {
            const nom = (nombre || '').toLowerCase();
            if (nom.includes('conduccion')) return '🚰 Conducción';
            if (nom.includes('distribucion')) return '💧 Distribución';
            if (nom.includes('alimentacion')) return '🚿 Alimentación';
            return '💧 Línea de agua';
        };
        
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>💧 ${this.escapeHtml(nombre || "Línea de agua")}</b><br>
                ${diametro ? `<span>📏 Diámetro: ${this.escapeHtml(diametro)}</span><br>` : ''}
                ${longitudTexto ? `<span>📐 Longitud: ${longitudTexto}</span>` : ''}
            </div>
        `;
        
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 280px; max-width: 350px;">
                <b>💧 Línea de agua</b><br>
                ${idLinea ? `<small style="color: #888;">ID: ${this.escapeHtml(idLinea)}</small><br><br>` : '<br>'}
                
                <div style="background: rgba(52, 152, 219, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📋 Información de la línea:</strong><br>
                    <span>${getTipoLinea()}</span><br>
                    ${nombre ? `<span>📝 Nombre: ${this.escapeHtml(nombre)}</span><br>` : ''}
                    ${colonia ? `<span>🏘️ Colonia: ${this.escapeHtml(colonia)}</span><br>` : ''}
                    ${diametro ? `<span>📏 Diámetro: <b>${this.escapeHtml(diametro)}</b></span><br>` : ''}
                    ${longitudTexto ? `<span>📐 Longitud: <b>${longitudTexto}</b></span>` : ''}
                </div>
                
                <div style="background: rgba(52, 152, 219, 0.1); padding: 10px; border-radius: 8px;">
                    <strong>💧 Función:</strong><br>
                    <small>• Distribución de agua potable</small><br>
                    <small>• Conducción de agua tratada</small><br>
                    <small>• Red de abastecimiento</small>
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
            const response = await fetch(`${this.phpBasePath}obtener_linea_agua_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.lineas.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay líneas de agua registradas</div></div>`;
            }
            
            let lineasHTML = '';
            
            for (const linea of data.lineas) {
                const getDiametroIcono = () => {
                    if (!linea.diametro) return '💧';
                    const diam = parseInt(linea.diametro);
                    if (isNaN(diam)) return '💧';
                    if (diam >= 8) return '🔵';
                    if (diam >= 4) return '💙';
                    return '💧';
                };
                
                const diametroIcono = getDiametroIcono();
                const longitudTexto = linea.longitud_km ? 
                    (linea.longitud_km < 0.1 ? `${Math.round(linea.longitud_km * 1000)}m` : `${linea.longitud_km.toFixed(2)}km`) : '';
                
                // Acortar nombre si es muy largo
                let nombreMostrar = linea.nombre || linea.id;
                if (nombreMostrar && nombreMostrar.length > 40) {
                    nombreMostrar = nombreMostrar.substring(0, 37) + '...';
                }
                
                lineasHTML += `
                    <div class="menu-item" data-nombre="linea_${linea.id}">
                        <span class="item-nombre" data-nombre="linea_${linea.id}" title="${this.escapeHtml(linea.nombre || '')}">
                            ${diametroIcono} ${this.escapeHtml(nombreMostrar)}
                            ${linea.diametro ? `<small style="color: #3498db;"> (${linea.diametro})</small>` : ''}
                            ${longitudTexto ? `<small style="color: #888;"> | ${longitudTexto}</small>` : ''}
                            ${linea.colonia ? `<small style="color: #666;"> - ${this.escapeHtml(linea.colonia)}</small>` : ''}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="linea_${linea.id}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            }
            
            const totalLongitud = data.lineas.reduce((sum, l) => sum + (l.longitud_km || 0), 0);
            const diametros = {};
            data.lineas.forEach(l => {
                if (l.diametro) {
                    const diam = l.diametro;
                    diametros[diam] = (diametros[diam] || 0) + 1;
                }
            });
            
            let estadisticasHTML = '';
            if (totalLongitud > 0 || Object.keys(diametros).length > 0) {
                estadisticasHTML = `
                    <div style="padding: 6px 12px; border-bottom: 1px solid rgba(52,152,219,0.2); text-align: center;">
                        ${totalLongitud > 0 ? `<small style="color: #3498db;">📏 Longitud total: ${totalLongitud.toFixed(2)} km</small>` : ''}
                        ${Object.keys(diametros).length > 0 ? `<br><small style="color: #3498db;">📊 ${Object.entries(diametros).map(([diam, count]) => `${diam}: ${count}`).join(' | ')}</small>` : ''}
                    </div>
                `;
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>💧 Todas las líneas de agua</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>📏 Red de agua</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleLinea-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                ${estadisticasHTML}
                <div id="lineasAguaLista-${this.categoriaId}" style="max-height: 400px; overflow-y: auto;">
                    ${lineasHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de líneas de agua:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando líneas de agua</div></div>`;
        }
    }
}