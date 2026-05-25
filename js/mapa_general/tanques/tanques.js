/**
 * tanques.js - Módulo de Tanques de Almacenamiento
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class TanquesModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        const config = {
            phpBasePath: '../../php/mapa_general/tanques/',
            
            // Colores específicos para tanques (azul metálico)
            lineaColor: '#3498db',
            lineaWeight: 4,
            lineaOpacity: 0.85,
            poligonoColor: '#3498db',
            poligonoWeight: 2,
            poligonoFillColor: '#3498db',
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
            const response = await fetch(`${this.phpBasePath}obtener_datos_tanques.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error cargando tanques:", data.error);
                return;
            }
            
            console.log(`✅ Tanques: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.puntos.size} tanques cargados`);
            
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Tanques:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, descripcion, icono, idTanque, 
                volumen_m3, capacidad, tipo_tanque, rebombeos } = item;
        
        if (tipo === 'POINT' && coordenadas && coordenadas.length >= 2) {
            const [lat, lng] = coordenadas;
            
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                console.warn(`Coordenadas inválidas para tanque: ${nombre}`, lat, lng);
                return;
            }
            
            const iconoPersonalizado = await this.obtenerIcono(icono || 'tanques');
            
            const marker = L.marker([lat, lng], { icon: iconoPersonalizado });
            
            this.aplicarInteraccionesTanque(marker, {
                nombre,
                descripcion,
                lat,
                lng,
                idTanque,
                volumen_m3,
                capacidad,
                tipo_tanque,
                rebombeos
            });
            
            const nombreKey = nombre || `tanque_${idTanque}`;
            this.puntos.set(nombreKey, marker);
        }
    }
    
    aplicarInteraccionesTanque(layer, tanqueData) {
        const { nombre, descripcion, lat, lng, idTanque, volumen_m3, capacidad, 
                tipo_tanque, rebombeos } = tanqueData;
        
        // Determinar icono según tipo de tanque
        const getTipoIcono = () => {
            const tipo = (tipo_tanque || '').toLowerCase();
            if (tipo === 'elevado') return '🗼';
            if (tipo === 'superficial') return '🏭';
            return '💧';
        };
        
        // Determinar estado de rebombeos
        const getRebombeoEstado = () => {
            const reb = (rebombeos || '').toLowerCase();
            if (reb === 'no' || reb === '') return '❌ Sin rebombeo';
            if (reb.includes('operando bien') || reb.includes('operando')) return '🟢 Con rebombeo (operativo)';
            if (reb.includes('quemado') || reb.includes('dañado')) return '🔴 Con rebombeo (problemas)';
            if (reb !== 'no' && reb !== '') return '🟡 Con rebombeo';
            return '⚪ Sin información';
        };
        
        const tipoIcono = getTipoIcono();
        const rebombeoEstado = getRebombeoEstado();
        
        // Formatear volumen
        const formatoVolumen = () => {
            if (volumen_m3 && volumen_m3 !== 'Null') {
                return `${volumen_m3} m³`;
            }
            if (capacidad && capacidad !== 'Null') {
                return `${capacidad} m³`;
            }
            return null;
        };
        
        const volumenTexto = formatoVolumen();
        
        // Contenido simple para hover
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>${tipoIcono} ${this.escapeHtml(nombre || "Tanque")}</b><br>
                ${volumenTexto ? `<span>📏 Volumen: ${volumenTexto}</span><br>` : ''}
                <small>${this.escapeHtml(descripcion?.substring(0, 50) || "Tanque de almacenamiento")}</small>
            </div>
        `;
        
        // Contenido completo para click
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 320px; max-width: 400px; max-height: 500px; overflow-y: auto;">
                <b>${tipoIcono} ${this.escapeHtml(nombre || "Tanque sin nombre")}</b><br>
                ${idTanque ? `<small style="color: #888;">ID: ${this.escapeHtml(idTanque)}</small><br><br>` : '<br>'}
                
                <div style="background: rgba(52, 152, 219, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📋 Información del tanque:</strong><br>
                    ${tipo_tanque ? `<span>🏷️ Tipo: <b>${this.escapeHtml(tipo_tanque)}</b></span><br>` : ''}
                    ${volumenTexto ? `<span>💧 Volumen: <b>${volumenTexto}</b></span><br>` : ''}
                    <span>📊 ${rebombeoEstado}</span>
                </div>
                
                <div style="background: rgba(52, 152, 219, 0.1); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>📝 Descripción:</strong><br>
                    ${this.escapeHtml(descripcion || "Sin descripción disponible")}
                </div>
                
                ${rebombeos && rebombeos !== 'NO' && rebombeos !== 'Null' ? `
                <div style="background: rgba(52, 152, 219, 0.1); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>⚙️ Equipos de rebombeo:</strong><br>
                    <small>${this.escapeHtml(rebombeos)}</small>
                </div>
                ` : ''}
                
                <div style="background: rgba(52, 152, 219, 0.1); padding: 10px; border-radius: 8px;">
                    <strong>💧 Función:</strong><br>
                    <small>• Almacenamiento de agua potable</small><br>
                    <small>• Regulación de presión</small><br>
                    <small>• Respaldo para la red de distribución</small>
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
            const response = await fetch(`${this.phpBasePath}obtener_tanques_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.tanques.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay tanques registrados con coordenadas</div></div>`;
            }
            
            // Separar tanques por tipo
            const elevados = data.tanques.filter(t => t.tipo === 'Elevado');
            const superficiales = data.tanques.filter(t => t.tipo === 'Superficial');
            const otros = data.tanques.filter(t => t.tipo !== 'Elevado' && t.tipo !== 'Superficial');
            
            let tanquesHTML = '';
            
            const generarItemTanque = (tanque) => {
                const getTipoIcono = () => {
                    if (tanque.tipo === 'Elevado') return '🗼';
                    if (tanque.tipo === 'Superficial') return '🏭';
                    return '💧';
                };
                
                const tipoIcono = getTipoIcono();
                const tieneRebombeo = tanque.rebombeos && tanque.rebombeos !== 'NO' && tanque.rebombeos !== 'Null';
                const rebombeoIcono = tieneRebombeo ? '⚡' : '';
                
                return `
                    <div class="menu-item" data-nombre="${this.escapeHtml(tanque.nombre)}">
                        <span class="item-nombre" data-nombre="${this.escapeHtml(tanque.nombre)}" title="${this.escapeHtml(tanque.descripcion || '')}">
                            ${tipoIcono} ${this.escapeHtml(tanque.nombre)}
                            ${tanque.volumen_m3 && tanque.volumen_m3 !== 'Null' ? `<small style="color: #3498db;"> (${tanque.volumen_m3} m³)</small>` : ''}
                            ${rebombeoIcono ? `<small style="color: #f39c12;"> ${rebombeoIcono}</small>` : ''}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="${this.escapeHtml(tanque.nombre)}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            };
            
            // Sección tanques elevados
            if (elevados.length > 0) {
                tanquesHTML += `
                    <div style="padding: 8px 12px; margin-top: 8px; background: rgba(52, 152, 219, 0.1); border-radius: 5px;">
                        <small style="color: #3498db;">🗼 ELEVADOS (${elevados.length})</small>
                    </div>
                `;
                elevados.forEach(tanque => {
                    tanquesHTML += generarItemTanque(tanque);
                });
            }
            
            // Sección tanques superficiales
            if (superficiales.length > 0) {
                tanquesHTML += `
                    <div style="padding: 8px 12px; margin-top: 4px; background: rgba(52, 152, 219, 0.1); border-radius: 5px;">
                        <small style="color: #3498db;">🏭 SUPERFICIALES (${superficiales.length})</small>
                    </div>
                `;
                superficiales.forEach(tanque => {
                    tanquesHTML += generarItemTanque(tanque);
                });
            }
            
            // Sección otros
            if (otros.length > 0) {
                tanquesHTML += `
                    <div style="padding: 8px 12px; margin-top: 4px; background: rgba(52, 152, 219, 0.1); border-radius: 5px;">
                        <small style="color: #95a5a6;">💧 OTROS (${otros.length})</small>
                    </div>
                `;
                otros.forEach(tanque => {
                    tanquesHTML += generarItemTanque(tanque);
                });
            }
            
            // Calcular capacidad total
            let capacidadTotal = 0;
            data.tanques.forEach(t => {
                if (t.volumen_m3 && t.volumen_m3 !== 'Null') {
                    const vol = parseInt(t.volumen_m3);
                    if (!isNaN(vol)) capacidadTotal += vol;
                }
            });
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>💧 Todos los tanques</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                ${capacidadTotal > 0 ? `
                <div style="padding: 6px 12px; border-bottom: 1px solid rgba(52,152,219,0.2); text-align: center;">
                    <small style="color: #3498db;">📊 Capacidad total instalada: ${capacidadTotal.toLocaleString()} m³</small>
                </div>
                ` : ''}
                <div id="tanquesLista-${this.categoriaId}" style="max-height: 400px; overflow-y: auto;">
                    ${tanquesHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de tanques:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando tanques</div></div>`;
        }
    }
}