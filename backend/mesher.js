const THREE = require('three');
const JSZip = require('jszip');

async function generate3DMeshes(params) {
    const { totalSizeX, totalSizeY, bedSizeMm, zFinalMm, localMaxElev, pixWidth, pixHeight, rawElevations } = params;
    
    const cols = Math.ceil(totalSizeX / bedSizeMm);
    const rows = Math.ceil(totalSizeY / bedSizeMm);
    
    const colW = [];
    const colX = [];
    for (let c = 0; c < cols; c++) {
        let cw = (c === cols - 1) ? (totalSizeX - c * bedSizeMm) : bedSizeMm;
        if (cw <= 0) cw = bedSizeMm; // Failsafe
        colX.push(c * bedSizeMm);
        colW.push(cw);
    }
    
    const rowH = [];
    const rowY = [];
    for (let r = 0; r < rows; r++) {
        let rh = (r === rows - 1) ? (totalSizeY - r * bedSizeMm) : bedSizeMm;
        if (rh <= 0) rh = bedSizeMm;
        rowY.push(r * bedSizeMm);
        rowH.push(rh);
    }
    
    // Smoothing del relieve (Gauss simple iterativo para difuminar escalones)
    const smoothData = new Float32Array(rawElevations);
    applyBoxBlur(smoothData, pixWidth, pixHeight, 2); 
    
    const zScale = localMaxElev > 0 ? (zFinalMm / localMaxElev) : 1.0; 
    
    const RESOLUTION = 1024; // Calidad del grid pedida por el usuario: 1024x1024 vértices por pieza
    
    // Perfiles
    const H_EDGES = [];
    const V_EDGES = [];
    
    for(let r=0; r<=rows; r++) {
        H_EDGES[r] = [];
        for(let c=0; c<cols; c++) {
            let hasTab = (r > 0 && r < rows);
            let tabDir = ((c + r) % 2 === 0) ? -1 : 1; // Un lado entra y el otro sale
            H_EDGES[r].push(generateEdgeProfile(colW[c], RESOLUTION, hasTab, tabDir));
        }
    }
    for(let r=0; r<rows; r++) {
        V_EDGES[r] = [];
        for(let c=0; c<=cols; c++) {
            let hasTab = (c > 0 && c < cols);
            let tabDir = ((c + r) % 2 === 0) ? -1 : 1;
            V_EDGES[r].push(generateEdgeProfile(rowH[r], RESOLUTION, hasTab, tabDir));
        }
    }
    
    const zip = new JSZip();
    const folder = zip.folder("Mapa_Puzle_3D");
    
    // Calcular
    for(let r = 0; r < rows; r++) {
        for(let c = 0; c < cols; c++) {
            const gapTol = 0.2; // Tolerancia de 0.2mm en uniones
            
            const bottomEdge = addTolerance(H_EDGES[r][c], gapTol, true);
            const topEdge = addTolerance(H_EDGES[r+1][c], -gapTol, true);
            const leftEdge = addTolerance(V_EDGES[r][c], -gapTol, false); 
            const rightEdge = addTolerance(V_EDGES[r][c+1], gapTol, false);

            const geometry = buildTileMesh(
                bottomEdge, topEdge, leftEdge, rightEdge, 
                RESOLUTION, colW[c], rowH[r],
                c, r, colX[c], rowY[r], totalSizeX, totalSizeY,
                smoothData, pixWidth, pixHeight, zScale
            );
            
            // Compilador Nativo Node.js a Raw .STL array
            const stlBuffer = exportBinarySTL(geometry);
            // r=0 es la base del terreno (Sur) pero en UI Fila 1 es el Norte (Top). Por tanto invertimos.
            folder.file(`mapa_Fila${rows - r}_Col${c+1}.stl`, stlBuffer);
        }
    }
    
    // Anexamos las piezas 2D PNG si nos las mandaron (escala de grises)
    if (params.piecesPngs) {
        for (let file of params.piecesPngs) {
            folder.file(file.originalname, file.buffer);
        }
    }
    
    // Anexamos la guia en JPG si nos la han mandado desde Chrome
    if (params.guideBuffer) {
        folder.file("Guia_Montaje_Ciudades.jpg", params.guideBuffer);
    }
    
    // Devolver un buffer JSZip compilado
    return await zip.generateAsync({
        type: "nodebuffer", 
        compression: "DEFLATE",
        compressionOptions: {
            level: 5 // Para que no mate la CPU pero reduzca un poco el enorme tamaño
        }
    });
}

