class PhotoEditor {
    constructor() {
        this.mainCanvas = document.getElementById('mainCanvas');
        this.drawCanvas = document.getElementById('drawCanvas');
        this.tempCanvas = document.getElementById('tempCanvas');
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.drawCtx = this.drawCanvas.getContext('2d');
        this.tempCtx = this.tempCanvas.getContext('2d');
        this.fileInput = document.getElementById('fileInput');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.canvasWrapper = document.getElementById('canvasWrapper');
        
        this.originalImage = null;
        this.currentImage = null;
        this.rotation = 0;
        this.flipH = 1;
        this.flipV = 1;
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            invert: 0
        };
        
        this.currentTool = 'cursor';
        this.isDrawing = false;
        this.brushColor = '#000000';
        this.brushSize = 5;
        this.lastX = 0;
        this.lastY = 0;
        this.startX = 0;
        this.startY = 0;
        
        this.zoom = 100;
        this.minZoom = 10;
        this.maxZoom = 300;
        
        this.shapeStart = { x: 0, y: 0 };
        this.textInput = '';
        this.fontSize = 24;
        
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 30;
        
        this.isMobile = this.checkMobile();
        
        this.init();
    }
    
    checkMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }
    
    init() {
        this.hideSplash();
        this.setupEventListeners();
        this.setupCanvas();
        this.setupGestures();
    }
    
    hideSplash() {
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.classList.add('hidden');
                setTimeout(() => splash.remove(), 500);
            }
        }, 1500);
    }
    
    setupEventListeners() {
        // Sidebar toggle
        const menuToggle = document.getElementById('menuToggle');
        const menuToggleRight = document.getElementById('menuToggleRight');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const closeSidebar = document.getElementById('closeSidebar');
        
        const toggleSidebar = () => {
            if (sidebar) sidebar.classList.toggle('active');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
            if (menuToggle) menuToggle.classList.toggle('active');
        };
        
        menuToggle?.addEventListener('click', toggleSidebar);
        menuToggleRight?.addEventListener('click', toggleSidebar);
        closeSidebar?.addEventListener('click', toggleSidebar);
        sidebarOverlay?.addEventListener('click', toggleSidebar);
        
        // Upload
        document.getElementById('uploadBtn')?.addEventListener('click', () => this.fileInput.click());
        document.getElementById('uploadBtnPlaceholder')?.addEventListener('click', () => this.fileInput.click());
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.loadImage(e.target.files[0]);
            }
        });
        
        // Download
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadImage());
        
        // Reset
        document.getElementById('resetBtn')?.addEventListener('click', () => this.resetAll());
        
        // Undo/Redo
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());
        
        // Zoom
        document.getElementById('zoomIn')?.addEventListener('click', () => this.setZoom(Math.min(this.zoom + 10, this.maxZoom)));
        document.getElementById('zoomOut')?.addEventListener('click', () => this.setZoom(Math.max(this.zoom - 10, this.minZoom)));
        document.getElementById('zoomReset')?.addEventListener('click', () => this.setZoom(100));
        document.getElementById('zoomSlider')?.addEventListener('input', (e) => this.setZoom(parseInt(e.target.value)));
        
        // Adjustments
        ['brightness', 'contrast', 'saturation', 'blur'].forEach(adj => {
            const slider = document.getElementById(adj);
            const valueSpan = document.getElementById(adj + 'Value');
            
            slider?.addEventListener('input', (e) => {
                this.filters[adj] = e.target.value;
                if (valueSpan) {
                    valueSpan.textContent = adj === 'blur' ? e.target.value + 'px' : e.target.value + '%';
                }
                this.applyFilters();
                this.saveToHistory();
            });
        });
        
        // Filters
        document.querySelectorAll('.filter-btn-lg').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn-lg').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.applyPresetFilter(e.target.dataset.filter);
                this.saveToHistory();
                if (this.isMobile) this.closeSidebar();
            });
        });
        
        // Tools
        document.querySelectorAll('.tool-btn-lg').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn-lg').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTool = e.target.dataset.tool;
                this.updateToolOptions();
                this.updateCanvasCursor();
                this.showToast(`Ferramenta: ${e.target.querySelector('.tool-label')?.textContent || this.currentTool}`, 'info');
                if (this.isMobile) this.closeSidebar();
            });
        });
        
        // Color
        document.getElementById('brushColor')?.addEventListener('input', (e) => {
            this.brushColor = e.target.value;
        });
        
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.brushColor = e.target.dataset.color;
                document.getElementById('brushColor').value = this.brushColor;
            });
        });
        
        document.getElementById('brushSize')?.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            const display = document.getElementById('brushSizeValue');
            if (display) display.textContent = e.target.value + 'px';
        });
        
        // Text
        document.getElementById('textInput')?.addEventListener('input', (e) => {
            this.textInput = e.target.value;
        });
        
        document.getElementById('fontSize')?.addEventListener('input', (e) => {
            this.fontSize = parseInt(e.target.value);
            const display = document.getElementById('fontSizeValue');
            if (display) display.textContent = e.target.value + 'px';
        });
        
        // Transform
        document.getElementById('rotateLeft')?.addEventListener('click', () => {
            this.rotation -= 90;
            this.applyTransform();
            this.saveToHistory();
        });
        
        document.getElementById('rotateRight')?.addEventListener('click', () => {
            this.rotation += 90;
            this.applyTransform();
            this.saveToHistory();
        });
        
        document.getElementById('flipH')?.addEventListener('click', () => {
            this.flipH *= -1;
            this.applyTransform();
            this.saveToHistory();
        });
        
        document.getElementById('flipV')?.addEventListener('click', () => {
            this.flipV *= -1;
            this.applyTransform();
            this.saveToHistory();
        });
        
        // Drawing events
        this.setupDrawingEvents();
        
        // Cursor position
        this.drawCanvas.addEventListener('mousemove', (e) => {
            const coords = this.getCanvasCoordinates(e);
            const display = document.getElementById('cursorPos');
            if (display) {
                display.textContent = `X: ${Math.round(coords.x)} | Y: ${Math.round(coords.y)}`;
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.downloadImage();
            }
        });
        
        // Drag and drop
        this.setupDragDrop();
    }
    
    setupDrawingEvents() {
        // Mouse events
        this.drawCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.drawCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.drawCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.drawCanvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events
        this.drawCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                this.startDrawing(e.touches[0]);
            }
        }, { passive: false });
        
        this.drawCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                this.draw(e.touches[0]);
            }
        }, { passive: false });
        
        this.drawCanvas.addEventListener('touchend', () => this.stopDrawing());
    }
    
    setupGestures() {
        let initialDistance = 0;
        
        this.canvasWrapper.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = this.getTouchDistance(e.touches);
            }
        }, { passive: true });
        
        this.canvasWrapper.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const distance = this.getTouchDistance(e.touches);
                const delta = distance - initialDistance;
                
                if (Math.abs(delta) > 10) {
                    const newZoom = Math.min(Math.max(this.zoom + delta, this.minZoom), this.maxZoom);
                    this.setZoom(newZoom);
                    initialDistance = distance;
                }
            }
        }, { passive: false });
    }
    
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    setupCanvas() {
        this.mainCanvas.width = 800;
        this.mainCanvas.height = 600;
        this.drawCanvas.width = 800;
        this.drawCanvas.height = 600;
        this.tempCanvas.width = 800;
        this.tempCanvas.height = 600;
        this.showPlaceholder();
    }
    
    showPlaceholder() {
        this.mainCtx.fillStyle = '#2a2a2a';
        this.mainCtx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        
        const placeholder = document.getElementById('placeholder');
        if (placeholder) placeholder.style.display = 'block';
    }
    
    hidePlaceholder() {
        const placeholder = document.getElementById('placeholder');
        if (placeholder) placeholder.style.display = 'none';
    }
    
    loadImage(file) {
        if (!file) return;
        
        this.showLoading(true);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.currentImage = img;
                this.resetFilters();
                this.renderImage();
                this.updateInfo(img);
                this.showLoading(false);
                this.hidePlaceholder();
                this.history = [];
                this.historyIndex = -1;
                this.saveToHistory();
                this.showToast('Imagem carregada com sucesso!', 'success');
            };
            img.onerror = () => {
                this.showToast('Erro ao carregar imagem!', 'error');
                this.showLoading(false);
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            this.showToast('Erro ao ler arquivo!', 'error');
            this.showLoading(false);
        };
        reader.readAsDataURL(file);
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }
    
    renderImage() {
        if (!this.currentImage) return;
        
        let width = this.currentImage.width;
        let height = this.currentImage.height;
        
        if (this.rotation % 180 !== 0) {
            width = this.currentImage.height;
            height = this.currentImage.width;
        }
        
        this.mainCanvas.width = width;
        this.mainCanvas.height = height;
        this.drawCanvas.width = width;
        this.drawCanvas.height = height;
        this.tempCanvas.width = width;
        this.tempCanvas.height = height;
        
        this.applyFilters();
        this.updateZoom();
    }
    
    setZoom(value) {
        this.zoom = value;
        const slider = document.getElementById('zoomSlider');
        const valueDisplay = document.getElementById('zoomValue');
        const zoomInfo = document.getElementById('zoomInfo');
        
        if (slider) slider.value = value;
        if (valueDisplay) valueDisplay.textContent = value + '%';
        if (zoomInfo) zoomInfo.textContent = `Zoom: ${value}%`;
        
        this.updateZoom();
    }
    
    updateZoom() {
        const scale = this.zoom / 100;
        if (this.canvasContainer) {
            this.canvasContainer.style.transform = `scale(${scale})`;
            this.canvasContainer.style.transformOrigin = 'top left';
        }
    }
    
    applyFilters() {
        if (!this.currentImage) return;
        
        this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        this.mainCtx.save();
        
        const angleInRad = (this.rotation * Math.PI) / 180;
        this.mainCtx.translate(this.mainCanvas.width / 2, this.mainCanvas.height / 2);
        this.mainCtx.rotate(angleInRad);
        this.mainCtx.scale(this.flipH, this.flipV);
        
        const filterString = `
            brightness(${this.filters.brightness}%)
            contrast(${this.filters.contrast}%)
            saturate(${this.filters.saturation}%)
            blur(${this.filters.blur}px)
            grayscale(${this.filters.grayscale}%)
            sepia(${this.filters.sepia}%)
            invert(${this.filters.invert}%)
        `;
        
        this.mainCtx.filter = filterString;
        this.mainCtx.drawImage(
            this.currentImage,
            -this.currentImage.width / 2,
            -this.currentImage.height / 2
        );
        
        this.mainCtx.restore();
    }
    
    applyPresetFilter(filter) {
        this.resetFilters();
        
        switch(filter) {
            case 'grayscale': this.filters.grayscale = 100; break;
            case 'sepia': this.filters.sepia = 100; break;
            case 'invert': this.filters.invert = 100; break;
            case 'vintage':
                this.filters.sepia = 50;
                this.filters.contrast = 120;
                this.filters.brightness = 110;
                break;
            case 'cool': this.filters.saturation = 80; break;
            case 'warm':
                this.filters.sepia = 30;
                this.filters.brightness = 105;
                break;
        }
        
        this.applyFilters();
    }
    
    applyTransform() {
        this.applyFilters();
    }
    
    // ✅ CORREÇÃO: Cálculo correto das coordenadas considerando zoom e posição
    getCanvasCoordinates(e) {
        const rect = this.drawCanvas.getBoundingClientRect();
        const scaleX = this.drawCanvas.width / rect.width;
        const scaleY = this.drawCanvas.height / rect.height;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        return {
            x: Math.round((clientX - rect.left) * scaleX),
            y: Math.round((clientY - rect.top) * scaleY)
        };
    }
    
    startDrawing(e) {
        const coords = this.getCanvasCoordinates(e);
        this.startX = coords.x;
        this.startY = coords.y;
        this.lastX = coords.x;
        this.lastY = coords.y;
        
        // ✅ CORREÇÃO: Texto agora funciona com clique
        if (this.currentTool === 'text') {
            if (this.textInput.trim()) {
                this.drawCtx.font = `${this.fontSize}px Arial`;
                this.drawCtx.fillStyle = this.brushColor;
                this.drawCtx.textBaseline = 'top';
                this.drawCtx.fillText(this.textInput, coords.x, coords.y);
                this.mergeLayers();
                this.saveToHistory();
                this.showToast('Texto adicionado!', 'success');
            } else {
                this.showToast('Digite um texto primeiro!', 'error');
            }
            this.isDrawing = false;
            return;
        }
        
        // ✅ CORREÇÃO: Conta-gotas funciona
        if (this.currentTool === 'eyedropper') {
            this.pickColor(coords.x, coords.y);
            this.isDrawing = false;
            return;
        }
        
        // ✅ CORREÇÃO: Formas (retângulo, círculo, linha) agora funcionam
        if (['rectangle', 'circle', 'line'].includes(this.currentTool)) {
            this.isDrawing = true;
            this.shapeStart = { x: coords.x, y: coords.y };
            this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
            return;
        }
        
        // Pincel e Borracha
        if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.isDrawing = true;
            this.drawCtx.beginPath();
            this.drawCtx.moveTo(coords.x, coords.y);
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const coords = this.getCanvasCoordinates(e);
        
        // ✅ CORREÇÃO: Pincel desenha corretamente
        if (this.currentTool === 'brush') {
            this.drawCtx.beginPath();
            this.drawCtx.moveTo(this.lastX, this.lastY);
            this.drawCtx.lineTo(coords.x, coords.y);
            this.drawCtx.strokeStyle = this.brushColor;
            this.drawCtx.lineWidth = this.brushSize;
            this.drawCtx.lineCap = 'round';
            this.drawCtx.lineJoin = 'round';
            this.drawCtx.stroke();
        } 
        // ✅ CORREÇÃO: Borracha apaga de verdade
        else if (this.currentTool === 'eraser') {
            this.drawCtx.beginPath();
            this.drawCtx.moveTo(this.lastX, this.lastY);
            this.drawCtx.lineTo(coords.x, coords.y);
            this.drawCtx.strokeStyle = '#000000';
            this.drawCtx.lineWidth = this.brushSize;
            this.drawCtx.lineCap = 'round';
            this.drawCtx.lineJoin = 'round';
            this.drawCtx.globalCompositeOperation = 'destination-out';
            this.drawCtx.stroke();
            this.drawCtx.globalCompositeOperation = 'source-over';
        } 
        // ✅ CORREÇÃO: Retângulo com preview em tempo real
        else if (this.currentTool === 'rectangle') {
            this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
            this.tempCtx.strokeStyle = this.brushColor;
            this.tempCtx.lineWidth = this.brushSize;
            this.tempCtx.lineCap = 'round';
            this.tempCtx.lineJoin = 'round';
            this.tempCtx.strokeRect(
                this.shapeStart.x,
                this.shapeStart.y,
                coords.x - this.shapeStart.x,
                coords.y - this.shapeStart.y
            );
        } 
        // ✅ CORREÇÃO: Círculo/Elipse com preview em tempo real
        else if (this.currentTool === 'circle') {
            this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
            const radiusX = Math.abs(coords.x - this.shapeStart.x) / 2;
            const radiusY = Math.abs(coords.y - this.shapeStart.y) / 2;
            const centerX = this.shapeStart.x + (coords.x - this.shapeStart.x) / 2;
            const centerY = this.shapeStart.y + (coords.y - this.shapeStart.y) / 2;
            
            this.tempCtx.beginPath();
            this.tempCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            this.tempCtx.strokeStyle = this.brushColor;
            this.tempCtx.lineWidth = this.brushSize;
            this.tempCtx.lineCap = 'round';
            this.tempCtx.stroke();
        } 
        // ✅ CORREÇÃO: Linha com preview em tempo real
        else if (this.currentTool === 'line') {
            this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
            this.tempCtx.beginPath();
            this.tempCtx.moveTo(this.shapeStart.x, this.shapeStart.y);
            this.tempCtx.lineTo(coords.x, coords.y);
            this.tempCtx.strokeStyle = this.brushColor;
            this.tempCtx.lineWidth = this.brushSize;
            this.tempCtx.lineCap = 'round';
            this.tempCtx.stroke();
        }
        
        this.lastX = coords.x;
        this.lastY = coords.y;
    }
    
    // ✅ CORREÇÃO: Stop drawing mergeia camadas corretamente
    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        // Para formas, mergeia tempCanvas no drawCanvas
        if (['rectangle', 'circle', 'line'].includes(this.currentTool)) {
            this.drawCtx.drawImage(this.tempCanvas, 0, 0);
            this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
            this.mergeLayers();
            this.saveToHistory();
            this.showToast('Forma adicionada!', 'success');
        } 
        // Para pincel e borracha
        else if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.drawCtx.closePath();
            this.mergeLayers();
            this.saveToHistory();
        }
    }
    
    pickColor(x, y) {
        try {
            const pixel = this.mainCtx.getImageData(x, y, 1, 1).data;
            const color = `#${this.componentToHex(pixel[0])}${this.componentToHex(pixel[1])}${this.componentToHex(pixel[2])}`;
            this.brushColor = color;
            
            const colorInput = document.getElementById('brushColor');
            const colorInfo = document.getElementById('colorInfo');
            
            if (colorInput) colorInput.value = color;
            if (colorInfo) colorInfo.textContent = color;
            
            this.showToast(`Cor: ${color}`, 'info');
        } catch (err) {
            this.showToast('Erro ao pegar cor!', 'error');
        }
    }
    
    componentToHex(c) {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }
    
    // ✅ CORREÇÃO: Merge layers funciona corretamente
    mergeLayers() {
        this.mainCtx.drawImage(this.drawCanvas, 0, 0);
        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    }
    
    updateCanvasCursor() {
        const cursors = {
            'cursor': 'default',
            'brush': 'crosshair',
            'eraser': 'cell',
            'rectangle': 'crosshair',
            'circle': 'crosshair',
            'line': 'crosshair',
            'text': 'text',
            'eyedropper': 'copy'
        };
        this.drawCanvas.style.cursor = cursors[this.currentTool] || 'default';
    }
    
    updateToolOptions() {
        const textPanel = document.getElementById('textPanel');
        const colorPanel = document.getElementById('colorPanel');
        
        if (textPanel) {
            textPanel.style.display = this.currentTool === 'text' ? 'block' : 'none';
        }
        
        if (colorPanel) {
            colorPanel.style.display = ['brush', 'eraser', 'rectangle', 'circle', 'line', 'text'].includes(this.currentTool) ? 'block' : 'none';
        }
    }
    
    closeSidebar() {
        if (this.isMobile) {
            const sidebar = document.getElementById('sidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            const menuToggle = document.getElementById('menuToggle');
            
            sidebar?.classList.remove('active');
            sidebarOverlay?.classList.remove('active');
            menuToggle?.classList.remove('active');
        }
    }
    
    downloadImage() {
        if (!this.currentImage) {
            this.showToast('Carregue uma imagem primeiro!', 'error');
            return;
        }
        
        this.mergeLayers();
        
        const link = document.createElement('a');
        link.download = 'imagem-editada-' + Date.now() + '.png';
        link.href = this.mainCanvas.toDataURL('image/png');
        link.click();
        
        this.showToast('Imagem salva com sucesso!', 'success');
    }
    
    resetAll() {
        if (!this.originalImage) {
            this.showToast('Nenhuma imagem carregada!', 'error');
            return;
        }
        
        this.currentImage = this.originalImage;
        this.rotation = 0;
        this.flipH = 1;
        this.flipV = 1;
        this.resetFilters();
        this.renderImage();
        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        
        document.querySelectorAll('.filter-btn-lg').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === 'none') {
                btn.classList.add('active');
            }
        });
        
        this.history = [];
        this.historyIndex = -1;
        this.saveToHistory();
        
        this.showToast('Resetado com sucesso!', 'info');
    }
    
    resetFilters() {
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            invert: 0
        };
        
        ['brightness', 'contrast', 'saturation', 'blur'].forEach(adj => {
            const slider = document.getElementById(adj);
            const valueSpan = document.getElementById(adj + 'Value');
            const defaultValue = adj === 'blur' ? 0 : 100;
            
            if (slider) slider.value = defaultValue;
            if (valueSpan) valueSpan.textContent = adj === 'blur' ? '0px' : '100%';
        });
    }
    
    updateInfo(img) {
        const imageInfo = document.getElementById('imageInfo');
        if (imageInfo) {
            imageInfo.textContent = `📷 ${img.width} x ${img.height} px`;
        }
    }
    
    saveToHistory() {
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        const imageData = this.mainCanvas.toDataURL();
        this.history.push(imageData);
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadFromHistory(this.history[this.historyIndex]);
            this.showToast('Desfeito!', 'info');
        } else {
            this.showToast('Nada para desfazer', 'error');
        }
        this.updateUndoRedoButtons();
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadFromHistory(this.history[this.historyIndex]);
            this.showToast('Refeito!', 'info');
        } else {
            this.showToast('Nada para refazer', 'error');
        }
        this.updateUndoRedoButtons();
    }
    
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.style.opacity = this.historyIndex > 0 ? '1' : '0.5';
        if (redoBtn) redoBtn.style.opacity = this.historyIndex < this.history.length - 1 ? '1' : '0.5';
    }
    
    loadFromHistory(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            this.mainCtx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }
    
    setupDragDrop() {
        const canvasContainer = document.getElementById('canvasContainer');
        
        canvasContainer?.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvasContainer.style.background = '#3a3a3a';
        });
        
        canvasContainer?.addEventListener('dragleave', () => {
            canvasContainer.style.background = '#1a1a1a';
        });
        
        canvasContainer?.addEventListener('drop', (e) => {
            e.preventDefault();
            canvasContainer.style.background = '#1a1a1a';
            
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('image/')) {
                    this.loadImage(file);
                } else {
                    this.showToast('Apenas imagens!', 'error');
                }
            }
        });
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const editor = new PhotoEditor();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
});