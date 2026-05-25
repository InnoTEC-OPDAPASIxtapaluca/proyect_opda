/**
 * pozos.js - Módulo de Pozos de Agua
 * Extiende la clase base ModuloBaseMapa
 */

import { ModuloBaseMapa } from '../mapa_general.js';

export default class PozosModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        const config = {
            phpBasePath: '../../php/mapa_general/pozos/',
            
            lineaColor: '#2980b9',
            lineaWeight: 4,
            lineaOpacity: 0.85,
            poligonoColor: '#2980b9',
            poligonoWeight: 2,
            poligonoFillColor: '#2980b9',
            poligonoFillOpacity: 0.15,
            
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
            const response = await fetch(`${this.phpBasePath}obtener_datos_pozos.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error cargando pozos:", data.error);
                return;
            }
            
            console.log(`✅ Pozos: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.puntos.size} pozos cargados`);
            
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Pozos:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, numero_pozo, estatus, estado, equipo, 
                gasto_litros, zona_influencia, m3_mensual, horas_operacion,
                consumo_cfe, adeudo_cfe, titulo_concesion, vigencia, volumen,
                documento_propiedad, domicilio, icono, idPozo } = item;
        
        if (tipo === 'POINT' && coordenadas && coordenadas.length >= 2) {
            const [lat, lng] = coordenadas;
            
            // Validar coordenadas
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                console.warn(`Coordenadas inválidas para pozo: ${nombre}`, lat, lng);
                return;
            }
            
            const iconoPersonalizado = await this.obtenerIcono(icono || 'pozo');
            
            const marker = L.marker([lat, lng], { icon: iconoPersonalizado });
            
            this.aplicarInteraccionesPozo(marker, {
                nombre,
                numero_pozo,
                lat,
                lng,
                estatus,
                estado,
                equipo,
                gasto_litros,
                zona_influencia,
                m3_mensual,
                horas_operacion,
                consumo_cfe,
                adeudo_cfe,
                titulo_concesion,
                vigencia,
                volumen,
                documento_propiedad,
                domicilio,
                idPozo
            });
            
            const nombreKey = nombre || `pozo_${idPozo}`;
            this.puntos.set(nombreKey, marker);
        }
    }
    
    aplicarInteraccionesPozo(layer, pozoData) {
        const { nombre, numero_pozo, lat, lng, estatus, estado, equipo, 
                gasto_litros, zona_influencia, m3_mensual, horas_operacion,
                consumo_cfe, adeudo_cfe, titulo_concesion, vigencia, volumen,
                documento_propiedad, domicilio, idPozo } = pozoData;
        
        const getEstatusColor = () => {
            const est = (estatus || '').toUpperCase();
            if (est === 'ACTIVO') return '#2ecc71';
            if (est.includes('PROCESO')) return '#f39c12';
            if (est === 'INACTIVO') return '#e74c3c';
            return '#95a5a6';
        };
        
        const getEstadoIcono = () => {
            const est = (estado || '').toUpperCase();
            if (est === 'BUENO') return '✅';
            if (est === 'REGULAR') return '⚠️';
            if (est === 'MALO') return '🔴';
            return '💧';
        };
        
        const estatusColor = getEstatusColor();
        const estadoIcono = getEstadoIcono();
        
        const formatoGasto = () => {
            if (!gasto_litros) return null;
            const gasto = parseFloat(gasto_litros);
            if (isNaN(gasto)) return null;
            if (gasto >= 1000) {
                return `${(gasto / 1000).toFixed(1)} m³/s`;
            }
            return `${gasto} l/s`;
        };
        
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>💧 ${this.escapeHtml(nombre || "Pozo sin nombre")}</b><br>
                <span style="color: ${estatusColor};">● ${this.escapeHtml(estatus || "N/A")}</span>
                ${numero_pozo ? `<br>📌 N°: ${this.escapeHtml(numero_pozo)}` : ''}
                ${gasto_litros ? `<br>💧 Gasto: ${formatoGasto()}` : ''}
            </div>
        `;
        
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 320px; max-width: 400px; max-height: 500px; overflow-y: auto;">
                <b>💧 ${this.escapeHtml(nombre || "Pozo sin nombre")}</b><br>
                ${numero_pozo ? `<small>📌 Número: ${this.escapeHtml(numero_pozo)}</small>` : ''}
                ${idPozo ? `<br><small style="color: #888;">ID: ${this.escapeHtml(idPozo)}</small>` : ''}
                <br><br>
                
