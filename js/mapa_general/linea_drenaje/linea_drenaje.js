/**
 * linea_drenaje.js - Módulo de Líneas de Drenaje
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class LineaDrenajeModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        const config = {
            phpBasePath: '../../php/mapa_general/linea_drenaje/',
            
            // Colores específicos para líneas de drenaje (marrón/terracota)
            lineaColor: '#3b8b13b8',
            lineaWeight: 4,
            lineaOpacity: 0.85,
            poligonoColor: '#3b8b13b8',
            poligonoWeight: 2,
            poligonoFillColor: '#3b8b13b8',
            poligonoFillOpacity: 0.15,
            
            // Configuración de iconos (para puntos si los hubiera)
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
            const response = await fetch(`${this.phpBasePath}obtener_datos_linea_drenaje.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error cargando líneas de drenaje:", data.error);
                return;
            }
            
            console.log(`✅ Líneas de Drenaje: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.lineas.length} líneas de drenaje cargadas`);
            
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Líneas de Drenaje:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, calle, diametro, descripcion, colonia, idLinea } = item;
        
        if (tipo === 'LINESTRING' && coordenadas && coordenadas.length >= 2) {
            this.crearLineaDrenaje(coordenadas, {
                calle,
                diametro,
                descripcion,
                colonia,
                idLinea
            });
        }
    }
    
    crearLineaDrenaje(coordenadas, datos) {
        const { calle, diametro, descripcion, colonia, idLinea } = datos;
        
        // Determinar color según diámetro
        const getColorByDiametro = () => {
            if (!diametro) return this.config.lineaColor;
            const diam = diametro.toLowerCase();
            if (diam.includes('30') || diam.includes('30cm')) return '#e67e22';
            if (diam.includes('20') || diam.includes('20cm')) return '#f39c12';
            if (diam.includes('15') || diam.includes('15cm')) return '#f1c40f';
            return this.config.lineaColor;
        };
        
        const polyline = L.polyline(coordenadas, {
            color: getColorByDiametro(),
            weight: this.config.lineaWeight,
            opacity: this.config.lineaOpacity,
            smoothFactor: 1
        });
        
        this.aplicarInteraccionesDrenaje(polyline, {
            calle,
            diametro,
            descripcion,
            colonia,
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
    
    aplicarInteraccionesDrenaje(layer, drenajeData) {
        const { calle, diametro, descripcion, colonia, idLinea, longitud } = drenajeData;
        
        const formatoLongitud = () => {
            if (!longitud) return null;
            if (longitud < 0.1) {
                return `${Math.round(longitud * 1000)} metros`;
            }
            return `${longitud.toFixed(2)} km`;
        };
        
        const longitudTexto = formatoLongitud();
        
        // Contenido simple para hover
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>🕳️ ${this.escapeHtml(calle || "Línea de drenaje")}</b><br>
                ${diametro ? `<span>📏 Diámetro: ${this.escapeHtml(diametro)}</span><br>` : ''}
                ${longitudTexto ? `<span>📐 Longitud: ${longitudTexto}</span>` : ''}
            </div>
        `;
        
        // Contenido completo para click
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 280px; max-width: 350px;">
                <b>🕳️ Línea de drenaje</b><br>
                ${idLinea ? `<small style="color: #888;">ID: ${this.escapeHtml(idLinea)}</small><br><br>` : '<br>'}
                
                <div style="background: rgba(139, 69, 19, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📋 Información de la línea:</strong><br>
                    ${calle ? `<span>📍 Calle: <b>${this.escapeHtml(calle)}</b></span><br>` : ''}
                    ${colonia ? `<span>🏘️ Colonia: ${this.escapeHtml(colonia)}</span><br>` : ''}
                    ${diametro ? `<span>📏 Diámetro: <b>${this.escapeHtml(diametro)}</b></span><br>` : ''}
                    ${longitudTexto ? `<span>📐 Longitud: <b>${longitudTexto}</b></span>` : ''}
                </div>
                
                <div style="background: rgba(139, 69, 19, 0.1); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>📝 Descripción:</strong><br>
                    ${this.escapeHtml(descripcion || "Sin descripción disponible")}
                </div>
                
                <div style="background: rgba(139, 69, 19, 0.1); padding: 10px; border-radius: 8px;">
                    <strong>💧 Función:</strong><br>
                    <small>• Recolección de aguas residuales</small><br>
                    <small>• Drenaje pluvial</small><br>
                    <small>• Red de alcantarillado</small>
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
            const response = await fetch(`${this.phpBasePath}obtener_linea_drenaje_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.lineas.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay líneas de drenaje registradas</div></div>`;
            }
            
            let lineasHTML = '';
            
            for (const linea of data.lineas) {
                const getDiametroIcono = () => {
                    if (!linea.diametro) return '🕳️';
                    const diam = linea.diametro.toLowerCase();
                    if (diam.includes('30')) return '🔴';
                    if (diam.includes('20')) return '🟠';
                    if (diam.includes('15')) return '🟡';
                    return '🕳️';
                };
                
                const diametroIcono = getDiametroIcono();
                const longitudTexto = linea.longitud_km ? 
                    (linea.longitud_km < 0.1 ? `${Math.round(linea.longitud_km * 1000)}m` : `${linea.longitud_km.toFixed(2)}km`) : '';
                
                lineasHTML += `
                    <div class="menu-item" data-nombre="linea_${linea.id}">
                        <span class="item-nombre" data-nombre="linea_${linea.id}" title="${this.escapeHtml(linea.descripcion || '')}">
                            ${diametroIcono} ${this.escapeHtml(linea.calle || linea.id)}
                            ${linea.diametro ? `<small style="color: #8B4513;"> (${linea.diametro})</small>` : ''}
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
            
            // Estadísticas
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
                    <div style="padding: 6px 12px; border-bottom: 1px solid rgba(139,69,19,0.2); text-align: center;">
                        ${totalLongitud > 0 ? `<small style="color: #8B4513;">📏 Longitud total: ${totalLongitud.toFixed(2)} km</small>` : ''}
                        ${Object.keys(diametros).length > 0 ? `<br><small style="color: #8B4513;">📊 ${Object.entries(diametros).map(([diam, count]) => `${diam}: ${count}`).join(' | ')}</small>` : ''}
                    </div>
                `;
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>🕳️ Todas las líneas de drenaje</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>📏 Red de drenaje</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleLinea-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                ${estadisticasHTML}
                <div id="lineasDrenajeLista-${this.categoriaId}" style="max-height: 400px; overflow-y: auto;">
                    ${lineasHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de líneas de drenaje:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando líneas de drenaje</div></div>`;
        }
    }
}