
import { ModuloBaseMapa } from '../mapa_general.js';

export default class CanalesCieloAbiertoModulo extends ModuloBaseMapa {
    constructor(map, categoriaId) {
        const config = {
            phpBasePath: '../../php/mapa_general/canales_cielo_abierto/',
            
            // Colores específicos para canales
            lineaColor: '#bf00ffcf',
            lineaWeight: 4,
            lineaOpacity: 0.85,
            poligonoColor: '#bf00ffcf',
            poligonoWeight: 2,
            poligonoFillColor: '#bf00ffcf',
            poligonoFillOpacity: 0.15,
            
            // Configuración de iconos (solo por si hay puntos)
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
            const response = await fetch(`${this.phpBasePath}obtener_datos_canales.php`);
            const data = await response.json();
            
            if (!data.success) {
                console.error("Error cargando canales:", data.error);
                return;
            }
            
            console.log(`✅ Canales de Cielo Abierto: ${data.total} elementos encontrados`);
            
            for (const item of data.data) {
                await this.procesarElemento(item);
            }
            
            console.log(`📊 Resumen: ${this.puntos.size} puntos, ${this.lineas.length} líneas (canales), ${this.poligonos.length} polígonos`);
            
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Canales de Cielo Abierto:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, descripcion, idCanal, nombre_canal } = item;
        
        if (tipo === 'LINESTRING') {
            this.crearLineaCanal(coordenadas, nombre, descripcion, {
                idCanal,
                nombre_canal
            });
        } else if (tipo === 'POINT') {
            // Si hubiera puntos, se crean con icono por defecto
            await this.crearPunto(coordenadas, nombre, descripcion, null);
        } else if (tipo === 'POLYGON') {
            this.crearPoligono(coordenadas, nombre, descripcion);
        }
    }
    
    crearLineaCanal(coordenadas, nombre, descripcion, datosAdicionales = {}) {
        const { idCanal, nombre_canal } = datosAdicionales;
        
        const polyline = L.polyline(coordenadas, {
            color: this.config.lineaColor,
            weight: this.config.lineaWeight,
            opacity: this.config.lineaOpacity,
            smoothFactor: 1
        });
        
        this.aplicarInteraccionesCanal(polyline, {
            nombre,
            descripcion,
            idCanal,
            nombre_canal
        });
        
        this.lineas.push(polyline);
    }
    
    aplicarInteraccionesCanal(layer, canalData) {
        const { nombre, descripcion, idCanal, nombre_canal } = canalData;
        
        // Contenido simple para hover
        const contenidoSimple = `
            <div class="popup-contenido">
                <b>🌊 ${this.escapeHtml(nombre || "Canal sin nombre")}</b><br>
                <small>${this.escapeHtml(descripcion || "Canal de cielo abierto")}</small>
            </div>
        `;
        
        // Contenido completo para click
        const contenidoCompleto = `
            <div class="popup-contenido" style="min-width: 260px;">
                <b>🌊 ${this.escapeHtml(nombre || "Canal sin nombre")}</b><br>
                ${idCanal ? `<small style="color: #888;">ID: ${this.escapeHtml(idCanal)}</small><br><br>` : '<br>'}
                
                <div style="background: rgba(0, 168, 255, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <strong>📋 Información del canal:</strong><br>
                    ${nombre_canal ? `<span>🏷️ Nombre técnico: ${this.escapeHtml(nombre_canal)}</span><br>` : ''}
                    <span>📍 Tipo: Canal de cielo abierto</span>
                </div>
                
                <div style="background: rgba(0, 168, 255, 0.1); padding: 10px; border-radius: 8px; margin: 8px 0;">
                    <strong>📝 Descripción:</strong><br>
                    ${this.escapeHtml(descripcion || "Canal de cielo abierto para conducción de agua")}
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
            const response = await fetch(`${this.phpBasePath}obtener_canales_lista.php`);
            const data = await response.json();
            
            if (!data.success || data.canales.length === 0) {
                return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay canales registrados</div></div>`;
            }
            
            let canalesHTML = '';
            
            for (const canal of data.canales) {
                const longitudTexto = canal.longitud_km ? 
                    (canal.longitud_km < 1 ? `${Math.round(canal.longitud_km * 1000)}m` : `${canal.longitud_km.toFixed(2)}km`) : '';
                
                canalesHTML += `
                    <div class="menu-item" data-nombre="${this.escapeHtml(canal.nombre)}">
                        <span class="item-nombre" data-nombre="${this.escapeHtml(canal.nombre)}">
                            🌊 ${this.escapeHtml(canal.nombre)}
                            ${longitudTexto ? `<small style="color: #00a8ff;"> (${longitudTexto})</small>` : ''}
                        </span>
                        <label class="switch">
                            <input type="checkbox" class="toggle-elemento" data-nombre="${this.escapeHtml(canal.nombre)}">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
            }
            
            return `
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>🌊 Todos los canales</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleTodas-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="menu-item header-item">
                    <span class="item-nombre"><strong>📏 Línea de canales</strong></span>
                    <label class="switch">
                        <input type="checkbox" id="toggleLinea-${this.categoriaId}">
                        <span class="slider"></span>
                    </label>
                </div>
                <div id="canalesLista-${this.categoriaId}" style="max-height: 400px; overflow-y: auto;">
                    ${canalesHTML}
                </div>
            `;
        } catch (error) {
            console.error("Error obteniendo lista de canales:", error);
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>Error cargando canales</div></div>`;
        }
    }
}