                <div style="background: rgba(41, 128, 185, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📊 Estado operativo:</strong><br>
                    <span style="color: ${estatusColor};">● Estatus: ${this.escapeHtml(estatus || "N/A")}</span><br>
                    <span>${estadoIcono} Estado: ${this.escapeHtml(estado || "N/A")}</span>
                </div>
                
                <div style="background: rgba(41, 128, 185, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>⚙️ Datos de operación:</strong><br>
                    ${gasto_litros ? `<span>💧 Gasto: <b>${formatoGasto()}</b></span><br>` : ''}
                    ${m3_mensual ? `<span>📈 Producción mensual: <b>${this.escapeHtml(m3_mensual)} m³</b></span><br>` : ''}
                    ${horas_operacion ? `<span>⏱️ Horas operación: <b>${this.escapeHtml(horas_operacion)} hrs/día</b></span><br>` : ''}
                    ${zona_influencia ? `<span>📍 Zona de influencia:<br><small>${this.escapeHtml(zona_influencia)}</small></span>` : ''}
                </div>
                
                ${equipo ? `
                <div style="background: rgba(41, 128, 185, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>🔧 Equipo:</strong><br>
                    <small>${this.escapeHtml(equipo)}</small>
                </div>
                ` : ''}
                
                ${titulo_concesion || vigencia || volumen ? `
                <div style="background: rgba(41, 128, 185, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📜 Concesión:</strong><br>
                    ${titulo_concesion ? `<span>📄 Título: ${this.escapeHtml(titulo_concesion)}</span><br>` : ''}
                    ${vigencia ? `<span>📅 Vigencia: ${this.escapeHtml(vigencia)}</span><br>` : ''}
                    ${volumen ? `<span>💧 Volumen: ${this.escapeHtml(volumen)}</span>` : ''}
                </div>
                ` : ''}
                
                ${consumo_cfe || adeudo_cfe ? `
                <div style="background: rgba(41, 128, 185, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>⚡ CFE:</strong><br>
                    ${consumo_cfe ? `<span>💰 Consumo: ${this.escapeHtml(consumo_cfe)}</span><br>` : ''}
                    ${adeudo_cfe ? `<span>⚠️ Adeudo: ${this.escapeHtml(adeudo_cfe)}</span>` : ''}
                </div>
                ` : ''}
                
                ${domicilio ? `
                <div style="background: rgba(41, 128, 185, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📍 Domicilio:</strong><br>
                    <small>${this.escapeHtml(domicilio)}</small>
                </div>
                ` : ''}
                
