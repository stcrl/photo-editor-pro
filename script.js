// ============================================
// PHOTO EDITOR PRO - VERSÃO CORRIGIDA
// ============================================

// Aguarda DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 PhotoEditor Pro - Iniciando...');
    
    // Inicializa o editor
    try {
        window.editor = new PhotoEditor();
        console.log('✅ Editor inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar editor:', error);
    }
});

// ============================================
// CLASSE PRINCIPAL DO EDITOR
// ============================================
class PhotoEditor {
    constructor() {
        console.log('🔧 Criando instância do PhotoEditor...');
        
        // Canvas elements
        this.mainCanvas = document.getElementById('mainCanvas');
        this.drawCanvas = document.getElementById('drawCanvas');
        this.tempCanvas = document.getElementById('tempCanvas');
        this.cropCanvas = document.getElementById('cropCanvas');
        
        // Baked canvas (persistent drawings)
        this.bakedCanvas = document.createElement('canvas');
        this.bakedCtx = this.bakedCanvas.getContext('2d');
        
        // Verifica se os elementos existem
        if (!this.mainCanvas || !this.drawCanvas) {
            console.error('❌ Canvas elements não encontrados!');
            return;
        }
        
        // Contexts
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.drawCtx = this.drawCanvas.getContext('2d');
        this.tempCtx = this.tempCanvas.getContext('2d');
        this.cropCtx = this.cropCanvas.getContext('2d');
        
        // Other elements
        this.fileInput = document.getElementById('fileInput');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.canvasWrapper = document.getElementById('canvasWrapper');
        
        // Image state
        this.originalImage = null;
        this.currentImage = null;
        this.rotation = 0;
        this.flipH = 1;
        this.flipV = 1;
        
        // Filters
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            invert: 0
        };
        
        // Tool state
        this.currentTool = 'cursor';
        this.isDrawing = false;
        this.brushColor = '#000000';
        this.brushSize = 5;
        this.lastX = 0;
        this.lastY = 0;
        this.startX = 0;
        this.startY = 0;
        
        // Zoom
        this.zoom = 100;
        this.minZoom = 10;
        this.maxZoom = 300;
        
        // Shapes
        this.shapeStart = { x: 0, y: 0 };
        
        // Text
        this.textInput = '';
        this.fontSize = 24;
        
        // Crop
        this.isCropping = false;
        this.cropStart = { x: 0, y: 0 };
        this.cropEnd = { x: 0, y: 0 };
        this.cropSelection = null;
        
        // History
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 30;
        
