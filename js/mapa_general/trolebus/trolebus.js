/**
 * trolebus.js - Módulo de Trolebús
 */

export default class TrolebusModulo {
    constructor(map, categoriaId) {
        this.map = map;
        this.categoriaId = categoriaId;
        this.phpBasePath = '../../php/mapa_general/trolebus/';
        
        // Almacenar capas
        this.puntos = new Map();
        this.lineas = [];
        this.poligonos = [];
        
        // Cache de iconos
        this.iconosCache = new Map();
        
        // Estado de visibilidad
        this.activo = false;
    }
    
    async inicializar() {
        console.log('🚌 Inicializando módulo Trolebús');
        await this.cargarDatos();
    }
    
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
            
            console.log(`📊 Resumen: ${this.puntos.size} puntos, ${this.lineas.length} líneas`);
            
            // Todo comienza DESACTIVADO (no visible)
            this.desactivar();
            
        } catch (error) {
            console.error("❌ Error cargando Trolebús:", error);
        }
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, descripcion, icono } = item;
        
        if (tipo === 'POINT') {
            const [lat, lng] = coordenadas;
            const iconoPersonalizado = await this.obtenerIcono(icono);
            
            const marker = L.marker([lat, lng], { icon: iconoPersonalizado });
            this.aplicarInteracciones(marker, nombre, descripcion, lat, lng);
            // NO se añade al mapa todavía (se añade cuando se active)
            
            this.puntos.set(nombre, marker);
            
        } else if (tipo === 'LINESTRING') {
            // ✅ LÍNEAS EN COLOR AZUL
            const polyline = L.polyline(coordenadas, {
                color: '#3498db',  // AZUL
                weight: 5,
                opacity: 0.9,
                smoothFactor: 1
            });
            this.aplicarInteracciones(polyline, nombre, descripcion);
            // NO se añade al mapa todavía
            
            this.lineas.push(polyline);
            
        } else if (tipo === 'POLYGON') {
            const polygon = L.polygon(coordenadas, {
                color: '#3498db',  // AZUL
                weight: 2,
                fillColor: '#3498db',
                fillOpacity: 0.15
            });
            this.aplicarInteracciones(polygon, nombre, descripcion);
            // NO se añade al mapa todavía
            
            this.poligonos.push(polygon);
        }
    }
    
    // ✅ ACTIVAR TODA LA CAPA
    activar() {
        if (this.activo) return;
        
        console.log('👁️ Activando capa Trolebús');
        
        this.puntos.forEach((marker) => {
            marker.addTo(this.map);
        });
        
        this.lineas.forEach((linea) => {
            linea.addTo(this.map);
        });
        
        this.poligonos.forEach((polygon) => {
            polygon.addTo(this.map);
        });
        
        this.activo = true;
        
        // Actualizar switches en el menú
        const toggleTodas = document.getElementById(`toggleTodas-${this.categoriaId}`);
        if (toggleTodas) toggleTodas.checked = true;
        
        const toggleLinea = document.getElementById(`toggleLinea-${this.categoriaId}`);
        if (toggleLinea) toggleLinea.checked = true;
        
        document.querySelectorAll(`#categoria-${this.categoriaId} .toggle-estacion`).forEach(toggle => {
            toggle.checked = true;
        });
    }
    
    // ✅ DESACTIVAR TODA LA CAPA
    desactivar() {
        if (!this.activo && this.puntos.size > 0) return;
        
        console.log('👁️ Desactivando capa Trolebús');
        
        this.puntos.forEach((marker) => {
            this.map.removeLayer(marker);
        });
        
        this.lineas.forEach((linea) => {
            this.map.removeLayer(linea);
        });
        
        this.poligonos.forEach((polygon) => {
            this.map.removeLayer(polygon);
        });
        
        this.activo = false;
        
        // Actualizar switches en el menú
        const toggleTodas = document.getElementById(`toggleTodas-${this.categoriaId}`);
        if (toggleTodas) toggleTodas.checked = false;
        
        const toggleLinea = document.getElementById(`toggleLinea-${this.categoriaId}`);
        if (toggleLinea) toggleLinea.checked = false;
        
        document.querySelectorAll(`#categoria-${this.categoriaId} .toggle-estacion`).forEach(toggle => {
            toggle.checked = false;
        });
    }
    
    async obtenerIcono(nombreIcono) {
        if (!nombreIcono) nombreIcono = "default";
        nombreIcono = nombreIcono.toLowerCase().replace(/\.(png|jpg|jpeg|webp)$/i, '');
        
        if (this.iconosCache.has(nombreIcono)) {
            return this.iconosCache.get(nombreIcono);
        }
        
        const rutaBase = '../../imagenes/iconos_mapas/';
        const extensiones = ['.jpg', '.png', '.jpeg', '.webp'];
        
        for (const ext of extensiones) {
            const url = `${rutaBase}${nombreIcono}${ext}`;
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    const icono = L.icon({
                        iconUrl: url,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -28]
                    });
                    this.iconosCache.set(nombreIcono, icono);
                    return icono;
                }
            } catch (e) {}
        }
        
        const iconoDefault = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -41]
        });
        this.iconosCache.set(nombreIcono, iconoDefault);
        return iconoDefault;
    }
    
    aplicarInteracciones(layer, nombre, descripcion, lat, lng) {
        const contenidoSimple = `<b>${nombre || "Sin nombre"}</b><br>${descripcion || ""}`;
        const contenidoCompleto = `
            <div class="popup-contenido">
                <b>${nombre || "Sin nombre"}</b><br>
                ${descripcion || ""}<br><br>
                ${lat && lng ? `<button class="btn-direcciones" onclick="window.abrirGoogleMaps(${lat}, ${lng})">🚗 Cómo llegar</button>` : ''}
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
        
        layer.on("click", function() {
            popupFijado = true;
            this.setPopupContent(contenidoCompleto);
            this.openPopup();
        });
        
        layer.on("popupclose", function() {
            popupFijado = false;
            this.setPopupContent(contenidoSimple);
        });
    }
    
    async obtenerHTML() {
        const response = await fetch(`${this.phpBasePath}obtener_estaciones.php`);
        const data = await response.json();
        
        if (!data.success || data.estaciones.length === 0) {
            return `<div class="loading-items"><i class="fas fa-exclamation-triangle"></i><div>No hay estaciones</div></div>`;
        }
        
        let estacionesHTML = '';
        
        for (const estacion of data.estaciones) {
            estacionesHTML += `
                <div class="menu-item">
                    <span class="item-nombre" data-nombre="${this.escapeHtml(estacion.nombre)}">${estacion.nombre}</span>
                    <label class="switch">
                        <input type="checkbox" class="toggle-estacion" data-nombre="${this.escapeHtml(estacion.nombre)}">
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
    }
    
    bindearEventos() {
        // Toggle: Todas las estaciones
        const toggleTodas = document.getElementById(`toggleTodas-${this.categoriaId}`);
        if (toggleTodas) {
            toggleTodas.addEventListener('change', (e) => {
                const visible = e.target.checked;
                this.puntos.forEach((marker) => {
                    if (visible) {
                        this.map.addLayer(marker);
                    } else {
                        this.map.removeLayer(marker);
                    }
                });
                document.querySelectorAll(`#categoria-${this.categoriaId} .toggle-estacion`)
                    .forEach(toggle => toggle.checked = visible);
            });
        }
        
        // Toggle: Línea completa
        const toggleLinea = document.getElementById(`toggleLinea-${this.categoriaId}`);
        if (toggleLinea) {
            toggleLinea.addEventListener('change', (e) => {
                const visible = e.target.checked;
                this.lineas.forEach(linea => {
                    visible ? this.map.addLayer(linea) : this.map.removeLayer(linea);
                });
                this.poligonos.forEach(polygon => {
                    visible ? this.map.addLayer(polygon) : this.map.removeLayer(polygon);
                });
            });
        }
        
        // Toggle: Estación individual
        document.querySelectorAll(`#categoria-${this.categoriaId} .toggle-estacion`).forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const marker = this.puntos.get(e.target.dataset.nombre);
                if (marker) {
                    e.target.checked ? this.map.addLayer(marker) : this.map.removeLayer(marker);
                }
            });
        });
        
        // Click en nombre para centrar mapa
        document.querySelectorAll(`#categoria-${this.categoriaId} .item-nombre[data-nombre]`).forEach(item => {
            item.addEventListener('click', () => {
                const marker = this.puntos.get(item.dataset.nombre);
                if (marker) {
                    this.map.setView(marker.getLatLng(), 16);
                    marker.openPopup();
                }
            });
        });
    }
    
    setPuntoVisible(nombre, visible) {
        const marker = this.puntos.get(nombre);
        if (marker) {
            visible ? this.map.addLayer(marker) : this.map.removeLayer(marker);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.abrirGoogleMaps = function(lat, lng) {
    if (!lat || !lng) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
};