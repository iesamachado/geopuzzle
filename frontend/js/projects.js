document.addEventListener('DOMContentLoaded', () => {
    const projectsGrid = document.getElementById('projects-grid');
    const noProjects = document.getElementById('no-projects');
    const loaderOverlay = document.getElementById('loader-overlay');
    const projectModal = document.getElementById('project-modal');
    const closeModal = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalGuideImg = document.getElementById('modal-guide-img');
    const modalPiecesGrid = document.getElementById('modal-pieces-grid');

    const API_BASE = 'http://localhost:3000/api';

    async function loadProjects() {
        try {
            const res = await fetch(`${API_BASE}/jobs`);
            if (!res.ok) throw new Error("Falla al cargar listado");
            const jobs = await res.json();
            
            loaderOverlay.classList.add('hidden');
            
            if (jobs.length === 0) {
                noProjects.classList.remove('hidden');
                projectsGrid.classList.add('hidden');
                return;
            }
            
            noProjects.classList.add('hidden');
            projectsGrid.classList.remove('hidden');
            projectsGrid.innerHTML = "";
            
            jobs.forEach(job => {
                const card = document.createElement('div');
                card.className = 'project-card';
                
                const d = new Date(job.date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
                
                // Fallback for guide image if not exists
                const guidePreview = `${API_BASE}/job/${job.id}`; // We'll fetch it properly in the card? No, let's just use a placeholder or better, fetch thumbnail if we had one.
                // For now, we'll fetch the job details to get the guide image if we want a preview, but to avoid many requests, we'll use a placeholder or just a map icon.
                
                card.innerHTML = `
                    <div class="project-thumbnail">
                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1e293b; color: var(--accent-color);">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        </div>
                    </div>
                    <div class="project-info">
                        <div class="project-title">Mapa ${job.metadata.totalSizeX}x${job.metadata.totalSizeY}mm</div>
                        <div class="project-meta">
                            <span>Z: ${job.metadata.zFinalMm}mm</span>
                            <span>Cama: ${job.metadata.bedSizeMm}mm</span>
                        </div>
                        <div class="project-date">${d}</div>
                    </div>
                `;
                
                card.onclick = () => openProject(job.id);
                projectsGrid.appendChild(card);
            });
            
        } catch(e) {
            console.error(e);
            loaderOverlay.innerHTML = "<p style='color: var(--error-color)'>Error de conexión con el servidor.</p>";
        }
    }

    async function openProject(jobId) {
        projectModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        modalPiecesGrid.innerHTML = "<div class='loader' style='position:relative'></div>";
        modalGuideImg.src = "";
        modalTitle.innerText = "Cargando...";

        try {
            const res = await fetch(`${API_BASE}/job/${jobId}`);
            if (!res.ok) throw new Error("Job no encontrado");
            const data = await res.json();
            
            modalTitle.innerText = `Proyecto ${data.metadata.totalSizeX}x${data.metadata.totalSizeY} mm`;
            
            if (data.guideImage) {
                modalGuideImg.src = data.guideImage;
            } else {
                modalGuideImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23334155'/%3E%3Ctext x='50' y='50' fill='white' text-anchor='middle' dominant-baseline='middle'%3ESin Guía Visual%3C/text%3E%3C/svg%3E";
            }
            
            modalPiecesGrid.innerHTML = "";
            for (let r = 0; r < data.rows; r++) {
                for (let c = 0; c < data.cols; c++) {
                    const humanRow = data.rows - r;
                    const humanCol = c + 1;
                    
                    const btn = document.createElement('button');
                    btn.className = 'piece-btn';
                    btn.style.width = "100%";
                    btn.innerHTML = `
                        <span class="piece-icon">🧩</span>
                        <div style="font-size: 0.8rem; font-weight: 600;">Fila ${humanRow}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Columna ${humanCol}</div>
                    `;
                    
                    btn.onclick = () => {
                        window.location.href = `${API_BASE}/generate-piece/${jobId}/${r}/${c}`;
                    };
                    
                    modalPiecesGrid.appendChild(btn);
                }
            }
        } catch (e) {
            modalPiecesGrid.innerHTML = "<p style='color: var(--error-color)'>Error al cargar los detalles del proyecto.</p>";
        }
    }

    closeModal.onclick = () => {
        projectModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    loadProjects();
});
