/**
 * mapa_general.js - Mapa modular con carga dinámica
 */

// Mapa global
let map;

// Lista de módulos disponibles
const MODULOS = {
    'trolebus': {
        nombre: 'Trolebús',
        icono: 'fa-bus',
        rutaJS: './trolebus/trolebus.js',
        activado: false  // ✅ Comienza desactivado
    }
};

// Cache de módulos ya cargados
const modulosCargados = {};

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🗺️ Inicializando Mapa General');
    
    await iniciarMapa();
    crearMenuLateral();
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
    
    // Eventos del menú
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
    
    // Eventos de expansión/colapso de categorías
    document.querySelectorAll('.categoria-header').forEach(header => {
        const toggleIcon = header.querySelector('.categoria-toggle');
        const categoriaId = header.closest('.menu-categoria').dataset.categoria;
        const itemsDiv = document.getElementById(`categoria-${categoriaId}`);
        
        // Click en el toggle (flecha) para expandir/colapsar
        if (toggleIcon) {
            toggleIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const isCollapsed = header.classList.contains('collapsed');
                
                if (isCollapsed) {
                    header.classList.remove('collapsed');
                    if (itemsDiv) {
                        itemsDiv.classList.add('expanded');
                    }
                    // Cargar el módulo solo cuando se expande por primera vez
                    await cargarModulo(categoriaId);
                } else {
                    header.classList.add('collapsed');
                    if (itemsDiv) {
                        itemsDiv.classList.remove('expanded');
                    }
                }
            });
        }
        
        // Click en el botón de activar/desactivar capa
        const btnActivar = header.querySelector('.btn-activar-capa');
        if (btnActivar) {
            btnActivar.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                // Asegurar que el módulo esté cargado
                await cargarModulo(categoriaId);
                
                const modulo = modulosCargados[categoriaId];
                if (modulo) {
                    const isActive = btnActivar.classList.contains('active');
                    
                    if (isActive) {
                        // Desactivar capa
                        btnActivar.classList.remove('active');
                        btnActivar.innerHTML = '<i class="fas fa-eye-slash"></i>';
                        modulo.desactivar();
                    } else {
                        // Activar capa
                        btnActivar.classList.add('active');
                        btnActivar.innerHTML = '<i class="fas fa-eye"></i>';
                        modulo.activar();
                    }
                }
            });
        }
    });
}

async function cargarModulo(categoriaId) {
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
        
        // La capa comienza DESACTIVADA
        const btnActivar = document.querySelector(`.menu-categoria[data-categoria="${categoriaId}"] .btn-activar-capa`);
        if (btnActivar) {
            btnActivar.classList.remove('active');
            btnActivar.innerHTML = '<i class="fas fa-eye-slash"></i>';
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