document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización del Mapa
    const map = L.map('map', {
        zoomControl: false // Movemos el control para que no estorbe el cuadro
    }).setView([40.7128, -74.0060], 10); // NY por defecto

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Definición de capa base OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Referencias a UI
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const downloadStlBtn = document.getElementById('download-stl-btn');
    const txtStlBtn = document.getElementById('txt-stl-btn');
    
    // Controles Fase 2
    const totalSizeXInput = document.getElementById('total-size-x');
    const totalSizeYInput = document.getElementById('total-size-y');
    const bedSizeInput = document.getElementById('bed-size');
    const zScaleInput = document.getElementById('z-scale-input');
    const autoZVal = document.getElementById('auto-z-val');
    const btnApplyAutoz = document.getElementById('btn-apply-autoz');
    
    // Configuración Base
    const invertColorsCheckbox = document.getElementById('invert-colors');
    const maxHeightInput = document.getElementById('max-height');
    const outputInfo = document.getElementById('output-info');
    const loader = document.getElementById('loader');
    
    const canvas = document.getElementById('heightmap-canvas');
    const ctx = canvas.getContext('2d');

    const locationSearch = document.getElementById('location-search');
    const btnSearch = document.getElementById('btn-search');
    
    // Scale Elements
    const baseSizeInput = document.getElementById('base-size');
    const zPrintMm = document.getElementById('z-print-mm');
    const lblBase = document.getElementById('lbl-base');
    const lblBase2 = document.getElementById('lbl-base2');

    // Inicialmente habilitado si usa API libre
    generateBtn.disabled = false;

    // Buscador de ubicaciones
    async function searchLocation() {
        const query = locationSearch.value.trim();
        if (!query) return;
        
        btnSearch.disabled = true;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                // flyTo hace una animación suave. Zoom 12 suele ir bien para montañas/ciudades
                map.flyTo([lat, lon], 12);
            } else {
                alert('No se encontraron resultados para: ' + query);
            }
        } catch (error) {
            console.error(error);
            alert('Error al conectar con la búsqueda de ubicaciones.');
        } finally {
            btnSearch.disabled = false;
        }
    }

    btnSearch.addEventListener('click', searchLocation);
    locationSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchLocation();
    });

    // --- Calculadora de Escala Z y Forma de Puzle ---
    function updateScaleInfo() {
        const selector = document.getElementById('selector-square');
        const mapContainer = document.getElementById('map');
        
        // --- Redimensionar selector según Layout elegido ---
        const szX = parseFloat(totalSizeXInput.value) || 600;
        const szY = parseFloat(totalSizeYInput.value) || 600;
        let maxPx = 300;
        if (szX >= szY) {
            selector.style.width = maxPx + 'px';
            selector.style.height = (maxPx * (szY / szX)) + 'px';
        } else {
            selector.style.height = maxPx + 'px';
            selector.style.width = (maxPx * (szX / szY)) + 'px';
        }

        const rect = selector.getBoundingClientRect();
        const mapRect = mapContainer.getBoundingClientRect();
        
        // Evitamos división por cero si rect aún no se renderizó
        if (rect.width === 0) return;

        // Medir la distancia real en metros del ancho del cuadrado en el centro de la pantalla
        const centerPointW = L.point(rect.left - mapRect.left, rect.top - mapRect.top + rect.height / 2);
        const centerPointE = L.point(rect.right - mapRect.left, rect.top - mapRect.top + rect.height / 2);
        
        const centerW = map.containerPointToLatLng(centerPointW);
        const centerE = map.containerPointToLatLng(centerPointE);
        
        const widthMeters = map.distance(centerW, centerE);
        
        // Guardamos widthMeters globalmente para usarlo en la malla
        window.currentMapWidthMeters = widthMeters;
        
        // Recalcular el Z óptimo visualmente si tenemos lecturas de terreno
        calculateHeuristicAutoZ();
    }

    function calculateHeuristicAutoZ() {
        if (!window.lastDemLocalMax) return;
        const szX = parseFloat(totalSizeXInput.value) || 600;
        const widthMeters = window.currentMapWidthMeters || 100000;
        
        // Escala estricta 1:1, asumiendo que szX mapea al ancho en metros
        let realLifeMaxZ_Mm = window.lastDemLocalMax * (szX / widthMeters); 
        
        let km = widthMeters / 1000;
        let exageration = Math.max(1, Math.log10(km) * 10);
        if (km < 5) exageration = 1.5;
        if (km > 1000) exageration = 30;
        
        let autoZ = Math.round(realLifeMaxZ_Mm * exageration);
        if (autoZ < 3) autoZ = 3;
        if (autoZ > 60) autoZ = 60; // Max límite sano
        
        window.currentAutoZ = autoZ;
        autoZVal.innerText = `${autoZ} mm`;
    }

    btnApplyAutoz.addEventListener('click', () => {
        if (window.currentAutoZ) {
            zScaleInput.value = window.currentAutoZ;
            // Animacion boton feedback
            const prevText = btnApplyAutoz.innerText;
            btnApplyAutoz.innerText = "¡Aplicado!";
            setTimeout(() => btnApplyAutoz.innerText = prevText, 1500);
        } else {
            alert("Primero dale a 'Generar Heightmap' en una zona para analizar su pico altimétrico.");
        }
    });

    // Attach listeners a los eventos del mapa y los inputs
    map.on('move', updateScaleInfo);
    map.on('zoom', updateScaleInfo);
    window.addEventListener('resize', updateScaleInfo);
    totalSizeXInput.addEventListener('input', updateScaleInfo);
    totalSizeYInput.addEventListener('input', updateScaleInfo);
    
    // Llamada inicial para poblar el texto cuando se estabilice Leaflet
    setTimeout(updateScaleInfo, 100);

    // 2. Lógica Core de Generación
    generateBtn.addEventListener('click', async () => {
        // Render
        const maxHeight = 4000; // No importa tanto, lo reescalamos nosotros en el ZIP.
        const invert = invertColorsCheckbox.checked;

        // Bloquear UI
        generateBtn.disabled = true;
        loader.classList.remove('hidden');
        outputInfo.classList.add('hidden');
        downloadBtn.classList.add('hidden');

        try {
            await processHeightmap(maxHeight, invert);
        } catch (error) {
            console.error(error);
            alert('Error al generar la imagen. Revisa tu conexión.\n\nDetalles: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            loader.classList.add('hidden');
        }
    });

    // Descarga del PNG
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `heightmap_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    });

    // 3. Procesamiento y Stitching de Tiles
    async function processHeightmap(maxHeight, invert) {
        // Encontrar Bounding Box real del div cuadrado superpuesto (selector-square)
        const selector = document.getElementById('selector-square');
        const mapContainer = document.getElementById('map');
        const rect = selector.getBoundingClientRect();
        const mapRect = mapContainer.getBoundingClientRect();
        
        // Coordenadas absolutas corregidas restando el offset del contenedor del mapa (Sidebar de 400px)
        const nwPoint = L.point(rect.left - mapRect.left, rect.top - mapRect.top);
        const sePoint = L.point(rect.right - mapRect.left, rect.bottom - mapRect.top);

        // Convertir puntos locales de pantalla a LatLng
        const nwLatLng = map.containerPointToLatLng(nwPoint);
        const seLatLng = map.containerPointToLatLng(sePoint);
        const bounds = L.latLngBounds(nwLatLng, seLatLng);

        // Calcular Zoom ideal masivo para alcanzar cols * 1024px de resolución raw (para piezas alta resolución)
        let currentZoom = map.getZoom();
        let targetZoom = currentZoom;
        
        const totalSizeX = parseFloat(totalSizeXInput.value) || 600;
        const bedSizeMm = parseFloat(bedSizeInput.value) || 200;
        const cols = Math.ceil(totalSizeX / bedSizeMm);
        const desiredRawPixels = cols * 1024;
        
        while (targetZoom <= 15) { // 15 es el máximo de Mapbox Terrain-RGB
            let nw = map.project(nwLatLng, targetZoom);
            let se = map.project(seLatLng, targetZoom);
            let width = se.x - nw.x;
            if (width >= desiredRawPixels || targetZoom >= 15) break; 
            targetZoom++;
        }

        console.log(`Pidiendo tiles a Zoom: ${targetZoom}`);

        // Proyección a píxeles globales en el targetZoom (FORZAMOS ENTEROS para evitar errores de sub-pixel)
        const NWele = map.project(nwLatLng, targetZoom);
        const SEele = map.project(seLatLng, targetZoom);

        const pWidth = Math.ceil(SEele.x - NWele.x);
        const pHeight = Math.ceil(SEele.y - NWele.y);

        // Limites de las tiles a pedir
        const tMinX = Math.floor(NWele.x / 256);
        const tMaxX = Math.floor(SEele.x / 256);
        const tMinY = Math.floor(NWele.y / 256);
        const tMaxY = Math.floor(SEele.y / 256);

        // Canvas interno (offscreen) para dibujar y recortar los tiles
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = (tMaxX - tMinX + 1) * 256;
        compositeCanvas.height = (tMaxY - tMinY + 1) * 256;
        const compCtx = compositeCanvas.getContext('2d', { willReadFrequently: true });
        
        // Cargar todas las imágenes requeridas
        const promises = [];
        for (let x = tMinX; x <= tMaxX; x++) {
            for (let y = tMinY; y <= tMaxY; y++) {
                promises.push(loadTile(x, y, targetZoom).then(img => {
                    const dx = (x - tMinX) * 256;
                    const dy = (y - tMinY) * 256;
                    compCtx.drawImage(img, dx, dy);
                }).catch(e => {
                    // Si falla un tile, dibujamos el valor exacto de Nivel del mar (RGB 128,0,0) -> 0m
                    const dx = (x - tMinX) * 256;
                    const dy = (y - tMinY) * 256;
                    compCtx.fillStyle = "rgb(128, 0, 0)"; 
                    compCtx.fillRect(dx, dy, 256, 256);
                }));
            }
        }

        await Promise.all(promises);

        // Recortar la parte exacta que corresponde al Bounding Box
        const startX = Math.floor(NWele.x - (tMinX * 256));
        const startY = Math.floor(NWele.y - (tMinY * 256));
        const cropData = compCtx.getImageData(startX, startY, pWidth, pHeight);

        // Process Heights & Grayscale Map
        const processingResult = applyHeightMapping(cropData, maxHeight, invert);
        const processedImageData = processingResult.imgData;

        // Dibujar el resultado en un canvas temporal del tamaño exacto cortado
        const exactCanvas = document.createElement('canvas');
        exactCanvas.width = pWidth;
        exactCanvas.height = pHeight;
        exactCanvas.getContext('2d').putImageData(processedImageData, 0, 0);
        
        // Guardar para poder recortar pedazos en PNG grises luego si el usuario los pide
        window.lastExactCanvas = exactCanvas;

        // Finalmente, dibujar escalado en el canvas final de 1024x1024
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Desactiva el antialiasing para mantener bordes filosos si es que no reescalamos un múltiplo exacto
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(exactCanvas, 0, 0, canvas.width, canvas.height);

        // Guardar variables globales para la UI
        window.lastDemRawData = processingResult.rawElevations;
        window.lastDemLocalMax = processingResult.localMax;
        window.lastDemPixWidth = pWidth;
        window.lastDemPixHeight = pHeight;
        window.lastDemNWele = NWele;
        window.lastDemSEele = SEele;
        window.lastDemTargetZoom = targetZoom;

        // Calcular Heurística Auto-Z ahora que ya sabemos la altitud máxima local
        calculateHeuristicAutoZ();
        
        // Actualizar UI HTML
        downloadBtn.classList.remove('hidden');
        downloadStlBtn.classList.remove('hidden');
        outputInfo.classList.remove('hidden');
        
        const widthMeters = window.currentMapWidthMeters || 100000;
        outputInfo.innerHTML = `RAW Size: ${pWidth}x${pHeight} | Área Real: ${Math.round(widthMeters/1000)} km <br> 
        <strong>Máxima altura encontrada: ${Math.round(processingResult.localMax)} m</strong>`;
    }

    async function generateAssemblyGuide(NWele, SEele, targetZoom, totalSizeX, totalSizeY, bedSizeMm) {
        const tMinX = Math.floor(NWele.x / 256);
        const tMaxX = Math.floor(SEele.x / 256);
        const tMinY = Math.floor(NWele.y / 256);
        const tMaxY = Math.floor(SEele.y / 256);

        const pw = Math.ceil(SEele.x - NWele.x);
        const ph = Math.ceil(SEele.y - NWele.y);

        const canvas = document.createElement('canvas');
        canvas.width = (tMaxX - tMinX + 1) * 256;
        canvas.height = (tMaxY - tMinY + 1) * 256;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const promises = [];
        for (let x = tMinX; x <= tMaxX; x++) {
            for (let y = tMinY; y <= tMaxY; y++) {
                promises.push(new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => {
                        const dx = (x - tMinX) * 256;
                        const dy = (y - tMinY) * 256;
                        ctx.drawImage(img, dx, dy);
                        resolve();
                    };
                    img.onerror = () => resolve(); // Si falla OSM, se queda blanco y continua
                    img.src = `https://a.tile.openstreetmap.org/${targetZoom}/${x}/${y}.png`;
                }));
            }
        }

        await Promise.all(promises);

        const startX = Math.floor(NWele.x - (tMinX * 256));
        const startY = Math.floor(NWele.y - (tMinY * 256));
        
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = pw;
        cropCanvas.height = ph;
        const cropCtx = cropCanvas.getContext('2d');
        
        cropCtx.drawImage(canvas, startX, startY, pw, ph, 0, 0, pw, ph);
        
        // --- Overlay Cuadrícula ---
        const cols = Math.ceil(totalSizeX / bedSizeMm);
        const rows = Math.ceil(totalSizeY / bedSizeMm);
        
        cropCtx.strokeStyle = "rgba(255, 0, 0, 0.75)";
        cropCtx.lineWidth = Math.max(2, pw / 400); 
        
        const fontSize = Math.max(12, Math.floor(pw / (cols * 4)));
        cropCtx.font = `bold ${fontSize}px Arial`;
        cropCtx.textAlign = "center";
        cropCtx.textBaseline = "middle";

        let curY = 0;
        for (let r = 0; r < rows; r++) {
            let pieceH_Mm = (r === rows - 1) ? (totalSizeY - r * bedSizeMm) : bedSizeMm;
            if (pieceH_Mm <= 0) pieceH_Mm = bedSizeMm;
            let pHeight_Px = (pieceH_Mm / totalSizeY) * ph;
            
            let curX = 0;
            for (let c = 0; c < cols; c++) {
                let pieceW_Mm = (c === cols - 1) ? (totalSizeX - c * bedSizeMm) : bedSizeMm;
                if (pieceW_Mm <= 0) pieceW_Mm = bedSizeMm;
                let pWidth_Px = (pieceW_Mm / totalSizeX) * pw;
                
                cropCtx.strokeRect(curX, curY, pWidth_Px, pHeight_Px);
                
                const textX = curX + pWidth_Px / 2;
                const textY = curY + pHeight_Px / 2;
                const text = `F${r+1}-C${c+1}`;
                
                const metrics = cropCtx.measureText(text);
                const tw = metrics.width + 10;
                const th = fontSize * 1.3;
                
                cropCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
                cropCtx.fillRect(textX - tw/2, textY - th/2, tw, th);
                
                cropCtx.fillStyle = "red";
                cropCtx.fillText(text, textX, textY);
                
                curX += pWidth_Px;
            }
            curY += pHeight_Px;
        }
        
        return new Promise(resolve => {
            cropCanvas.toBlob(blob => {
                resolve(blob);
            }, "image/jpeg", 0.90);
        });
    }

    async function getGrayscalePieces(totalSizeX, totalSizeY, bedSizeMm) {
        if (!window.lastExactCanvas) return [];
        const pw = window.lastDemPixWidth;
        const ph = window.lastDemPixHeight;
        const rows = Math.ceil(totalSizeY / bedSizeMm);
        const cols = Math.ceil(totalSizeX / bedSizeMm);
        
        const pieces = [];
        let curY = 0;
        for (let r = 0; r < rows; r++) {
            let pieceH_Mm = (r === rows - 1) ? (totalSizeY - r * bedSizeMm) : bedSizeMm;
            if (pieceH_Mm <= 0) pieceH_Mm = bedSizeMm;
            let pHeight_Px = (pieceH_Mm / totalSizeY) * ph;
            
            let curX = 0;
            for (let c = 0; c < cols; c++) {
                let pieceW_Mm = (c === cols - 1) ? (totalSizeX - c * bedSizeMm) : bedSizeMm;
                if (pieceW_Mm <= 0) pieceW_Mm = bedSizeMm;
                let pWidth_Px = (pieceW_Mm / totalSizeX) * pw;
                
                const cCanvas = document.createElement('canvas');
                cCanvas.width = 1024;
                cCanvas.height = 1024;
                const cCtx = cCanvas.getContext('2d');
                // Desactivar suavizado exagerado para no perder detalles topográficos al escalar
                cCtx.imageSmoothingEnabled = true;
                cCtx.imageSmoothingQuality = 'high';
                cCtx.drawImage(window.lastExactCanvas, curX, curY, pWidth_Px, pHeight_Px, 0, 0, 1024, 1024);
                
                const blob = await new Promise(res => cCanvas.toBlob(res, "image/png"));
                // Importante: La numeración sigue el estándar humano (1 a rows, 1 a cols)
                pieces.push({ name: `mapa_Fila${r+1}_Col${c+1}.png`, blob });
                
                curX += pWidth_Px;
            }
            curY += pHeight_Px;
        }
        return pieces;
    }

    // Exportar ZIP con 3D Models (AHORA VÍA BACKEND DOCKER)
    downloadStlBtn.addEventListener('click', async () => {
        if (!window.lastDemRawData) return;
        
        txtStlBtn.innerText = "Reuniendo mapa visual...";
        downloadStlBtn.disabled = true;

        const totalSizeX = parseFloat(totalSizeXInput.value) || 600;
        const totalSizeY = parseFloat(totalSizeYInput.value) || 600;
        const bedSizeMm = parseFloat(bedSizeInput.value) || 200;
        const zFinalMm = parseFloat(zScaleInput.value) || 15;
        
        // Construir la Guia de Montaje PDF/JPG por debajo:
        let guideBlob = null;
        try {
            guideBlob = await generateAssemblyGuide(
                window.lastDemNWele, window.lastDemSEele, window.lastDemTargetZoom,
                totalSizeX, totalSizeY, bedSizeMm
            );
        } catch(e) {
            console.warn("No se pudo sacar imagen de OpenStreetMap: ", e);
        }
        
        txtStlBtn.innerText = "Extrayendo PNGs Escala de Grises...";
        const grayscalePieces = await getGrayscalePieces(totalSizeX, totalSizeY, bedSizeMm);
        
        txtStlBtn.innerText = "Calculando Mallas y Puzles... (Toma minutos)";
        
        const pixWidth = window.lastDemPixWidth;
        const pixHeight = window.lastDemPixHeight;

        const formData = new FormData();
        const meta = {
            totalSizeX, totalSizeY, bedSizeMm, zFinalMm, 
            localMaxElev: window.lastDemLocalMax,
            pixWidth, pixHeight
        };
        formData.append('data', JSON.stringify(meta));
        formData.append('elevations', new Blob([window.lastDemRawData.buffer], { type: 'application/octet-stream' }));
        if (guideBlob) {
            formData.append('guideImage', guideBlob, "Guia_Montaje.jpg");
        }
        
        for (let p of grayscalePieces) {
             formData.append('grayscalePieces', p.blob, p.name);
        }

        fetch('http://localhost:3000/api/create-job', {
            method: 'POST',
            body: formData
        }).then(async res => {
            if (!res.ok) throw new Error("Fallo en la comunicación con el procesador 3D");
            
            const jobId = res.headers.get('X-Job-Id');
            const blob = await res.blob();
            
            saveAs(blob, `Mapa_Guia_${new Date().getTime()}.zip`);
            txtStlBtn.innerText = "Descargar Guía Visual (.ZIP)";
            downloadStlBtn.disabled = false;
            
            if (jobId) {
                openJobDashboard(jobId);
            }
            
        }).catch(err => {
            console.error(err);
            alert("Fallo al generar 3D en el Backend: " + err.message);
            txtStlBtn.innerText = "Error (Intentar de nuevo)";
            downloadStlBtn.disabled = false;
        });
    });

    // Promesa para cargar imagen desde AWS Mapzen Terrarium
    function loadTile(x, y, z) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error('Fallo tile. Rehusado.'));
            img.src = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
        });
    }

    // Fórmula RGB a Grayscale con clamping (Mapzen Terrarium)
    function applyHeightMapping(imgData, maxHeight, invert) {
        const data = imgData.data;
        const width = imgData.width;
        const heightImg = imgData.height;
        const rawElevations = new Float32Array(width * heightImg);
        let localMax = 0;
        
        let pixelIndex = 0;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            // Fórmula AWS Mapzen: elevacion = (R * 256 + G + B / 256) - 32768
            let height = (r * 256 + g + b / 256) - 32768;

            if (height > localMax) localMax = height;
            
            rawElevations[pixelIndex] = height;
            pixelIndex++;

            // Clamp (truncados a límites para el render final gris)
            if (height < 0) height = 0; // Nivel del mar o inferior
            if (height > maxHeight) height = maxHeight;

            // Escala (0 a 1)
            let ratio = height / maxHeight;

            // Por defecto: 0m = Blanco(255), Max = Negro(0)
            let gray = Math.floor((1 - ratio) * 255);

            // Si invertimos: 0m = Negro(0), Max = Blanco(255)
            if (invert) {
                gray = Math.floor(ratio * 255);
            }

            data[i] = gray;     // R
            data[i+1] = gray;   // G
            data[i+2] = gray;   // B
            data[i+3] = 255;    // A
        }
        return { imgData, localMax, rawElevations };
    }

    const creatorView = document.getElementById('creator-view');
    const downloaderView = document.getElementById('downloader-view');
    const jobsView = document.getElementById('jobs-view');
    
    const btnBackCreator = document.getElementById('btn-back-creator');
    const btnBackCreatorFromJobs = document.getElementById('btn-back-creator-from-jobs');
    const btnViewJobs = document.getElementById('btn-view-jobs');
    
    const jobGuideImg = document.getElementById('job-guide-img');
    const piecesGrid = document.getElementById('pieces-grid');
    const jobsList = document.getElementById('jobs-list');

    function showCreatorView() {
        downloaderView.classList.add('hidden');
        jobsView.classList.add('hidden');
        creatorView.classList.remove('hidden');
        map.invalidateSize();
    }

    btnBackCreator.addEventListener('click', showCreatorView);
    btnBackCreatorFromJobs.addEventListener('click', showCreatorView);

    btnViewJobs.addEventListener('click', async () => {
        creatorView.classList.add('hidden');
        downloaderView.classList.add('hidden');
        jobsView.classList.remove('hidden');
        
        jobsList.innerHTML = "Cargando trabajos locales...";
        
        try {
            const res = await fetch('http://localhost:3000/api/jobs');
            if (!res.ok) throw new Error("Falla al cargar listado");
            const jobs = await res.json();
            
            if (jobs.length === 0) {
                jobsList.innerHTML = "<p>No hay mapas creados todavía.</p>";
                return;
            }
            
            jobsList.innerHTML = "";
            jobs.forEach(job => {
                const div = document.createElement('div');
                div.className = 'card';
                div.style = "padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; background: var(--panel-bg);";
                div.onmouseover = () => div.style.background = 'var(--hover-bg, #334155)';
                div.onmouseout = () => div.style.background = 'var(--panel-bg)';
                
                const d = new Date(job.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
                
                div.innerHTML = `
                    <div>
                        <div style="font-weight: 600; font-size: 1.1rem; color: var(--accent-color);">Mapa de ${job.metadata.totalSizeX}x${job.metadata.totalSizeY} mm</div>
                        <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">Z Final: ${job.metadata.zFinalMm}mm | Cama: ${job.metadata.bedSizeMm}mm</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px;">${d}</div>
                        <span style="font-size: 0.85rem; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--accent-color); color: var(--accent-color);">Cargar STLs</span>
                    </div>
                `;
                
                div.onclick = () => {
                    jobsView.classList.add('hidden');
                    openJobDashboard(job.id);
                };
                
                jobsList.appendChild(div);
            });
            
        } catch(e) {
            jobsList.innerHTML = "<p>Error de conexión con Backend de Docker.</p>";
        }
    });

    async function openJobDashboard(jobId) {
        creatorView.classList.add('hidden');
        downloaderView.classList.remove('hidden');
        
        piecesGrid.innerHTML = "Cargando matriz...";
        jobGuideImg.src = "";
        
        try {
            const res = await fetch(`http://localhost:3000/api/job/${jobId}`);
            if (!res.ok) throw new Error("Job Expired or Not Found");
            const data = await res.json();
            
            if (data.guideImage) {
                jobGuideImg.src = data.guideImage;
            } else {
                jobGuideImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23334155'/%3E%3Ctext x='50' y='50' fill='white' text-anchor='middle' dominant-baseline='middle'%3ESin Guía%3C/text%3E%3C/svg%3E";
            }
            
            piecesGrid.innerHTML = "";
            for (let r = 0; r < data.rows; r++) {
                for (let c = 0; c < data.cols; c++) {
                    const humanRow = data.rows - r;
                    const humanCol = c + 1;
                    
                    const btn = document.createElement('button');
                    btn.className = 'piece-btn';
                    btn.innerHTML = `
                        <span class="piece-icon">🧩</span>
                        Fila ${humanRow} <br>
                        Columna ${humanCol}
                    `;
                    
                    btn.onclick = () => {
                        window.location.href = `http://localhost:3000/api/generate-piece/${jobId}/${r}/${c}`;
                    };
                    
                    piecesGrid.appendChild(btn);
                }
            }
        } catch (e) {
            piecesGrid.innerHTML = "Error cargando Job.";
        }
    }
});
