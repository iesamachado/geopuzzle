const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { generate3DMeshes } = require('./mesher');

const app = express();

// Permite peticiones CORS desde el frontend
app.use(cors());

// Aceptar payloads binarios grandes (Elevations Float32Array puede pesar ~5MB-10MB)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // Límite de 100MB
});

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JSZip = require('jszip');

// Asegurar carpeta jobs
const JOBS_DIR = path.join(__dirname, 'jobs');
if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });

app.post('/api/create-job', upload.fields([
    { name: 'elevations', maxCount: 1 },
    { name: 'guideImage', maxCount: 1 },
    { name: 'grayscalePieces', maxCount: 500 }
]), async (req, res) => {
    console.log("Creando nuevo Job On-Demand...");
    try {
        const metadata = JSON.parse(req.body.data);
        const floatBuffer = req.files['elevations'][0].buffer;
        
        let guideBuffer = null;
        if (req.files['guideImage']) {
            guideBuffer = req.files['guideImage'][0].buffer;
        }
        
        let piecesPngs = req.files['grayscalePieces'] || [];
        
        // 1. Guardar Job en disco
        const jobId = crypto.randomUUID();
        const jobPath = path.join(JOBS_DIR, jobId);
        
        // Guardamos metadatos JSON
        fs.writeFileSync(`${jobPath}.json`, JSON.stringify(metadata));
        // Guardamos Float32 RAW
        fs.writeFileSync(`${jobPath}.bin`, floatBuffer);
        // Guardamos guide image
        if (guideBuffer) fs.writeFileSync(`${jobPath}_guide.jpg`, guideBuffer);
        
        // 2. Comprimir solo PNGs+JPG rapido para descarga inicial
        const zip = new JSZip();
        if (guideBuffer) zip.folder("Mapa_Puzle_3D").file("Guia_Montaje_Ciudades.jpg", guideBuffer);
        for (let file of piecesPngs) {
            zip.folder("Mapa_Puzle_3D").file(file.originalname, file.buffer);
        }
        
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
        console.log(`Job ${jobId} creado. Imágenes ZIP devueltas.`);
        
        // Return 200 OK en JSON pero con Data URL para que Frontend baje el ZIP? 
        // No, es mejor devolver JSON con el Job ID y un Endpoint donde bajar el ZIP o descargar STL
        // Wait, the client expects to download the ZIP directly. If we return ZIP, where is the JobID?
        // We can place it in a Header.
        res.setHeader('X-Job-Id', jobId);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=Mapa_Imagenes_2D.zip');
        res.send(zipBuffer);
        
    } catch (err) {
        console.error("Error creando Job:", err);
        res.status(500).json({ error: err.message });
    }
});

// Obtener info del Job e Imagen de Guía
app.get('/api/job/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const jsonPath = path.join(JOBS_DIR, `${jobId}.json`);
    const guidePath = path.join(JOBS_DIR, `${jobId}_guide.jpg`);
    
    if (!fs.existsSync(jsonPath)) return res.status(404).json({ error: "Job no encontrado" });
    
    const meta = JSON.parse(fs.readFileSync(jsonPath));
    let guideBase64 = null;
    if (fs.existsSync(guidePath)) {
        guideBase64 = "data:image/jpeg;base64," + fs.readFileSync(guidePath).toString('base64');
    }
    
    res.json({
        metadata: meta,
        cols: Math.ceil(meta.totalSizeX / meta.bedSizeMm),
        rows: Math.ceil(meta.totalSizeY / meta.bedSizeMm),
        guideImage: guideBase64
    });
});

// Endpoint on-demand para generar UN STL específico
const { generateSinglePieceMesh } = require('./mesher');

app.get('/api/generate-piece/:jobId/:r/:c', async (req, res) => {
    const { jobId, r, c } = req.params;
    console.log(`[Job ${jobId}] Generando Pieza r=${r} c=${c}`);
    const jsonPath = path.join(JOBS_DIR, `${jobId}.json`);
    const binPath = path.join(JOBS_DIR, `${jobId}.bin`);
    
    if (!fs.existsSync(jsonPath) || !fs.existsSync(binPath)) {
        return res.status(404).send("Archivos del Job no encontrados. Refresque e inicie de cero.");
    }
    
    try {
        const metadata = JSON.parse(fs.readFileSync(jsonPath));
        const floatBuffer = fs.readFileSync(binPath);
        const rawElevations = new Float32Array(
            floatBuffer.buffer, 
            floatBuffer.byteOffset, 
            floatBuffer.length / Float32Array.BYTES_PER_ELEMENT
        );
        
        let stlBuffer = await generateSinglePieceMesh({
            ...metadata,
            rawElevations
        }, parseInt(r), parseInt(c));
        
        const rows = Math.ceil(metadata.totalSizeY / metadata.bedSizeMm);
        const humanRow = rows - parseInt(r);
        const humanCol = parseInt(c) + 1;
        
        res.setHeader('Content-Type', 'model/stl');
        res.setHeader('Content-Disposition', `attachment; filename="mapa_Fila${humanRow}_Col${humanCol}.stl"`);
        res.send(stlBuffer);
    } catch (e) {
        console.error("Error aislando pieza:", e);
        res.status(500).send("Fallo al generar archivo 3D individual.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend 3D Worker CPU Nodejs corriendo en puerto local :${PORT}`));
