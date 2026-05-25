/**
 * mapa_general.js - Mapa modular con permisos desde el sistema
 * Los permisos se obtienen desde sessionStorage (ya cargados por interfaz_general.js)
 */

// Mapa global
let map;

// Cache de módulos ya cargados
const modulosCargados = {};

// Variables de permisos
let tienePermisoCapas = false;
let modulosPermitidos = [];

// ============================================================================
// CLASE BASE PARA TODOS LOS MÓDULOS DEL MAPA
// ============================================================================
export class ModuloBaseMapa {
    constructor(map, categoriaId, config = {}) {
        this.map = map;
        this.categoriaId = categoriaId;
        this.phpBasePath = config.phpBasePath || '';
        
        this.config = {
            lineaColor: config.lineaColor || '#3498db',
            lineaWeight: config.lineaWeight || 5,
            lineaOpacity: config.lineaOpacity || 0.9,
            poligonoColor: config.poligonoColor || '#3498db',
            poligonoWeight: config.poligonoWeight || 2,
            poligonoFillColor: config.poligonoFillColor || '#3498db',
            poligonoFillOpacity: config.poligonoFillOpacity || 0.15,
            iconSize: config.iconSize || [32, 32],
            iconAnchor: config.iconAnchor || [16, 32],
            popupAnchor: config.popupAnchor || [0, -28],
            zoomLevel: config.zoomLevel || 16,
            tieneSwitchesIndividuales: config.tieneSwitchesIndividuales !== false,
            ...config
        };
        
        this.puntos = new Map();
        this.lineas = [];
        this.poligonos = [];
        this.iconosCache = new Map();
        this.activo = false;
        this.datos = [];
    }
    
    async inicializar() {
        console.log(`📦 Inicializando módulo: ${this.categoriaId}`);
        await this.cargarDatos();
    }
    
    async cargarDatos() {
        throw new Error('El método cargarDatos() debe ser implementado por el módulo hijo');
    }
    
    async procesarElemento(item) {
        const { tipo, coordenadas, nombre, descripcion, icono } = item;
        
        if (tipo === 'POINT') {
            await this.crearPunto(coordenadas, nombre, descripcion, icono);
        } else if (tipo === 'LINESTRING') {
            this.crearLinea(coordenadas, nombre, descripcion);
        } else if (tipo === 'POLYGON') {
            this.crearPoligono(coordenadas, nombre, descripcion);
        }
    }
    
    async crearPunto(coordenadas, nombre, descripcion, iconoNombre) {
        const [lat, lng] = coordenadas;
        const iconoPersonalizado = await this.obtenerIcono(iconoNombre);
        
        const marker = L.marker([lat, lng], { icon: iconoPersonalizado });
        this.aplicarInteracciones(marker, nombre, descripcion, lat, lng);
        
        this.puntos.set(nombre, marker);
    }
    
    crearLinea(coordenadas, nombre, descripcion) {
        const polyline = L.polyline(coordenadas, {
            color: this.config.lineaColor,
            weight: this.config.lineaWeight,
            opacity: this.config.lineaOpacity,
            smoothFactor: 1
        });
        this.aplicarInteracciones(polyline, nombre, descripcion);
        this.lineas.push(polyline);
    }
    