        // Objects (for movable elements like text)
        this.objects = [];
        this.selectedObject = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Inicializa
        this.init();
    }
    
    init() {
        console.log('⚙️ Configurando editor...');
        this.hideSplash();
        this.setupEventListeners();
        this.setupCanvas();
        this.setupGestures();
        this.updateUndoRedoButtons();
        console.log('✅ Configuração concluída!');
    }
    
    hideSplash() {
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.classList.add('hidden');
                setTimeout(() => splash.remove(), 500);
            }
        }, 1000);
    }
    
    setupEventListeners() {
        console.log('🔌 Configurando event listeners...');
        
        // Sidebar toggle (mobile)
        this.setupSidebar();
        
        // Upload buttons
        this.setupUpload();
        
        // Download buttons
        this.setupDownload();
        
        // Reset
        this.setupReset();
        
        // Undo/Redo
        this.setupUndoRedo();
        
        // Zoom
        this.setupZoom();
        
        // Adjustments
        this.setupAdjustments();
        
        // Filters
        this.setupFilters();
        
        // Tools - CORREÇÃO PRINCIPAL AQUI
        this.setupTools();
        
        // Color
        this.setupColor();
        
        // Text
        this.setupText();
        
        // Crop
        this.setupCrop();
        
        // Transform
        this.setupTransform();
        
        // Drawing events
        this.setupDrawingEvents();
        
        // Cursor position
        this.setupCursorTracking();
        
        // Keyboard shortcuts
        this.setupKeyboard();
        
        // Drag and drop
        this.setupDragDrop();
        
        console.log('✅ Event listeners configurados!');
    }
    
    setupSidebar() {
        const menuToggle = document.getElementById('menuToggle');
        const menuToggleRight = document.getElementById('menuToggleRight');
        const closeSidebar = document.getElementById('closeSidebar');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        const toggle = () => {
            if (sidebar) sidebar.classList.toggle('active');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
            if (menuToggle) menuToggle.classList.toggle('active');
        };
        
        if (menuToggle) menuToggle.addEventListener('click', toggle);
        if (menuToggleRight) menuToggleRight.addEventListener('click', toggle);
        if (closeSidebar) closeSidebar.addEventListener('click', toggle);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggle);
    }
    
    setupUpload() {
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadBtnDesktop = document.getElementById('uploadBtnDesktop');
        const uploadBtnPlaceholder = document.getElementById('uploadBtnPlaceholder');
        
        const triggerUpload = () => {
            console.log('📁 Abrindo seletor de arquivos...');
            this.fileInput.click();
        };
        
        if (uploadBtn) uploadBtn.addEventListener('click', triggerUpload);
        if (uploadBtnDesktop) uploadBtnDesktop.addEventListener('click', triggerUpload);
        if (uploadBtnPlaceholder) uploadBtnPlaceholder.addEventListener('click', triggerUpload);
        
        this.fileInput.addEventListener('change', (e) => {
            console.log('📂 Arquivo selecionado:', e.target.files[0]);
            if (e.target.files && e.target.files[0]) {
                this.loadImage(e.target.files[0]);
            }
        });
    }
    
    setupDownload() {
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadBtnDesktop = document.getElementById('downloadBtnDesktop');
        
        const triggerDownload = () => this.downloadImage();
        
        if (downloadBtn) downloadBtn.addEventListener('click', triggerDownload);
        if (downloadBtnDesktop) downloadBtnDesktop.addEventListener('click', triggerDownload);
    }
    
    setupReset() {
        const resetBtn = document.getElementById('resetBtn');
        const resetBtnDesktop = document.getElementById('resetBtnDesktop');
        
        const triggerReset = () => this.resetAll();
        
        if (resetBtn) resetBtn.addEventListener('click', triggerReset);
        if (resetBtnDesktop) resetBtnDesktop.addEventListener('click', triggerReset);
    }
    
    setupUndoRedo() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        const undoBtnMobile = document.getElementById('undoBtnMobile');
        const redoBtnMobile = document.getElementById('redoBtnMobile');
        
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
        if (redoBtn) redoBtn.addEventListener('click', () => this.redo());
        if (undoBtnMobile) undoBtnMobile.addEventListener('click', () => this.undo());
        if (redoBtnMobile) redoBtnMobile.addEventListener('click', () => this.redo());
    }
    
    setupZoom() {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const zoomReset = document.getElementById('zoomReset');
        const zoomSlider = document.getElementById('zoomSlider');
        
        if (zoomIn) zoomIn.addEventListener('click', () => this.setZoom(Math.min(this.zoom + 10, this.maxZoom)));
        if (zoomOut) zoomOut.addEventListener('click', () => this.setZoom(Math.max(this.zoom - 10, this.minZoom)));
        if (zoomReset) zoomReset.addEventListener('click', () => this.setZoom(100));
        if (zoomSlider) zoomSlider.addEventListener('input', (e) => this.setZoom(parseInt(e.target.value)));
        
        // Mouse wheel zoom
        this.canvasWrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -10 : 10;
            this.setZoom(Math.min(Math.max(this.zoom + delta, this.minZoom), this.maxZoom));
        }, { passive: false });
    }
    
    setupAdjustments() {
        ['brightness', 'contrast', 'saturation', 'blur'].forEach(adj => {
            const slider = document.getElementById(adj);
            const valueSpan = document.getElementById(adj + 'Value');
            
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.filters[adj] = e.target.value;
                    if (valueSpan) {
                        valueSpan.textContent = adj === 'blur' ? e.target.value + 'px' : e.target.value + '%';
                    }
                    this.applyFilters();
                    this.saveToHistory();
                });
            }
        });
    }
    
    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        console.log('🎭 Filtros encontrados:', filterButtons.length);
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.applyPresetFilter(e.target.dataset.filter);
                this.saveToHistory();
                if (this.isMobile) this.closeSidebar();
            });
        });
    }
    
    // ============================================
    // CORREÇÃO PRINCIPAL - SETUP TOOLS
    // ============================================
    setupTools() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        console.log('✏️ Ferramentas encontradas:', toolButtons.length);
        
        if (toolButtons.length === 0) {
            console.error('❌ Nenhum botão de ferramenta encontrado!');
            return;
        }
        
        toolButtons.forEach((btn, index) => {
            const toolName = btn.getAttribute('data-tool');
            console.log('🔧 Configurando ferramenta', index + 1, ':', toolName);
            
            btn.addEventListener('click', (e) => {
                console.log('🖱️ Clique na ferramenta:', toolName);
                
                // Remove active de todos
                document.querySelectorAll('.tool-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                // Adiciona active no clicado
                e.target.classList.add('active');
                
                // Define ferramenta atual
                this.currentTool = toolName;
                
                // Atualiza UI
                this.updateToolOptions();
                this.updateCanvasCursor();
                
                // Mostra mensagem
                const toolLabel = e.target.querySelector('.tool-label');
                const displayName = toolLabel ? toolLabel.textContent : toolName;
                this.showToast('Ferramenta: ' + displayName, 'info');
                
                console.log('✅ Ferramenta ativada:', this.currentTool);
                
                // Fecha sidebar no mobile
                if (this.isMobile) this.closeSidebar();
            });
        });
        
        console.log('✅ Todas as ferramentas configuradas!');
    }
    
    setupColor() {
        const brushColor = document.getElementById('brushColor');
        if (brushColor) brushColor.addEventListener('input', (e) => {
            this.brushColor = e.target.value;
        });
        
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.brushColor = e.target.dataset.color;
                const colorInput = document.getElementById('brushColor');
                if (colorInput) colorInput.value = this.brushColor;
            });
        });
        
        const brushSize = document.getElementById('brushSize');
        if (brushSize) brushSize.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            const display = document.getElementById('brushSizeValue');
            if (display) display.textContent = e.target.value + 'px';
        });
    }
    
    setupText() {
        const textInput = document.getElementById('textInput');
        if (textInput) textInput.addEventListener('input', (e) => {
            this.textInput = e.target.value;
        });
        
        const fontSize = document.getElementById('fontSize');
        if (fontSize) fontSize.addEventListener('input', (e) => {
            this.fontSize = parseInt(e.target.value);
            const display = document.getElementById('fontSizeValue');
            if (display) display.textContent = e.target.value + 'px';
        });
    }
    
    setupCrop() {
        const applyCrop = document.getElementById('applyCrop');
        const cancelCrop = document.getElementById('cancelCrop');
        
        if (applyCrop) applyCrop.addEventListener('click', () => this.applyCrop());
        if (cancelCrop) cancelCrop.addEventListener('click', () => this.cancelCrop());
    }
    
    setupTransform() {
        const rotateLeft = document.getElementById('rotateLeft');
        const rotateRight = document.getElementById('rotateRight');
        const flipH = document.getElementById('flipH');
        const flipV = document.getElementById('flipV');
        
        if (rotateLeft) rotateLeft.addEventListener('click', () => {
            this.rotation -= 90;
            this.applyTransform();
            this.saveToHistory();
        });
        
        if (rotateRight) rotateRight.addEventListener('click', () => {
            this.rotation += 90;
            this.applyTransform();
            this.saveToHistory();
        });
        
        if (flipH) flipH.addEventListener('click', () => {
            this.flipH *= -1;
            this.applyTransform();
            this.saveToHistory();
        });
        
        if (flipV) flipV.addEventListener('click', () => {
            this.flipV *= -1;
            this.applyTransform();
            this.saveToHistory();
        });
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
    
    setupCursorTracking() {
        this.drawCanvas.addEventListener('mousemove', (e) => {
            const coords = this.getCanvasCoordinates(e);
            const display = document.getElementById('cursorPos');
            if (display) {
                display.textContent = 'X: ' + Math.round(coords.x) + ' | Y: ' + Math.round(coords.y);
            }
        });
    }
    
    setupKeyboard() {
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
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.fileInput.click();
            }
            if (e.key === 'Escape' && this.isCropping) {
                this.cancelCrop();
            }
        });
    }
    
    setupDragDrop() {
        const canvasContainer = document.getElementById('canvasContainer');
        
        if (!canvasContainer) return;
        
        canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvasContainer.style.background = '#3a3a3a';
        });
        
        canvasContainer.addEventListener('dragleave', () => {
            canvasContainer.style.background = '#1a1a1a';
        });
        
        canvasContainer.addEventListener('drop', (e) => {
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
    
    setupCanvas() {
        this.mainCanvas.width = 800;
        this.mainCanvas.height = 600;
        this.drawCanvas.width = 800;
        this.drawCanvas.height = 600;
        this.tempCanvas.width = 800;
        this.tempCanvas.height = 600;
        this.cropCanvas.width = 800;
        this.cropCanvas.height = 600;
        this.bakedCanvas.width = 800;
        this.bakedCanvas.height = 600;
        this.showPlaceholder();
    }
    
    showPlaceholder() {
        this.mainCtx.fillStyle = '#2a2a2a';
        this.mainCtx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        
        this.mainCtx.fillStyle = '#4ecdc4';
        this.mainCtx.font = '24px Arial';
        this.mainCtx.textAlign = 'center';
        this.mainCtx.fillText('📁 Clique em "Abrir" para começar', this.mainCanvas.width / 2, this.mainCanvas.height / 2 - 20);
        this.mainCtx.font = '16px Arial';
        this.mainCtx.fillStyle = '#ffffff';
        this.mainCtx.fillText('ou arraste uma imagem', this.mainCanvas.width / 2, this.mainCanvas.height / 2 + 20);
        
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
                this.rotation = 0;
                this.flipH = 1;
                this.flipV = 1;
                this.resetFilters();
                this.renderImage();
                this.updateInfo(img);
                this.showLoading(false);
                this.hidePlaceholder();
                this.history = [];
                this.historyIndex = -1;
                this.saveToHistory();
                this.showToast('Imagem carregada!', 'success');
            };
            img.onerror = () => {
                this.showToast('Erro ao carregar!', 'error');
                this.showLoading(false);
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            this.showToast('Erro ao ler!', 'error');
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
        this.cropCanvas.width = width;
        this.cropCanvas.height = height;
        
        // Baked canvas stays in ORIGINAL image dimensions (unrotated)
        if (this.bakedCanvas.width !== this.currentImage.width || this.bakedCanvas.height !== this.currentImage.height) {
            this.bakedCanvas.width = this.currentImage.width;
            this.bakedCanvas.height = this.currentImage.height;
        }
        
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
        if (zoomInfo) zoomInfo.textContent = 'Zoom: ' + value + '%';
        
        this.updateZoom();
    }
    
    updateZoom() {
        const scale = this.zoom / 100;
        if (this.canvasContainer) {
            this.canvasContainer.style.transform = 'scale(' + scale + ')';
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
        
        const filterString = 'brightness(' + this.filters.brightness + '%) contrast(' + this.filters.contrast + '%) saturate(' + this.filters.saturation + '%) blur(' + this.filters.blur + 'px) grayscale(' + this.filters.grayscale + '%) sepia(' + this.filters.sepia + '%) invert(' + this.filters.invert + '%)';
        
        this.mainCtx.filter = filterString;
        
        // 1. Draw base image
        this.mainCtx.drawImage(
            this.currentImage,
            -this.currentImage.width / 2,
            -this.currentImage.height / 2
        );
        
        // 2. Draw baked drawings (transformed exactly like the image)
        this.mainCtx.drawImage(
            this.bakedCanvas,
            -this.currentImage.width / 2,
            -this.currentImage.height / 2
        );
        
        // 3. Draw movable objects (Text, etc.)
        this.objects.forEach(obj => {
            if (obj.type === 'text') {
                this.mainCtx.font = obj.fontSize + 'px Arial';
                this.mainCtx.fillStyle = obj.color;
                this.mainCtx.textBaseline = 'top';
                this.mainCtx.fillText(obj.text, obj.x - this.currentImage.width/2, obj.y - this.currentImage.height/2);
            }
        });
        
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
    
  // ============================================
// START DRAWING - CORRIGIDO PARA BORRACHA E CORTE
// ============================================
startDrawing(e) {
    const coords = this.getCanvasCoordinates(e);
    this.startX = coords.x;
    this.startY = coords.y;
    this.lastX = coords.x;
    this.lastY = coords.y;
    
    console.log('🖌️ Start drawing - Tool:', this.currentTool, 'Coords:', coords);
    
    // TEXTO - ATUALIZADO PARA MODELO DE OBJETOS
    if (this.currentTool === 'text') {
        if (this.textInput.trim()) {
            // Converter coordenadas de tela (coords) para coordenadas de imagem (untransformed)
            const imgCoords = this.screenToImageCoords(coords.x, coords.y);
            
            const newText = {
                type: 'text',
                text: this.textInput,
                x: imgCoords.x,
                y: imgCoords.y,
                fontSize: this.fontSize,
                color: this.brushColor,
                width: 0, // Será calculado
                height: this.fontSize
            };
            
            // Estimar largura para seleção posterior
            this.drawCtx.font = this.fontSize + 'px Arial';
            newText.width = this.drawCtx.measureText(this.textInput).width;
            
            this.objects.push(newText);
            this.applyFilters();
            this.saveToHistory();
            this.showToast('Texto adicionado! Use a ferramenta "Mover" para posicionar.', 'success');
        } else {
            this.showToast('Digite um texto primeiro!', 'error');
        }
        this.isDrawing = false;
        return;
    }
    
    // MOVER - SELECIONAR OBJETO
    if (this.currentTool === 'move') {
        const imgCoords = this.screenToImageCoords(coords.x, coords.y);
        
        // Encontrar objeto sob o cursor (do mais recente para o mais antigo)
        this.selectedObject = null;
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (obj.type === 'text') {
                if (imgCoords.x >= obj.x && imgCoords.x <= obj.x + obj.width &&
                    imgCoords.y >= obj.y && imgCoords.y <= obj.y + obj.height) {
                    this.selectedObject = obj;
                    this.dragOffset = {
                        x: imgCoords.x - obj.x,
                        y: imgCoords.y - obj.y
                    };
                    this.showToast('Movendo texto...', 'info');
                    break;
                }
            }
        }
        
        if (!this.selectedObject) {
            this.showToast('Clique em um texto para mover', 'info');
        }
        this.isDrawing = true; // Necessário para o evento mousemove
        return;
    }
    
    // CONTA-GOTAS
    if (this.currentTool === 'eyedropper') {
        this.pickColor(coords.x, coords.y);
        this.isDrawing = false;
        return;
    }
    
    // ============================================
    // CORTE (CROP) - CORRIGIDO
    // ============================================
    if (this.currentTool === 'crop') {
        this.isCropping = true;
        this.cropStart = { x: coords.x, y: coords.y };
        this.cropEnd = { x: coords.x, y: coords.y };
        
        // Mostrar painel de corte
        const cropPanel = document.getElementById('cropPanel');
        if (cropPanel) cropPanel.style.display = 'block';
        
        this.cropCanvas.style.display = 'block';
        this.cropCanvas.style.pointerEvents = 'none'; // Importante: Não bloquear eventos do drawCanvas
        
        // Limpar canvas de corte anterior
        this.cropCtx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
        
        this.showToast('Arraste para selecionar área', 'info');
        return;
    }
    
    // FORMAS (Retângulo, Círculo, Linha)
    if (['rectangle', 'circle', 'line'].includes(this.currentTool)) {
        this.isDrawing = true;
        this.shapeStart = { x: coords.x, y: coords.y };
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        return;
    }
    
    // ============================================
    // PINCEL - CORRIGIDO
    // ============================================
    if (this.currentTool === 'brush') {
        this.isDrawing = true;
        this.drawCtx.beginPath();
        this.drawCtx.moveTo(coords.x, coords.y);
        this.drawCtx.strokeStyle = this.brushColor;
        this.drawCtx.lineWidth = this.brushSize;
        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';
        this.drawCtx.globalCompositeOperation = 'source-over';
        return;
    }
    
    // ============================================
    // BORRACHA - CORRIGIDA PARA APAGAR DE VERDADE
    // ============================================
    if (this.currentTool === 'eraser') {
        this.isDrawing = true;
        this.drawCtx.beginPath();
        this.drawCtx.moveTo(coords.x, coords.y);
        this.drawCtx.strokeStyle = '#000000';
        this.drawCtx.lineWidth = this.brushSize;
        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';
        // IMPORTANTE: Desenhar como opaco na camada temporária
        // O apagamento real acontece no mergeLayers usando destination-out
        this.drawCtx.globalCompositeOperation = 'source-over';
        return;
    }
    
    // ============================================
    // NEON - NOVO (BÔNUS)
    // ============================================
    if (this.currentTool === 'neon') {
        this.isDrawing = true;
        this.drawCtx.beginPath();
        this.drawCtx.moveTo(coords.x, coords.y);
        this.drawCtx.strokeStyle = this.brushColor;
        this.drawCtx.lineWidth = this.brushSize;
        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';
        this.drawCtx.shadowBlur = 15;
        this.drawCtx.shadowColor = this.brushColor;
        this.drawCtx.globalCompositeOperation = 'source-over';
        return;
    }
}
    
   // ============================================
// DRAWING - CORRIGIDO PARA BORRACHA E CORTE
// ============================================
draw(e) {
    const coords = this.getCanvasCoordinates(e);
    
    // ============================================
    // CORTE (CROP) - Preview da seleção
    // ============================================
    if (this.isCropping && this.currentTool === 'crop') {
        this.cropEnd = { x: coords.x, y: coords.y };
        this.drawCropOverlay();
        return;
    }
    
    if (!this.isDrawing) return;
    
    // ============================================
    // PINCEL
    // ============================================
    if (this.currentTool === 'brush' || this.currentTool === 'neon') {
        this.drawCtx.lineTo(coords.x, coords.y);
        this.drawCtx.globalCompositeOperation = 'source-over';
        this.drawCtx.stroke();
    } 
    // BORRACHA
    else if (this.currentTool === 'eraser') {
        // Desenha como opaco (máscara)
        this.drawCtx.globalCompositeOperation = 'source-over';
        this.drawCtx.lineTo(coords.x, coords.y);
        this.drawCtx.stroke();
    } 
    // RETÂNGULO
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
    // CÍRCULO
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
    // LINHA
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
    
    // MOVER
    else if (this.currentTool === 'move' && this.selectedObject) {
        const imgCoords = this.screenToImageCoords(coords.x, coords.y);
        this.selectedObject.x = imgCoords.x - this.dragOffset.x;
        this.selectedObject.y = imgCoords.y - this.dragOffset.y;
        this.applyFilters();
    }
    
    this.lastX = coords.x;
    this.lastY = coords.y;
}
    
    // ============================================
// STOP DRAWING - CORRIGIDO PARA BORRACHA E CORTE
// ============================================
stopDrawing() {
    // ============================================
    // CORTE - Finalizar seleção
    // ============================================
    if (this.isCropping && this.currentTool === 'crop') {
        this.isCropping = false;
        // Manter cropCanvas visível até usuário aplicar ou cancelar
        this.showToast('Clique em Aplicar ou Cancelar', 'info');
        return;
    }
    
    if (!this.isDrawing) return;
    this.isDrawing = false;
    
    // FORMAS
    if (['rectangle', 'circle', 'line'].includes(this.currentTool)) {
        this.drawCtx.drawImage(this.tempCanvas, 0, 0);
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.mergeLayers();
        this.saveToHistory();
        this.showToast('Forma adicionada!', 'success');
    } 
    // ============================================
    // PINCEL E BORRACHA
    // ============================================
    else if (this.currentTool === 'brush' || this.currentTool === 'eraser' || this.currentTool === 'neon') {
        this.drawCtx.closePath();
        // Resetar sombras se for neon
        this.drawCtx.shadowBlur = 0;
        // Resetar composição para normal
        this.drawCtx.globalCompositeOperation = 'source-over';
        this.mergeLayers();
        this.saveToHistory();
    }
    
    // MOVER
    if (this.currentTool === 'move') {
        if (this.selectedObject) {
            this.saveToHistory();
            this.selectedObject = null;
        }
        this.isDrawing = false;
    }
}
    // ============================================
// DESENHAR SOBREPOSIÇÃO DE CORTE - CORRIGIDO
// ============================================
drawCropOverlay() {
    // Limpar canvas de corte
    this.cropCtx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
    
    // Calcular coordenadas da seleção
    const x = Math.min(this.cropStart.x, this.cropEnd.x);
    const y = Math.min(this.cropStart.y, this.cropEnd.y);
    const width = Math.abs(this.cropEnd.x - this.cropStart.x);
    const height = Math.abs(this.cropEnd.y - this.cropStart.y);
    
    // Só mostrar se tiver tamanho mínimo
    if (width > 10 && height > 10) {
        // Área selecionada (transparente)
        this.cropCtx.fillStyle = 'rgba(78, 205, 196, 0.2)';
        this.cropCtx.fillRect(x, y, width, height);
        
        // Borda da seleção
        this.cropCtx.strokeStyle = '#4ecdc4';
        this.cropCtx.lineWidth = 2;
        this.cropCtx.setLineDash([5, 5]);
        this.cropCtx.strokeRect(x, y, width, height);
        this.cropCtx.setLineDash([]);
        
        // Cantos da seleção (handles)
        const handleSize = 8;
        this.cropCtx.fillStyle = '#4ecdc4';
        this.cropCtx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        this.cropCtx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
        this.cropCtx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
        this.cropCtx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
        
        // Salvar seleção
        this.cropSelection = { x, y, width, height };
        
        console.log('✂️ Crop selection:', this.cropSelection);
    }
}
    
    // ============================================
// APLICAR CORTE - CORRIGIDO
// ============================================
applyCrop() {
    console.log('✂️ Aplicando corte...');
    
    if (!this.cropSelection || !this.currentImage) {
        this.showToast('Selecione uma área primeiro!', 'error');
        return;
    }
    
    const { x, y, width, height } = this.cropSelection;
    
    console.log('📏 Área de corte:', x, y, width, height);
    
    // Validar tamanho mínimo
    if (width < 10 || height < 10) {
        this.showToast('Área muito pequena!', 'error');
        return;
    }
    
    // ============================================
    // NOVO CROP - TRANSFORMAÇÃO CONSCIENTE
    // ============================================
    
    // 1. Criar um buffer com TUDO que está visível (imagem + desenhos + objetos) MAS SEM FILTROS
    const fullBuffer = document.createElement('canvas');
    fullBuffer.width = this.mainCanvas.width;
    fullBuffer.height = this.mainCanvas.height;
    const fbCtx = fullBuffer.getContext('2d');
    
    // Aplicar a mesma transformação do mainCanvas
    fbCtx.save();
    fbCtx.translate(fullBuffer.width / 2, fullBuffer.height / 2);
    const angleInRad = (this.rotation * Math.PI) / 180;
    fbCtx.rotate(angleInRad);
    fbCtx.scale(this.flipH, this.flipV);
    
    // Desenhar imagem e bakedCanvas
    fbCtx.drawImage(this.currentImage, -this.currentImage.width/2, -this.currentImage.height/2);
    fbCtx.drawImage(this.bakedCanvas, -this.currentImage.width/2, -this.currentImage.height/2);
    
    // Desenhar objetos
    this.objects.forEach(obj => {
        if (obj.type === 'text') {
            fbCtx.font = obj.fontSize + 'px Arial';
            fbCtx.fillStyle = obj.color;
            fbCtx.textBaseline = 'top';
            fbCtx.fillText(obj.text, obj.x - this.currentImage.width/2, obj.y - this.currentImage.height/2);
        }
    });
    fbCtx.restore();
    
    // 2. Extrair a área selecionada desse buffer transformado
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.drawImage(
        fullBuffer,
        x, y, width, height, // Área na tela
        0, 0, width, height  // Área no novo canvas
    );
    
    // 3. Atualizar imagem atual e RESETAR transformações
    const croppedDataUrl = tempCanvas.toDataURL();
    const img = new Image();
    img.onload = () => {
        this.currentImage = img;
        this.rotation = 0;
        this.flipH = 1;
        this.flipV = 1;

        // Limpar bakedCanvas e objetos pois agora estão "baked" na currentImage
        this.bakedCtx.clearRect(0, 0, this.bakedCanvas.width, this.bakedCanvas.height);
        this.objects = [];
        
        this.renderImage();
        this.cancelCrop();
        this.saveToHistory();
        this.showToast('Corte realizado e transformações aplicadas!', 'success');
    };
    img.src = croppedDataUrl;
}
    
    // ============================================
// CANCELAR CORTE - CORRIGIDO
// ============================================
cancelCrop() {
    console.log('❌ Cancelando corte...');
    
    this.isCropping = false;
    this.cropSelection = null;
    this.cropStart = { x: 0, y: 0 };
    this.cropEnd = { x: 0, y: 0 };
    
    // Limpar canvas de corte
    this.cropCtx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
    
    // Esconder cropCanvas
    this.cropCanvas.style.display = 'none';
    this.cropCanvas.style.pointerEvents = 'none';
    
    // Esconder painel de corte
    const cropPanel = document.getElementById('cropPanel');
    if (cropPanel) cropPanel.style.display = 'none';
    
    // Voltar para ferramenta cursor
    this.currentTool = 'cursor';
    this.updateToolOptions();
    this.updateCanvasCursor();
    
    // Atualizar botões de ferramenta
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === 'cursor');
    });
    
    this.showToast('Corte cancelado', 'info');
}
    pickColor(x, y) {
        try {
            const pixel = this.mainCtx.getImageData(x, y, 1, 1).data;
            const color = '#' + this.componentToHex(pixel[0]) + this.componentToHex(pixel[1]) + this.componentToHex(pixel[2]);
            this.brushColor = color;
            
            const colorInput = document.getElementById('brushColor');
            const colorInfo = document.getElementById('colorInfo');
            
            if (colorInput) colorInput.value = color;
            if (colorInfo) colorInfo.textContent = color;
            
            this.showToast('Cor: ' + color, 'info');
        } catch (err) {
            this.showToast('Erro ao pegar cor!', 'error');
        }
    }
    
    componentToHex(c) {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }
    
    // AJUDANTE: Converte coords de canvas/tela para coords da imagem base (original)
    screenToImageCoords(screenX, screenY) {
        if (!this.currentImage) return { x: screenX, y: screenY };
        
        const angleInRad = (this.rotation * Math.PI) / 180;
        
        // Simular a transformação inversa
        let x = screenX - this.mainCanvas.width / 2;
        let y = screenY - this.mainCanvas.height / 2;
        
        // Inverter escala
        x /= this.flipH;
        y /= this.flipV;
        
        // Inverter rotação
        const cos = Math.cos(-angleInRad);
        const sin = Math.sin(-angleInRad);
        const rx = x * cos - y * sin;
        const ry = x * sin + y * cos;
        
        return {
            x: rx + this.currentImage.width / 2,
            y: ry + this.currentImage.height / 2
        };
    }
    
    mergeLayers() {
        if (!this.currentImage) return;

        this.bakedCtx.save();
        
        // Aplicar a mesma transformação INVERSA do mainCanvas para converter coords de tela em coords de imagem
        const angleInRad = (this.rotation * Math.PI) / 180;
        
        // Ordem inversa do applyFilters
        this.bakedCtx.translate(this.currentImage.width / 2, this.currentImage.height / 2);
        this.bakedCtx.scale(this.flipH, this.flipV);
        this.bakedCtx.rotate(-angleInRad);
        this.bakedCtx.translate(-this.mainCanvas.width / 2, -this.mainCanvas.height / 2);
        
        // Se for borracha, usa destination-out
        if (this.currentTool === 'eraser') {
            this.bakedCtx.globalCompositeOperation = 'destination-out';
            this.bakedCtx.drawImage(this.drawCanvas, 0, 0);
        } else {
            this.bakedCtx.globalCompositeOperation = 'source-over';
            this.bakedCtx.drawImage(this.drawCanvas, 0, 0);
        }
        
        this.bakedCtx.restore();
        
        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        
        // Atualiza a visualização principal
        this.applyFilters();
    }
    
   // ============================================