                ${documento_propiedad ? `
                <div style="background: rgba(41, 128, 185, 0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📋 Documento:</strong><br>
                    <small>${this.escapeHtml(documento_propiedad)}</small>
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
    
    async obtenerHTML() {
        try {
            const response = await fetch(`${this.phpBasePath}obtener_pozos_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.pozos.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay pozos registrados con coordenadas</div></div>`;
            }
            
            const activos = data.pozos.filter(p => p.estatus === 'ACTIVO');
            const enProceso = data.pozos.filter(p => p.estatus && p.estatus.includes('PROCESO'));
            const inactivos = data.pozos.filter(p => p.estatus === 'INACTIVO');
            const otros = data.pozos.filter(p => p.estatus !== 'ACTIVO' && p.estatus !== 'INACTIVO' && (!p.estatus || !p.estatus.includes('PROCESO')));
            
            let pozosHTML = '';
            
            const generarItemPozo = (pozo) => {
                const getIconoEstatus = () => {
                    if (pozo.estatus === 'ACTIVO') return '🟢';
                    if (pozo.estatus && pozo.estatus.includes('PROCESO')) return '🟡';
                    if (pozo.estatus === 'INACTIVO') return '🔴';
                    return '💧';
                };
                
                const iconoEstatus = getIconoEstatus();
                const gastoTexto = pozo.gasto_litros && !isNaN(parseFloat(pozo.gasto_litros)) ? 
                    (parseFloat(pozo.gasto_litros) >= 1000 ? `${(parseFloat(pozo.gasto_litros) / 1000).toFixed(1)} m³/s` : `${pozo.gasto_litros} l/s`) : '';
                
                return `
                    <div class="menu-item" data-nombre="${this.escapeHtml(pozo.nombre)}">
                        <span class="item-nombre" data-nombre="${this.escapeHtml(pozo.nombre)}">
                            ${iconoEstatus} ${this.escapeHtml(pozo.nombre)}
                            ${pozo.numero_pozo ? `<small style="color: #2980b9;"> (${this.escapeHtml(pozo.numero_pozo)})</small>` : ''}
                            ${gastoTexto ? `<small style="color: #27ae60;"> | ${gastoTexto}</small>` : ''}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="${this.escapeHtml(pozo.nombre)}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            };
            
            if (activos.length > 0) {
                pozosHTML += `<div style="padding: 8px 12px; margin-top: 8px; background: rgba(46, 204, 113, 0.1); border-radius: 5px;"><small style="color: #2ecc71;">🟢 ACTIVOS (${activos.length})</small></div>`;
                activos.forEach(pozo => { pozosHTML += generarItemPozo(pozo); });
            }
            
            if (enProceso.length > 0) {
                pozosHTML += `<div style="padding: 8px 12px; margin-top: 4px; background: rgba(243, 156, 18, 0.1); border-radius: 5px;"><small style="color: #f39c12;">🟡 EN PROCESO (${enProceso.length})</small></div>`;
                enProceso.forEach(pozo => { pozosHTML += generarItemPozo(pozo); });
            }
            
            if (inactivos.length > 0) {
                pozosHTML += `<div style="padding: 8px 12px; margin-top: 4px; background: rgba(231, 76, 60, 0.1); border-radius: 5px;"><small style="color: #e74c3c;">🔴 INACTIVOS (${inactivos.length})</small></div>`;
                inactivos.forEach(pozo => { pozosHTML += generarItemPozo(pozo); });
            }
            
            if (otros.length > 0) {
                pozosHTML += `<div style="padding: 8px 12px; margin-top: 4px; background: rgba(149, 165, 166, 0.1); border-radius: 5px;"><small style="color: #95a5a6;">⚪ OTROS (${otros.length})</small></div>`;
                otros.forEach(pozo => { pozosHTML += generarItemPozo(pozo); });
            }
            
            // Calcular gasto total
            let gastoTotal = 0;
            let pozosConGasto = 0;
            data.pozos.forEach(p => {
                if (p.gasto_litros && !isNaN(parseFloat(p.gasto_litros)) && p.estatus === 'ACTIVO') {
                    gastoTotal += parseFloat(p.gasto_litros);
                    pozosConGasto++;
                }
            });
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>💧 Todos los pozos</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                ${gastoTotal > 0 ? `
                <div style="padding: 6px 12px; border-bottom: 1px solid rgba(41,128,185,0.2); text-align: center;">
                    <small style="color: #2980b9;">📊 Gasto total activos: ${(gastoTotal / 1000).toFixed(1)} m³/s (${gastoTotal.toLocaleString()} l/s)</small>
                </div>
                ` : ''}
                <div id="pozosLista-${this.categoriaId}" style="max-height: 400px; overflow-y: auto;">
                    ${pozosHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de pozos:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando pozos</div></div>`;
        }
    }
}