function applyBoxBlur(data, w, h, radius) {
    const result = new Float32Array(data.length);
    for(let y=0; y<h; y++) {
        for(let x=0; x<w; x++) {
            let sum = 0, count = 0;
            for(let ky=-radius; ky<=radius; ky++) {
                for(let kx=-radius; kx<=radius; kx++) {
                    let nx = x + kx, ny = y + ky;
                    if(nx >=0 && nx < w && ny >= 0 && ny < h) {
                        sum += data[ny * w + nx];
                        count++;
                    }
                }
            }
            result[y * w + x] = sum / count;
        }
    }
    for (let i = 0; i < data.length; i++) data[i] = result[i];
}

function generateEdgeProfile(length, steps, hasTab, tabDir) {
    const pts = [];
    const tabSize = 5.0; // Pestaña de 5mm 
    for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        let px = t * length;
        let py = 0;
        
        if (hasTab && t >= 0.35 && t <= 0.65) {
            let u = (t - 0.35) / 0.3; 
            if (u < 0.2) {
                py = (u / 0.2) * tabSize;
                px -= (u / 0.2) * 1.5; // Cola milano
            } else if (u < 0.8) {
                py = tabSize;
                px -= 1.5; 
            } else {
                let d = (1 - u) / 0.2;
                py = d * tabSize;
                px -= d * 1.5;
            }
            py *= tabDir; // Bulge hacia adelante o atras
        }
        pts.push({ x: px, y: py });
    }
    return pts;
}

function addTolerance(pts, shift, isHoriz) {
    const out = [];
    for(let i=0; i<pts.length; i++) {
        let p0 = i > 0 ? pts[i-1] : pts[i];
        let p2 = i < pts.length-1 ? pts[i+1] : pts[i];
        let dx = p2.x - p0.x;
        let dy = p2.y - p0.y;
        let len = Math.hypot(dx, dy) || 1;
        let nx = -dy/len;
        let ny = dx/len;
        
        if (isHoriz) {
            out.push({ x: pts[i].x + nx * shift, y: pts[i].y + ny * shift });
        } else {
            out.push({ x: pts[i].y + ny * shift, y: pts[i].x - nx * shift }); 
        }
    }
    return out;
}