// ATUALIZAR CURSOR - CORRIGIDO
// ============================================
updateCanvasCursor() {
    const cursors = {
        'cursor': 'default',
        'brush': 'crosshair',
        'eraser': 'cell',
        'rectangle': 'crosshair',
        'circle': 'crosshair',
        'line': 'crosshair',
        'text': 'text',
        'eyedropper': 'copy',
        'crop': 'crosshair',
        'neon': 'crosshair',
        'move': 'grab'
    };
    
    const cursor = cursors[this.currentTool] || 'default';
    this.drawCanvas.style.cursor = cursor;
    this.cropCanvas.style.cursor = cursor;
    
    // Se for ferramenta cursor ou move, habilita pointer events para interação?
    // Atualmente drawCanvas captura tudo.
}
    
  // ============================================
// ATUALIZAR OPÇÕES DE FERRAMENTA - CORRIGIDO
// ============================================
updateToolOptions() {
    const textPanel = document.getElementById('textPanel');
    const colorPanel = document.getElementById('colorPanel');
    const cropPanel = document.getElementById('cropPanel');
    
    // Painel de texto
    if (textPanel) {
        textPanel.style.display = this.currentTool === 'text' ? 'block' : 'none';
    }
    
    // Painel de cores
    if (colorPanel) {
        const showColor = ['brush', 'eraser', 'rectangle', 'circle', 'line', 'text', 'neon', 'move'].includes(this.currentTool);
        colorPanel.style.display = showColor ? 'block' : 'none';
    }
    
    // ============================================
    // PAINEL DE CORTE - CORRIGIDO
    // ============================================
    if (cropPanel) {
        cropPanel.style.display = this.currentTool === 'crop' ? 'block' : 'none';
    }
    
    // ============================================
    // VISIBILIDADE DO CROP CANVAS - CORRIGIDO
    // ============================================
    if (this.cropCanvas) {
        if (this.currentTool === 'crop' || this.isCropping) {
            this.cropCanvas.style.display = 'block';
            this.cropCanvas.style.pointerEvents = 'none';
        } else {
            this.cropCanvas.style.display = 'none';
        }
    }
    
    // Atualizar botão ativo
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === this.currentTool);
    });
    
    console.log('🔧 Tool options updated:', this.currentTool);
}
    
    closeSidebar() {
        if (this.isMobile) {
            const sidebar = document.getElementById('sidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            const menuToggle = document.getElementById('menuToggle');
            
            if (sidebar) sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        }
    }
    
    downloadImage() {
        if (!this.currentImage) {
            this.showToast('Carregue uma imagem!', 'error');
            return;
        }
        
        this.mergeLayers();
        
        const link = document.createElement('a');
        link.download = 'imagem-editada-' + Date.now() + '.png';
        link.href = this.mainCanvas.toDataURL('image/png');
        link.click();
        
        this.showToast('Imagem salva!', 'success');
    }
    
   // ============================================
// RESETAR TUDO - CORRIGIDO PARA LIMPAR CORTE
// ============================================
resetAll() {
    if (!this.originalImage) {
        this.showToast('Nenhuma imagem!', 'error');
        return;
    }
    
    // Cancelar corte se estiver ativo
    if (this.isCropping) {
        this.cancelCrop();
    }
    
    this.currentImage = this.originalImage;
    this.rotation = 0;
    this.flipH = 1;
    this.flipV = 1;
    this.resetFilters();
    this.renderImage();
    
    // Limpar todos os canvases
    this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    this.cropCtx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
    this.bakedCtx.clearRect(0, 0, this.bakedCanvas.width, this.bakedCanvas.height);
    this.objects = [];
    
    // Resetar filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'none') {
            btn.classList.add('active');
        }
    });
    
    // Resetar ferramenta
    this.currentTool = 'cursor';
    this.updateToolOptions();
    this.updateCanvasCursor();
    
    // Resetar histórico
    this.history = [];
    this.historyIndex = -1;
    this.saveToHistory();
    
    this.showToast('Resetado!', 'info');
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
            imageInfo.textContent = '📷 ' + img.width + ' x ' + img.height + ' px';
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
        const buttons = ['undoBtn', 'redoBtn', 'undoBtnMobile', 'redoBtnMobile'];
        
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                if (id.includes('undo')) {
                    btn.disabled = this.historyIndex <= 0;
                } else {
                    btn.disabled = this.historyIndex >= this.history.length - 1;
                }
            }
        });
    }
    
    loadFromHistory(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            this.mainCtx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }
    
    showToast(message, type) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'info');
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}