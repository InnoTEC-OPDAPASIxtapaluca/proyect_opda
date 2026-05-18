/**
 * mapa_interno.js - Mapa interactivo de pozos e infraestructura hidráulica
 * Versión independiente - NO depende de otros JS del sistema
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ Mapa Interno - Inicializado');

    // ============================================
    // CONFIGURACIÓN DEL MAPA
    // ============================================
    const map = L.map("map", { zoomControl: false }).setView([19.32, -98.93], 13);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Capa base de OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: ['a', 'b', 'c']
    }).addTo(map);

    // ============================================
    // VARIABLES GLOBALES
    // ============================================
    const listaCapas = document.getElementById("listaCapas");
    const capas = {};           // Apartado -> Bloque -> LayerGroup
    const capasGlobales = [];   // Todos los layers individuales
    const controlesApartados = {}; // Botones de cada apartado
    const iconosCache = {};

    // ============================================
    // FUNCIÓN PARA OBTENER ICONOS
    // ============================================
    function obtenerIcono(nombreIcono) {
        if (!nombreIcono) nombreIcono = "default";

        if (!iconosCache[nombreIcono]) {
            iconosCache[nombreIcono] = L.icon({
                iconUrl: `../../../imagenes/diagnosticos/pozos/${nombreIcono}.png`,
                iconSize: [34, 34],
                iconAnchor: [17, 34],
                popupAnchor: [0, -28]
            });
        }
        return iconosCache[nombreIcono];
    }

    // Icono por defecto (fallback)
    const iconoPorDefecto = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -41]
    });

    // ============================================
    // PARSER WKT
    // ============================================
    function parseWKT(wkt) {
        if (!wkt || typeof wkt !== 'string') return null;
        wkt = wkt.trim();

        // POINT
        if (wkt.startsWith("POINT")) {
            const match = wkt.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
            if (match) {
                const lng = parseFloat(match[1]);
                const lat = parseFloat(match[2]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { type: "POINT", coords: [lat, lng] };
                }
            }
        }

        // LINESTRING
        if (wkt.startsWith("LINESTRING")) {
            const coordsStr = wkt.replace("LINESTRING (", "").replace(")", "");
            const coords = coordsStr.split(",").map(p => {
                const [lng, lat] = p.trim().split(" ").map(Number);
                return [lat, lng];
            });
            if (coords.length >= 2) {
                return { type: "LINESTRING", coords };
            }
        }

        // POLYGON
        if (wkt.startsWith("POLYGON")) {
            const coordsStr = wkt.replace("POLYGON ((", "").replace("))", "");
            const coords = coordsStr.split(",").map(p => {
                const [lng, lat] = p.trim().split(" ").map(Number);
                return [lat, lng];
            });
            if (coords.length >= 3) {
                return { type: "POLYGON", coords };
            }
        }

        return null;
    }

    // ============================================
    // FUNCIÓN PARA ABRIR GOOGLE MAPS
    // ============================================
    window.abrirGoogleMaps = function(lat, lng) {
        if (!lat || !lng) {
            console.error("Coordenadas inválidas");
            return;
        }
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
        window.open(url, "_blank");
    };

    // ============================================
    // APLICAR HOVER Y CLICK A UN LAYER
    // ============================================
    function aplicarInteracciones(layer, row, lat, lng) {
        const contenidoSimple = `<b>${row.Nombre || "Sin nombre"}</b><br>${row.Descripción || ""}`;
        const contenidoCompleto = `
            <div class="popup-contenido">
                <b>${row.Nombre || "Sin nombre"}</b><br>
                ${row.Descripción || ""}<br><br>
                <button class="btn-direcciones" onclick="abrirGoogleMaps(${lat}, ${lng})">
                    🚗 Cómo llegar
                </button>
            </div>
        `;

        let popupFijado = false;

        // Configurar popup inicial
        layer.bindPopup(contenidoSimple);

        // Mouseover - popup simple
        layer.on("mouseover", function() {
            if (!popupFijado) {
                this.openPopup();
            }
        });

        // Mouseout - cerrar popup si no está fijado
        layer.on("mouseout", function() {
            if (!popupFijado) {
                this.closePopup();
            }
        });

        // Click - fijar popup con contenido completo
        layer.on("click", function() {
            popupFijado = true;
            this.setPopupContent(contenidoCompleto);
            this.openPopup();
        });

        // Al cerrar popup, volver al estado normal
        layer.on("popupclose", function() {
            popupFijado = false;
            this.setPopupContent(contenidoSimple);
        });

        // Método auxiliar para zoom temporal
        layer.abrirTemporal = function() {
            popupFijado = false;
            this.setPopupContent(contenidoCompleto);
            this.openPopup();
        };
    }

    // ============================================
    // CONSTRUIR LISTA DE CAPAS EN EL PANEL
    // ============================================
    function construirLista() {
        listaCapas.innerHTML = "";

        Object.keys(capas).forEach(apartado => {
            const divBloque = document.createElement("div");
            divBloque.className = "map-bloque";

            // Título del apartado
            const h4 = document.createElement("h4");
            h4.innerHTML = `<i class="fas fa-folder-open"></i> ${apartado}`;
            divBloque.appendChild(h4);

            // Botones del apartado
            const btnContainer = document.createElement("div");
            btnContainer.className = "map-bloque-btns";
            
            const btnApagar = document.createElement("button");
            btnApagar.className = "map-bloque-btn";
            btnApagar.innerHTML = '<i class="fas fa-eye-slash"></i> Apagar todo';
            btnApagar.onclick = () => toggleApartado(apartado, false);
            
            const btnEncender = document.createElement("button");
            btnEncender.className = "map-bloque-btn";
            btnEncender.innerHTML = '<i class="fas fa-eye"></i> Encender todo';
            btnEncender.onclick = () => toggleApartado(apartado, true);
            
            btnContainer.appendChild(btnApagar);
            btnContainer.appendChild(btnEncender);
            divBloque.appendChild(btnContainer);

            // Items individuales por bloque
            Object.keys(capas[apartado]).forEach(bloque => {
                const grupo = capas[apartado][bloque];
                
                const divItem = document.createElement("div");
                divItem.className = "map-item";

                const chk = document.createElement("input");
                chk.type = "checkbox";
                chk.checked = true;
                chk.addEventListener("change", () => {
                    if (chk.checked) {
                        grupo.addTo(map);
                    } else {
                        map.removeLayer(grupo);
                    }
                });

                const label = document.createElement("span");
                label.textContent = bloque;
                label.addEventListener("click", () => {
                    // Recopilar features del grupo
                    const features = [];
                    grupo.eachLayer(layer => features.push(layer));
                    if (!features.length) return;

                    // Asegurar que el grupo esté visible
                    if (!map.hasLayer(grupo)) {
                        grupo.addTo(map);
                        chk.checked = true;
                    }

                    // Hacer zoom al grupo
                    const featureGroup = L.featureGroup(features);
                    const bounds = featureGroup.getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
                    }

                    // Abrir popup temporal del primer elemento
                    if (features[0] && features[0].abrirTemporal) {
                        features[0].abrirTemporal();
                    }

                    // En móvil, cerrar el panel
                    if (window.innerWidth <= 768) {
                        cerrarPanel();
                    }
                });

                divItem.appendChild(chk);
                divItem.appendChild(label);
                divBloque.appendChild(divItem);
            });

            listaCapas.appendChild(divBloque);
        });
    }

    function toggleApartado(apartado, encender) {
        if (!capas[apartado]) return;
        Object.keys(capas[apartado]).forEach(bloque => {
            const grupo = capas[apartado][bloque];
            if (encender) {
                grupo.addTo(map);
            } else {
                map.removeLayer(grupo);
            }
            // Actualizar checkbox correspondiente
            const items = document.querySelectorAll(".map-item");
            items.forEach(item => {
                const span = item.querySelector("span");
                if (span && span.textContent === bloque) {
                    const chk = item.querySelector("input");
                    if (chk) chk.checked = encender;
                }
            });
        });
    }

    // ============================================
    // CARGA DEL ARCHIVO CSV
    // ============================================
    function cargarDatos() {
        const rutaCSV = "../../../data/diagnosticos/pozos/datos.csv";

        Papa.parse(rutaCSV, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log(`📊 CSV cargado: ${results.data.length} registros`);
                
                results.data.forEach(row => {
                    const wkt = row.WKT?.trim();
                    const apartado = row.Apartado?.trim() || "Otros";
                    const bloque = row.Bloque?.trim() || "Sin bloque";
                    const nombreIcono = row.Icono?.trim();

                    if (!wkt) return;
                    const geom = parseWKT(wkt);
                    if (!geom) return;

                    // Crear estructura de capas si no existe
                    if (!capas[apartado]) capas[apartado] = {};
                    if (!capas[apartado][bloque]) {
                        capas[apartado][bloque] = L.layerGroup().addTo(map);
                    }

                    let layer = null;
                    let lat = 0, lng = 0;

                    if (geom.type === "POINT") {
                        lat = geom.coords[0];
                        lng = geom.coords[1];
                        const icono = nombreIcono ? obtenerIcono(nombreIcono) : iconoPorDefecto;
                        layer = L.marker([lat, lng], { icon: icono });
                    } else if (geom.type === "LINESTRING") {
                        const color = row.Icono || "#bb9358";
                        layer = L.polyline(geom.coords, { color: color, weight: 5 });
                        // Estimar centro para popup
                        const bounds = L.latLngBounds(geom.coords);
                        const center = bounds.getCenter();
                        lat = center.lat;
                        lng = center.lng;
                    } else if (geom.type === "POLYGON") {
                        const color = row.Icono || "#bb9358";
                        layer = L.polygon(geom.coords, {
                            color: "#000000",
                            fillColor: color,
                            fillOpacity: 0.55,
                            weight: 2
                        });
                        const bounds = L.latLngBounds(geom.coords);
                        const center = bounds.getCenter();
                        lat = center.lat;
                        lng = center.lng;
                    }

                    if (layer) {
                        // Bind popup
                        const popupContent = `<b>${row.Nombre || "Sin nombre"}</b><br>${row.Descripción || ""}`;
                        layer.bindPopup(popupContent);
                        
                        // Aplicar interacciones
                        aplicarInteracciones(layer, row, lat, lng);
                        
                        layer.addTo(capas[apartado][bloque]);
                        capasGlobales.push(layer);
                    }
                });

                construirLista();
                zoomAutomatico();
                cargarPoligonoMunicipio();
            },
            error: function(error) {
                console.error("❌ Error cargando CSV:", error);
            }
        });
    }

    // ============================================
    // ZOOM AUTOMÁTICO
    // ============================================
    function zoomAutomatico() {
        if (capasGlobales.length === 0) return;
        const group = L.featureGroup(capasGlobales);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [30, 30] });
        }
    }

    // ============================================
    // CARGAR POLÍGONO DEL MUNICIPIO
    // ============================================
    function cargarPoligonoMunicipio() {
        const rutaGeoJSON = "../../../data/diagnosticos/pozos/poligono_ixtapaluca.json";
        
        fetch(rutaGeoJSON)
            .then(res => {
                if (!res.ok) throw new Error("No se encontró el archivo GeoJSON");
                return res.json();
            })
            .then(geojson => {
                const poligono = L.geoJSON(geojson, {
                    style: {
                        color: '#9D2449',
                        weight: 3,
                        fillColor: '#9D2449',
                        fillOpacity: 0.15
                    }
                }).addTo(map);
                poligono.bringToBack();
                console.log("✅ Polígono del municipio cargado");
            })
            .catch(err => console.warn("⚠️ No se pudo cargar el polígono:", err));
    }

    // ============================================
    // FUNCIONES DEL PANEL (CONTROLES)
    // ============================================
    function cerrarPanel() {
        const panel = document.getElementById("mapPanel");
        panel.classList.add("oculto");
    }

    function abrirPanel() {
        const panel = document.getElementById("mapPanel");
        panel.classList.remove("oculto");
    }

    window.togglePanel = function() {
        const panel = document.getElementById("mapPanel");
        panel.classList.toggle("oculto");
    };

    // ============================================
    // EVENTOS DE BOTONES
    // ============================================
    function initEventos() {
        // Botón General (Apagar/Encender todo)
        const btnGeneral = document.getElementById("btnGeneral");
        let todoEncendido = true;
        
        btnGeneral.addEventListener("click", () => {
            todoEncendido = !todoEncendido;
            
            Object.keys(capas).forEach(apartado => {
                Object.keys(capas[apartado]).forEach(bloque => {
                    const grupo = capas[apartado][bloque];
                    if (todoEncendido) {
                        grupo.addTo(map);
                    } else {
                        map.removeLayer(grupo);
                    }
                });
            });
            
            // Actualizar checkboxes
            const checkboxes = document.querySelectorAll(".map-item input[type='checkbox']");
            checkboxes.forEach(chk => {
                chk.checked = todoEncendido;
            });
            
            btnGeneral.innerHTML = todoEncendido ? '<i class="fas fa-power-off"></i> Apagar todo' : '<i class="fas fa-play"></i> Encender todo';
        });
        
        // Botón centrar mapa
        const btnCentro = document.getElementById("btnCentroMapa");
        btnCentro.addEventListener("click", () => {
            map.setView([19.35369, -98.79454], 12);
        });
        
        // Botón flotante para móvil
        const btnFlotante = document.getElementById("btnFlotantePanel");
        btnFlotante.addEventListener("click", () => {
            abrirPanel();
        });
        
        // Botón toggle del panel
        const btnToggle = document.getElementById("btnTogglePanel");
        btnToggle.addEventListener("click", () => {
            togglePanel();
        });
        
        // Cerrar panel automático en móvil al cargar
        if (window.innerWidth <= 768) {
            cerrarPanel();
        }
        
        // Reaccionar a cambios de tamaño
        window.addEventListener("resize", () => {
            if (window.innerWidth > 768) {
                abrirPanel();
            }
        });
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    function init() {
        initEventos();
        cargarDatos();
    }

    init();
});