    crearPoligono(coordenadas, nombre, descripcion) {
        const polygon = L.polygon(coordenadas, {
            color: this.config.poligonoColor,
            weight: this.config.poligonoWeight,
            fillColor: this.config.poligonoFillColor,
            fillOpacity: this.config.poligonoFillOpacity
        });
        this.aplicarInteracciones(polygon, nombre, descripcion);
        this.poligonos.push(polygon);
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
                        iconSize: this.config.iconSize,
                        iconAnchor: this.config.iconAnchor,
                        popupAnchor: this.config.popupAnchor
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
        const contenidoSimple = `<b>${this.escapeHtml(nombre || "Sin nombre")}</b><br>${this.escapeHtml(descripcion || "")}`;
        const contenidoCompleto = `
            <div class="popup-contenido">
                <b>${this.escapeHtml(nombre || "Sin nombre")}</b><br>
                ${this.escapeHtml(descripcion || "")}<br><br>
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
    
    activar() {
        if (this.activo) return;
        
        console.log(`👁️ Activando capa: ${this.categoriaId}`);
        
        this.puntos.forEach((marker) => marker.addTo(this.map));
        this.lineas.forEach((linea) => linea.addTo(this.map));
        this.poligonos.forEach((poligono) => poligono.addTo(this.map));
        
        this.activo = true;
        this.actualizarSwitches(true);
    }
    
    desactivar() {
        if (!this.activo && this.puntos.size > 0) return;
        
        console.log(`👁️ Desactivando capa: ${this.categoriaId}`);
        
        this.puntos.forEach((marker) => this.map.removeLayer(marker));
        this.lineas.forEach((linea) => this.map.removeLayer(linea));
        this.poligonos.forEach((poligono) => this.map.removeLayer(poligono));
        
        this.activo = false;
        this.actualizarSwitches(false);
    }
    
    actualizarSwitches(estado) {
        const btnActivar = document.querySelector(`.menu-categoria[data-categoria="${this.categoriaId}"] .btn-activar-capa`);
        if (btnActivar) {
            if (estado) {
                btnActivar.classList.add('active');
                btnActivar.innerHTML = '<i class="fas fa-eye"></i>';
            } else {
                btnActivar.classList.remove('active');
                btnActivar.innerHTML = '<i class="fas fa-eye-slash"></i>';
            }
        }
        
        const toggleTodas = document.getElementById(`toggleTodas-${this.categoriaId}`);
        if (toggleTodas) toggleTodas.checked = estado;
        
        const toggleLinea = document.getElementById(`toggleLinea-${this.categoriaId}`);
        if (toggleLinea) toggleLinea.checked = estado;
        
        document.querySelectorAll(`#categoria-${this.categoriaId} .toggle-elemento`).forEach(toggle => {
            toggle.checked = estado;
        });
    }
    
    async obtenerHTML() {
        throw new Error('El método obtenerHTML() debe ser implementado por el módulo hijo');
    }
    
    bindearEventos() {
        const toggleTodas = document.getElementById(`toggleTodas-${this.categoriaId}`);
        if (toggleTodas) {
            toggleTodas.addEventListener('change', (e) => {
                const visible = e.target.checked;
                this.puntos.forEach((marker) => {
                    visible ? this.map.addLayer(marker) : this.map.removeLayer(marker);
                });
                document.querySelectorAll(`#categoria-${this.categoriaId} .toggle-elemento`)
                    .forEach(toggle => toggle.checked = visible);
            });
        }
        
        const toggleLinea = document.getElementById(`toggleLinea-${this.categoriaId}`);
        if (toggleLinea) {
            toggleLinea.addEventListener('change', (e) => {
                const visible = e.target.checked;
                this.lineas.forEach(linea => {
                    visible ? this.map.addLayer(linea) : this.map.removeLayer(linea);
                });
                this.poligonos.forEach(poligono => {
                    visible ? this.map.addLayer(poligono) : this.map.removeLayer(poligono);
                });
            });
        }
        
        if (this.config.tieneSwitchesIndividuales) {
            document.querySelectorAll(`#categoria-${this.categoriaId} .toggle-elemento`).forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    const marker = this.puntos.get(e.target.dataset.nombre);
                    if (marker) {
                        e.target.checked ? this.map.addLayer(marker) : this.map.removeLayer(marker);
                    }
                });
            });
        }
        
        document.querySelectorAll(`#categoria-${this.categoriaId} .item-nombre[data-nombre]`).forEach(item => {
            item.addEventListener('click', () => {
                const marker = this.puntos.get(item.dataset.nombre);
                if (marker) {
                    this.map.setView(marker.getLatLng(), this.config.zoomLevel);
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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ============================================================================
// FUNCIONES PARA OBTENER PERMISOS DESDE EL SISTEMA
// ============================================================================

function obtenerPermisosMapaDesdeSistema() {
    // Obtener la página actual desde sessionStorage (seteada por interfaz_general.js)
    const paginaActiva = localStorage.getItem('interfaz_general_pagina_activa');
    const botonesPermisos = sessionStorage.getItem(`permisos_botones_mapa_general`);
    
    // Buscar en sessionStorage los permisos de la interfaz Mapa General (id=7)
    // Como no sabemos la key exacta, buscamos por el nombre de la interfaz
    let permisosString = null;
    
    // Intentar obtener de la sesión actual
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('permisos_botones_')) {
            const valor = sessionStorage.getItem(key);
            if (valor && valor.includes('CAPAS')) {
                permisosString = valor;
                break;
            }
        }
    }
    
    // Si no encontramos, intentar obtener desde el PHP directamente
    if (!permisosString) {
        // Hacemos una petición para obtener los permisos específicos
        return obtenerPermisosDesdePHP();
    }
    
    return procesarPermisos(permisosString);
}

async function obtenerPermisosDesdePHP() {
    try {
        const response = await fetch('../../php/mapa_general/obtener_permisos_mapa.php');
        const data = await response.json();
        
        if (data.success) {
            return {
                tieneBotonCapas: data.tiene_boton_capas,
                modulosPermitidos: data.modulos_permitidos
            };
        }
    } catch (error) {
        console.error('Error obteniendo permisos desde PHP:', error);
    }
    
    return {
        tieneBotonCapas: false,
        modulosPermitidos: []
    };
}

function procesarPermisos(permisosString) {
    if (!permisosString) {
        return {
            tieneBotonCapas: false,
            modulosPermitidos: []
        };
    }
    
    const botones = permisosString.split(',');
    let tieneBotonCapas = false;
    const modulosPermitidos = [];
    
    for (const boton of botones) {
        const botonTrim = boton.trim();
        if (botonTrim === 'CAPAS') {
            tieneBotonCapas = true;
        } else if (botonTrim === 'TROLEBUS') {
            modulosPermitidos.push('TROLEBUS');
        } else if (botonTrim === 'CARCAMOS') {
            modulosPermitidos.push('CARCAMOS');
        } else if (botonTrim === 'PLANTAS') {
            modulosPermitidos.push('PLANTAS');
        } else if (botonTrim === 'CANALES_CIELO_ABIERTO') {
            modulosPermitidos.push('CANALES_CIELO_ABIERTO');
        } else if (botonTrim === 'PLANTAS_SEDIMENTADORAS') {
            modulosPermitidos.push('PLANTAS_SEDIMENTADORAS');
        } else if (botonTrim === 'POZOS') {
            modulosPermitidos.push('POZOS');
        } else if (botonTrim === 'PRESAS_GAVION') {
            modulosPermitidos.push('PRESAS_GAVION');
        } else if (botonTrim === 'TANQUES') {
            modulosPermitidos.push('TANQUES');
        }
    }
    
    return {
        tieneBotonCapas: tieneBotonCapas,
        modulosPermitidos: modulosPermitidos
    };
}

// ============================================================================
// FUNCIONES PRINCIPALES DEL MAPA
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🗺️ Inicializando Mapa General');
    
    // Obtener permisos
    const permisos = await obtenerPermisosMapaDesdeSistema();
    console.log('📋 Permisos obtenidos:', permisos);
    
    tienePermisoCapas = permisos.tieneBotonCapas;
    modulosPermitidos = permisos.modulosPermitidos;
    
    // Iniciar mapa (siempre, porque tiene acceso a la interfaz)
    await iniciarMapa();
    
    // Solo crear el menú de capas si tiene permiso para el botón CAPAS
    if (tienePermisoCapas) {
        console.log('✅ Usuario tiene permiso para ver el botón CAPAS');
        crearMenuLateral();
    } else {
        console.log('🔒 Usuario NO tiene permiso para ver el botón CAPAS - Mostrando solo mapa base');
    }
    
    await cargarPoligonoMunicipio();
    
    console.log('✅ Mapa listo');
});

async function iniciarMapa() {
    map = L.map("map", { zoomControl: false }).setView([19.35369, -98.79454], 12);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    const btnCentro = document.getElementById("btnCentroMapa");
    if (btnCentro) {
        btnCentro.addEventListener("click", () => {
            map.setView([19.35369, -98.79454], 12);
        });
    }
}

async function cargarPoligonoMunicipio() {
    try {
        const response = await fetch("../../data/mapa_general/poligono_ixtapaluca.json");
        if (!response.ok) throw new Error("No se encontró el archivo");
        
        const geojson = await response.json();
        
        if (geojson && geojson.features && geojson.features.length > 0) {
            L.geoJSON(geojson, {
                style: {
                    color: '#9D2449',
                    weight: 3,
                    fillColor: '#9D2449',
                    fillOpacity: 0.15
                }
            }).addTo(map).bringToBack();
            console.log("✅ Polígono de Ixtapaluca cargado");
        }
    } catch (error) {
        console.error("❌ Error cargando polígono:", error);
    }
}

function crearMenuLateral() {
    // Definir los módulos que se mostrarán según permisos
    const MODULOS_CONFIG = {
        'trolebus': { nombre: 'Trolebús', icono: 'fa-bus', rutaJS: './trolebus/trolebus.js', permisoRequerido: 'TROLEBUS' },
        'carcamos': { nombre: 'Carcamos', icono: 'fa-water', rutaJS: './carcamos/carcamos.js', permisoRequerido: 'CARCAMOS' },
        'plantas': { nombre: 'Plantas', icono: 'fa-leaf', rutaJS: './plantas/plantas.js', permisoRequerido: 'PLANTAS' },
        'canales_cielo_abierto': { nombre: 'Canales de Cielo Abierto', icono: 'fa-water', rutaJS: './canales_cielo_abierto/canales_cielo_abierto.js', permisoRequerido: 'CANALES_CIELO_ABIERTO' },
        'plantas_sedimentadoras': { nombre: 'Plantas Sedimentadoras', icono: 'fa-leaf', rutaJS: './plantas_sedimentadoras/plantas_sedimentadoras.js', permisoRequerido: 'PLANTAS_SEDIMENTADORAS' },
        'pozos': { nombre: 'Pozos', icono: 'fa-leaf', rutaJS: './pozos/pozos.js', permisoRequerido: 'POZOS' },
        'presas_gavion': { nombre: 'Presas de Gavión', icono: 'fa-leaf', rutaJS: './presas_gavion/presas_gavion.js', permisoRequerido: 'PRESAS_GAVION' },
        'tanques': { nombre: 'Tanques', icono: 'fa-leaf', rutaJS: './tanques/tanques.js', permisoRequerido: 'TANQUES' },
    };
    
    // Filtrar solo los módulos permitidos
    const modulosPermitidosUpper = modulosPermitidos.map(m => m.toUpperCase());
    const MODULOS = {};
    
    for (const [key, config] of Object.entries(MODULOS_CONFIG)) {
        if (modulosPermitidosUpper.includes(config.permisoRequerido)) {
            MODULOS[key] = config;
            console.log(`✅ Módulo permitido: ${config.nombre}`);
        }
    }
    
    // Si no tiene ningún módulo permitido, no mostrar nada en el menú
    if (Object.keys(MODULOS).length === 0) {
        console.log('⚠️ Usuario tiene CAPAS pero no tiene módulos específicos - Menú vacío');
        // Mostrar mensaje dentro del menú
        const menuHTML = `
            <div class="menu-lateral">
                <button class="menu-btn-principal" id="menuBtnPrincipal">
                    <i class="fas fa-layer-group"></i> Capas
                </button>
                <div class="menu-desplegable oculto" id="menuDesplegable">
                    <div class="menu-header">
                        <h3><i class="fas fa-map-marked-alt"></i> Capas del Mapa</h3>
                        <button class="btn-cerrar-menu" id="btnCerrarMenu">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="menu-contenido">
                        <div class="menu-sin-capas">
                            <i class="fas fa-info-circle"></i>
                            <p>No tienes capas disponibles</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', menuHTML);
        configurarEventosMenu();
        return;
    }
    
    // Generar HTML para los módulos permitidos
    let categoriasHTML = '';
    
    for (const [key, modulo] of Object.entries(MODULOS)) {
        categoriasHTML += `
            <div class="menu-categoria" data-categoria="${key}">
                <div class="categoria-header collapsed">
                    <div class="categoria-titulo">
                        <i class="fas ${modulo.icono}"></i>
                        <span>${modulo.nombre}</span>
                    </div>
                    <div class="categoria-controles">
                        <button class="btn-activar-capa" data-categoria="${key}" title="Activar/Desactivar capa">
                            <i class="fas fa-eye-slash"></i>
                        </button>
                        <i class="fas fa-chevron-down categoria-toggle"></i>
                    </div>
                </div>
                <div class="categoria-items" id="categoria-${key}">
                    <div class="loading-items">
                        <i class="fas fa-spinner fa-pulse"></i>
                        <div>Cargando...</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    const menuHTML = `
        <div class="menu-lateral">
            <button class="menu-btn-principal" id="menuBtnPrincipal">
                <i class="fas fa-layer-group"></i> Capas
            </button>
            <div class="menu-desplegable oculto" id="menuDesplegable">
                <div class="menu-header">
                    <h3><i class="fas fa-map-marked-alt"></i> Capas del Mapa</h3>
                    <button class="btn-cerrar-menu" id="btnCerrarMenu">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="menu-contenido">
                    ${categoriasHTML}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', menuHTML);
    
    // Configurar eventos del menú
    configurarEventosMenu();
    
    // Configurar eventos de expansión/colapso de categorías
    document.querySelectorAll('.categoria-header').forEach(header => {
        const toggleIcon = header.querySelector('.categoria-toggle');
        const categoriaId = header.closest('.menu-categoria').dataset.categoria;
        const itemsDiv = document.getElementById(`categoria-${categoriaId}`);
        
        if (toggleIcon) {
            toggleIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const isCollapsed = header.classList.contains('collapsed');
                
                if (isCollapsed) {
                    header.classList.remove('collapsed');
                    if (itemsDiv) {
                        itemsDiv.classList.add('expanded');
                    }
                    await cargarModulo(categoriaId, MODULOS);
                } else {
                    header.classList.add('collapsed');
                    if (itemsDiv) {
                        itemsDiv.classList.remove('expanded');
                    }
                }
            });
        }
        
        const btnActivar = header.querySelector('.btn-activar-capa');
        if (btnActivar) {
            btnActivar.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                await cargarModulo(categoriaId, MODULOS);
                
                const modulo = modulosCargados[categoriaId];
                if (modulo) {
                    const isActive = btnActivar.classList.contains('active');
                    
                    if (isActive) {
                        modulo.desactivar();
                    } else {
                        modulo.activar();
                    }
                }
            });
        }
    });
}

function configurarEventosMenu() {
    const menuBtn = document.getElementById('menuBtnPrincipal');
    const menuDesplegable = document.getElementById('menuDesplegable');
    const btnCerrar = document.getElementById('btnCerrarMenu');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            menuDesplegable.classList.toggle('oculto');
        });
    }
    
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            menuDesplegable.classList.add('oculto');
        });
    }
    
    document.addEventListener('click', (e) => {
        if (menuDesplegable && menuBtn && !menuDesplegable.contains(e.target) && !menuBtn.contains(e.target)) {
            menuDesplegable.classList.add('oculto');
        }
    });
}

async function cargarModulo(categoriaId, MODULOS) {
    if (modulosCargados[categoriaId]) {
        return modulosCargados[categoriaId];
    }
    
    const modulo = MODULOS[categoriaId];
    if (!modulo) {
        console.error(`❌ Módulo ${categoriaId} no encontrado`);
        return null;
    }
    
    console.log(`📦 Cargando módulo: ${modulo.nombre}`);
    
    try {
        const moduleExports = await import(modulo.rutaJS);
        const ModuloClass = moduleExports.default;
        
        const instancia = new ModuloClass(map, categoriaId);
        await instancia.inicializar();
        
        modulosCargados[categoriaId] = instancia;
        
        const itemsDiv = document.getElementById(`categoria-${categoriaId}`);
        if (itemsDiv) {
            const html = await instancia.obtenerHTML();
            itemsDiv.innerHTML = html;
            instancia.bindearEventos();
        }
        
        console.log(`✅ Módulo ${modulo.nombre} cargado correctamente (inactivo)`);
        return instancia;
        
    } catch (error) {
        console.error(`❌ Error cargando módulo ${modulo.nombre}:`, error);
        const itemsDiv = document.getElementById(`categoria-${categoriaId}`);
        if (itemsDiv) {
            itemsDiv.innerHTML = `
                <div class="loading-items" style="color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>Error: ${error.message}</div>
                </div>
            `;
        }
        return null;
    }
}

// Función global para Google Maps
window.abrirGoogleMaps = function(lat, lng) {
    if (!lat || !lng) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
};