function buildTileMesh(bEdge, tEdge, lEdge, rEdge, steps, w, h, col, row, globalOffsetX, globalOffsetY, totalW, totalH, demData, pw, ph, zScale) {
    
    const P00 = {x: 0, y: 0};
    const P10 = {x: w, y: 0};
    const P01 = {x: 0, y: h};
    const P11 = {x: w, y: h};
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    // Math base de Base gruesa de pared (5mm sólidos + lo que de el mar)
    const baseExtrusion = -5.0;  
    
    // COONS PATCH para Top Layer (z depende del DEM)
    for(let i=0; i<=steps; i++) {
        let v = i / steps;
        for(let j=0; j<=steps; j++) {
            let u = j / steps;
            
            let E0 = bEdge[j];
            let E1 = tEdge[j];
            let E2 = lEdge[i];
            let E3 = rEdge[i];
            
            // LA FÓRMULA CORRECTA FIXEADA:
            // LEdge y REdge vienen rotados para su extrusión, x es el 'tab' y y es la 'distancia'
            let Px = (1-v)*E0.x + v*E1.x + (1-u)*E2.x + u*(w + E3.x)
                   - ( (1-u)*(1-v)*P00.x + u*(1-v)*P10.x + (1-u)*v*P01.x + u*v*P11.x );
                   
            let Py = (1-v)*E0.y + v*(h + E1.y) + (1-u)*E2.y + u*E3.y 
                   - ( (1-u)*(1-v)*P00.y + u*(1-v)*P10.y + (1-u)*v*P01.y + u*v*P11.y );
                   
            // Sample global coordinates inside bounding box array
            let globalX = globalOffsetX + Px;
            let globalY = globalOffsetY + Py;
            

            
            let pixX = Math.floor((globalX / totalW) * pw);
            let pixY = Math.floor((globalY / totalH) * ph);
            if (pixX < 0) pixX = 0; if (pixX >= pw) pixX = pw-1;
            if (pixY < 0) pixY = 0; if (pixY >= ph) pixY = ph-1;
            
            let invertedPixY = (ph - 1) - pixY; 
            
            let zRaw = demData[invertedPixY * pw + pixX];
            let z = zRaw * zScale;
            if (z < 0) z = 0; 
            
            vertices.push(Px, Py, z);
        }
    }
    
    // Bottom Layer (Plano inferior liso). Exactamente los mismos vertices pero z=baseExtrusion
    let bottomStart = vertices.length / 3;
    for(let i=0; i<=steps; i++) {
        let v = i / steps;
        for(let j=0; j<=steps; j++) {
            let u = j / steps;
            let E0 = bEdge[j];
            let E1 = tEdge[j];
            let E2 = lEdge[i];
            let E3 = rEdge[i];
            let Px = (1-v)*E0.x + v*E1.x + (1-u)*E2.x + u*(w + E3.x) - ( (1-u)*(1-v)*P00.x + u*(1-v)*P10.x + (1-u)*v*P01.x + u*v*P11.x );
            let Py = (1-v)*E0.y + v*(h + E1.y) + (1-u)*E2.y + u*E3.y - ( (1-u)*(1-v)*P00.y + u*(1-v)*P10.y + (1-u)*v*P01.y + u*v*P11.y );
            vertices.push(Px, Py, baseExtrusion);
        }
    }
    
    // Generar Indices para las caras de Top Layer y Bottom Layer
    let vertsPerRow = steps + 1;
    for(let i=0; i<steps; i++) {
        for(let j=0; j<steps; j++) {
            let a = i * vertsPerRow + j;
            let b = i * vertsPerRow + (j + 1);
            let c = (i + 1) * vertsPerRow + j;
            let d = (i + 1) * vertsPerRow + (j + 1);
            
            // Top layer (Normales mirando arriba -> Counter-Clockwise)
            indices.push(a, b, d);
            indices.push(a, d, c);
            
            // Bottom layer (Normales mirando abajo -> Clockwise)
            let _a = bottomStart + a;
            let _b = bottomStart + b;
            let _c = bottomStart + c;
            let _d = bottomStart + d;
            indices.push(_a, _d, _b);
            indices.push(_a, _c, _d);
        }
    }
    
    // Coser Muros Laterales para sellar Volumen (Manifold 3D print ready)
    // - Edge Inferior (i = 0)
    for(let j=0; j<steps; j++) {
        let a = j; let b = j+1;
        let _a = bottomStart + a; let _b = bottomStart + b;
        indices.push(a, _b, b); indices.push(a, _a, _b);
    }
    // - Edge Superior (i = steps)
    let topRowOffset = steps * vertsPerRow;
    for(let j=0; j<steps; j++) {
        let a = topRowOffset + j; let b = topRowOffset + j+1;
        let _a = bottomStart + a; let _b = bottomStart + b;
        indices.push(a, b, _b); indices.push(a, _b, _a); // Invertidos para normal mirando fuera (+y)
    }
    // - Edge Izquierdo (j = 0)
    for(let i=0; i<steps; i++) {
        let a = i * vertsPerRow; let c = (i+1) * vertsPerRow;
        let _a = bottomStart + a; let _c = bottomStart + c;
        indices.push(a, c, _c); indices.push(a, _c, _a);
    }
    // - Edge Derecho (j = steps)
    for(let i=0; i<steps; i++) {
        let b = i * vertsPerRow + steps; let d = (i+1) * vertsPerRow + steps;
        let _b = bottomStart + b; let _d = bottomStart + d;
        indices.push(b, _d, d); indices.push(b, _b, _d);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

// Custom STL Exporter (Binario, super rápido y memory-safe)
function exportBinarySTL(geometry) {
    let geo = geometry;
    if (geo.index !== null) { geo = geo.toNonIndexed(); }
    
    const position = geo.getAttribute('position');
    const normal = geo.getAttribute('normal');
    const triangles = position.count / 3;
    
    const bufferLength = 84 + ( 50 * triangles );
    const buffer = Buffer.alloc(bufferLength);
    
    // STL files need an 80 byte header
    buffer.write("Generated by Antigravity Map 3D Backend", 0, "ascii");
    buffer.writeUInt32LE(triangles, 80);
    
    let offset = 84;
    for(let i=0; i<position.count; i+=3) {
        // Obtenemos vertices
        let vA = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));
        let vB = new THREE.Vector3(position.getX(i+1), position.getY(i+1), position.getZ(i+1));
        let vC = new THREE.Vector3(position.getX(i+2), position.getY(i+2), position.getZ(i+2));
        
        let cb = new THREE.Vector3(), ab = new THREE.Vector3();
        cb.subVectors(vC, vB); ab.subVectors(vA, vB);
        cb.cross(ab).normalize(); // Face Normal

        buffer.writeFloatLE(cb.x, offset); offset += 4;
        buffer.writeFloatLE(cb.y, offset); offset += 4;
        buffer.writeFloatLE(cb.z, offset); offset += 4;
        
        // Vértices
        buffer.writeFloatLE(vA.x, offset); offset += 4;
        buffer.writeFloatLE(vA.y, offset); offset += 4;
        buffer.writeFloatLE(vA.z, offset); offset += 4;
        
        buffer.writeFloatLE(vB.x, offset); offset += 4;
        buffer.writeFloatLE(vB.y, offset); offset += 4;
        buffer.writeFloatLE(vB.z, offset); offset += 4;
        
        buffer.writeFloatLE(vC.x, offset); offset += 4;
        buffer.writeFloatLE(vC.y, offset); offset += 4;
        buffer.writeFloatLE(vC.z, offset); offset += 4;
        
        buffer.writeUInt16LE(0, offset); offset += 2;
    }
    
    return buffer;
}

