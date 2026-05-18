/**
 * mapa_interno.js - Mapa interactivo de pozos e infraestructura hidráulica
 * Versión independiente - SIN PANEL DE CAPAS
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
    const iconosCache = {};
    const capasGlobales = [];   // Todos los layers individuales

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
    }

    // ============================================
    // CARGAR POLÍGONO DEL MUNICIPIO DESDE GEOJSON
    // ============================================
    function cargarPoligonoMunicipio() {
        // 🔧 Ruta CORREGIDA - misma que usaste y funcionó
        const rutaGeoJSON = "../../../../data/diagnosticos/pozos/poligono_ixtapaluca.json";
        
        console.log("🔍 Cargando polígono desde:", rutaGeoJSON);
        
        fetch(rutaGeoJSON)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}: No se encontró el archivo`);
                return res.json();
            })
            .then(geojson => {
                if (geojson && geojson.features && geojson.features.length > 0) {
                    const poligono = L.geoJSON(geojson, {
                        style: {
                            color: '#9D2449',
                            weight: 3,
                            fillColor: '#9D2449',
                            fillOpacity: 0.15
                        }
                    }).addTo(map);
                    
                    poligono.bringToBack();
                    console.log("✅ Polígono del municipio cargado desde GeoJSON");
                } else {
                    console.warn("⚠️ El GeoJSON no contiene features válidas");
                }
            })
            .catch(err => console.error("❌ Error cargando el polígono GeoJSON:", err));
    }

    // ============================================
    // CARGA DEL ARCHIVO CSV
    // ============================================
    function cargarDatos() {
        // 🔧 Misma ruta corregida
        const rutaCSV = "../../../../data/diagnosticos/pozos/datos.csv";
        
        console.log("🔍 Buscando CSV en:", rutaCSV);

        Papa.parse(rutaCSV, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log(`📊 CSV cargado: ${results.data.length} registros`);
                
                results.data.forEach(row => {
                    const wkt = row.WKT?.trim();
                    const nombreIcono = row.Icono?.trim();

                    if (!wkt) return;
                    const geom = parseWKT(wkt);
                    if (!geom) return;

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
                        aplicarInteracciones(layer, row, lat, lng);
                        layer.addTo(map);
                        capasGlobales.push(layer);
                    }
                });

                if (capasGlobales.length > 0) {
                    zoomAutomatico();
                }
            },
            error: function(error) {
                console.error("❌ Error cargando CSV:", error);
                console.log("⚠️ El CSV no se encontró, pero el polígono igual se cargará");
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
    // EVENTOS DE BOTONES
    // ============================================
    function initEventos() {
        const btnCentro = document.getElementById("btnCentroMapa");
        if (btnCentro) {
            btnCentro.addEventListener("click", () => {
                map.setView([19.35369, -98.79454], 12);
            });
        }
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    function init() {
        initEventos();
        cargarPoligonoMunicipio();  // 🔧 Cargar polígono primero (independiente)
        cargarDatos();               // 🔧 Luego intentar cargar CSV (no bloquea)
    }

    init();
});