async function generateSinglePieceMesh(params, r, c) {
    const { totalSizeX, totalSizeY, bedSizeMm, zFinalMm, localMaxElev, pixWidth, pixHeight, rawElevations } = params;
    
    const cols = Math.ceil(totalSizeX / bedSizeMm);
    const rows = Math.ceil(totalSizeY / bedSizeMm);
    
    const colW = [];
    const colX = [];
    for (let i = 0; i < cols; i++) {
        let cw = (i === cols - 1) ? (totalSizeX - i * bedSizeMm) : bedSizeMm;
        if (cw <= 0) cw = bedSizeMm;
        colX.push(i * bedSizeMm);
        colW.push(cw);
    }
    
    const rowH = [];
    const rowY = [];
    for (let j = 0; j < rows; j++) {
        let rh = (j === rows - 1) ? (totalSizeY - j * bedSizeMm) : bedSizeMm;
        if (rh <= 0) rh = bedSizeMm;
        rowY.push(j * bedSizeMm);
        rowH.push(rh);
    }
    
    // Smoothing del relieve (Gauss simple iterativo para difuminar escalones)
    const smoothData = new Float32Array(rawElevations);
    applyBoxBlur(smoothData, pixWidth, pixHeight, 2); 
    
    const zScale = localMaxElev > 0 ? (zFinalMm / localMaxElev) : 1.0; 
    
    const RESOLUTION = 1024; // Petición de usuario explícita
    
    // Precalcular SÓLO los perfiles para r, r+1 y c, c+1
    // Top, Bottom
    const bEdgeHasTab = (r > 0 && r < rows);
    const bEdgeDir = ((c + r) % 2 === 0) ? -1 : 1;
    const bottomEdge = generateEdgeProfile(colW[c], RESOLUTION, bEdgeHasTab, bEdgeDir);
    
    const tEdgeHasTab = ((r+1) > 0 && (r+1) < rows);
    const tEdgeDir = ((c + (r+1)) % 2 === 0) ? -1 : 1;
    const topEdge = generateEdgeProfile(colW[c], RESOLUTION, tEdgeHasTab, tEdgeDir);
    
    // Left, Right
    const lEdgeHasTab = (c > 0 && c < cols);
    const lEdgeDir = ((c + r) % 2 === 0) ? -1 : 1;
    const leftEdge = generateEdgeProfile(rowH[r], RESOLUTION, lEdgeHasTab, lEdgeDir);
    
    const rEdgeHasTab = ((c+1) > 0 && (c+1) < cols);
    const rEdgeDir = (((c+1) + r) % 2 === 0) ? -1 : 1;
    const rightEdge = generateEdgeProfile(rowH[r], RESOLUTION, rEdgeHasTab, rEdgeDir);
    
    const gapTol = 0.2; // Tolerancia de 0.2mm en uniones
    const finalBottomEdge = addTolerance(bottomEdge, gapTol, true);
    const finalTopEdge = addTolerance(topEdge, -gapTol, true);
    const finalLeftEdge = addTolerance(leftEdge, -gapTol, false); 
    const finalRightEdge = addTolerance(rightEdge, gapTol, false);

    const geometry = buildTileMesh(
        finalBottomEdge, finalTopEdge, finalLeftEdge, finalRightEdge, 
        RESOLUTION, colW[c], rowH[r],
        c, r, colX[c], rowY[r], totalSizeX, totalSizeY,
        smoothData, pixWidth, pixHeight, zScale
    );
    
    return exportBinarySTL(geometry);
}


module.exports = { generate3DMeshes, generateSinglePieceMesh };
