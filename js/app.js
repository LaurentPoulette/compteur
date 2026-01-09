import { Store } from './store.js';
import { Router } from './router.js';
import { HomeView, PlayerSelectView, PlayerOrderView, ActiveGameView, CreateGameView, CreatePlayerView, EditPlayerView, GameSetupView, AddIngamePlayerView, RemoveIngamePlayerView, ReorderIngamePlayersView, ConfirmRemoveIngamePlayerView, ConfirmEndGameView, AboutView, StatisticsView, EditGameView, ConfirmDeleteGameView, ConfirmCancelGameView, GameOverView, UpdateLimitsView } from './views.js';

class App {
    constructor() {
        this.store = new Store();
        this.router = new Router(document.getElementById('app'));

        this.selectedPlayers = [];

        // Initialize persistent selection from store immediately
        if (this.store.state.lastSelectedPlayers && Array.isArray(this.store.state.lastSelectedPlayers)) {
            const allIds = new Set(this.store.getPlayers().map(p => p.id));
            this.store.state.lastSelectedPlayers.forEach(pid => {
                if (allIds.has(pid)) this.selectedPlayers.push(pid);
            });
        }

        this.init();
    }

    init() {
        // Register Routes
        this.router.register('home', () => HomeView(this.store));
        this.router.register('playerSelect', ({ gameId }) => PlayerSelectView(this.store, gameId));
        this.router.register('playerOrder', ({ gameId }) => PlayerOrderView(this.store, gameId));
        this.router.register('game', () => ActiveGameView(this.store));
        this.router.register('createGame', () => CreateGameView());
        this.router.register('createPlayer', () => CreatePlayerView());
        this.router.register('editPlayer', ({ playerId }) => EditPlayerView(this.store, playerId));
        this.router.register('gameSetup', ({ gameId }) => GameSetupView(this.store, gameId));
        this.router.register('addIngamePlayer', () => AddIngamePlayerView(this.store));
        this.router.register('removeIngamePlayer', () => RemoveIngamePlayerView(this.store));
        this.router.register('reorderPlayers', () => ReorderIngamePlayersView(this.store));
        this.router.register('confirmRemoveIngamePlayer', ({ playerId }) => ConfirmRemoveIngamePlayerView(this.store, playerId));
        this.router.register('confirmEndGame', () => ConfirmEndGameView(this.store));
        this.router.register('confirmCancelGame', () => ConfirmCancelGameView(this.store));
        this.router.register('gameOver', () => GameOverView(this.store));
        this.router.register('about', () => AboutView());
        this.router.register('statistics', () => StatisticsView(this.store));
        this.router.register('editGame', ({ gameId }) => EditGameView(this.store, gameId));
        this.router.register('confirmDeleteGame', ({ gameId }) => ConfirmDeleteGameView(this.store, gameId));
        this.router.register('updateLimits', () => UpdateLimitsView(this.store));
        this.router.register('updateLimits', () => UpdateLimitsView(this.store));
        // History is now part of Statistics


        // Restore state or go home
        const session = this.store.restoreSession();
        if (session) {
            this.router.navigate('game', {}, 'active');
        } else {
            this.router.navigate('home', {}, 'active');
        }

        // Global exposing for inline onclicks (simple implementation)
        window.app = this;

        this.initCropper();
    }

    initCropper() {
        const modalHtml = `
            <div id="cropper-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:2000; flex-direction:column; align-items:center; justify-content:center;">
                <h3 style="color:white; margin-bottom:10px;">Ajuster la photo</h3>
                
                <div id="crop-container" style="width:250px; height:250px; border:2px solid white; overflow:hidden; position:relative; background:#000;">
                    <img id="crop-image" style="position:absolute; top:0; left:0; transform-origin: top left; pointer-events:none;">
                    <!-- Overlay for touch events to avoid dragging image directly which can be tricky -->
                    <div id="crop-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; cursor:move;"></div>
                </div>
                
                <div style="margin-top:20px; width:250px;">
                    <label style="color:white;">Zoom</label>
                    <input type="range" id="crop-zoom" min="0.5" max="3" step="0.1" value="1" style="width:100%;">
                </div>
                
                <div style="margin-top:20px; display:flex; gap:20px;">
                    <button onclick="window.app.closeCropper()" style="padding:10px 20px; background:#eee; border:none; border-radius:5px;">Annuler</button>
                    <button onclick="window.app.confirmCrop()" style="padding:10px 20px; background:var(--primary-color); color:white; border:none; border-radius:5px;">Valider</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        this.cropper = {
            modal: document.getElementById('cropper-modal'),
            img: document.getElementById('crop-image'),
            overlay: document.getElementById('crop-overlay'),
            zoom: document.getElementById('crop-zoom'),
            callback: null,
            state: { x: 0, y: 0, scale: 1, imgW: 0, imgH: 0 }
        };

        // Drag Logic
        let isDragging = false;
        let startX, startY, initialImgX, initialImgY;

        const onStart = (clientX, clientY) => {
            isDragging = true;
            startX = clientX;
            startY = clientY;
            initialImgX = this.cropper.state.x;
            initialImgY = this.cropper.state.y;
        };

        const onMove = (clientX, clientY) => {
            if (!isDragging) return;
            const dx = clientX - startX;
            const dy = clientY - startY;

            this.cropper.state.x = initialImgX + dx;
            this.cropper.state.y = initialImgY + dy;
            this.updateCropperImage();
        };

        const onEnd = () => {
            isDragging = false;
        };

        // Touch
        this.cropper.overlay.addEventListener('touchstart', e => { e.preventDefault(); onStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        this.cropper.overlay.addEventListener('touchmove', e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        this.cropper.overlay.addEventListener('touchend', onEnd);

        // Mouse
        this.cropper.overlay.addEventListener('mousedown', e => { onStart(e.clientX, e.clientY); });
        window.addEventListener('mousemove', e => { onMove(e.clientX, e.clientY); });
        window.addEventListener('mouseup', onEnd);

        // Zoom
        this.cropper.zoom.addEventListener('input', e => {
            this.cropper.state.scale = parseFloat(e.target.value);
            this.updateCropperImage();
        });
    }

    openCropper(imageSrc, callback) {
        this.cropper.callback = callback;
        this.cropper.img.src = imageSrc;
        this.cropper.img.onload = () => {
            // Center and Fit logic
            const containerS = 250;
            const imgW = this.cropper.img.naturalWidth;
            const imgH = this.cropper.img.naturalHeight;

            // Initial scale to cover
            const scale = Math.max(containerS / imgW, containerS / imgH);

            this.cropper.state = {
                scale: scale,
                x: (containerS - imgW * scale) / 2,
                y: (containerS - imgH * scale) / 2,
                imgW: imgW,
                imgH: imgH
            };
            this.cropper.zoom.value = scale;
            this.cropper.zoom.min = scale * 0.5;
            this.cropper.zoom.max = scale * 3;

            this.updateCropperImage();
            this.cropper.modal.style.display = 'flex';
        };
    }

    closeCropper() {
        this.cropper.modal.style.display = 'none';
        this.cropper.img.src = '';
    }

    updateCropperImage() {
        const { x, y, scale } = this.cropper.state;
        this.cropper.img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }

    confirmCrop() {
        const containerS = 250;
        const canvas = document.createElement('canvas');
        canvas.width = containerS;
        canvas.height = containerS;
        const ctx = canvas.getContext('2d');

        // We need to draw what is visible in the 250x250 container
        // Image is drawn at x, y with scale.
        // So effectively:
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, containerS, containerS);

        const s = this.cropper.state.scale;
        const x = this.cropper.state.x; // offset of image top-left relative to container top-left
        const y = this.cropper.state.y;

        // drawImage(image, dx, dy, dWidth, dHeight)
        ctx.drawImage(this.cropper.img, x, y, this.cropper.state.imgW * s, this.cropper.state.imgH * s);

        // Final resize to 150x150 for storage
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 150;
        finalCanvas.height = 150;
        const fCtx = finalCanvas.getContext('2d');
        fCtx.drawImage(canvas, 0, 0, 150, 150);

        const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.85);
        if (this.cropper.callback) this.cropper.callback(dataUrl);
        this.closeCropper();
    }

    /* Actions attached to window.app */

    selectGame(gameId) {
        this.router.navigate('playerSelect', { gameId });
    }

    navigatePlayerOrder(gameId) {
        if (this.selectedPlayers.length === 0) {
            alert("Sélectionnez au moins un joueur !");
            return;
        }
        this.router.navigate('playerOrder', { gameId });
    }
    togglePlayer(playerId) {
        const index = this.selectedPlayers.indexOf(playerId);
        if (index !== -1) {
            this.selectedPlayers.splice(index, 1);
        } else {
            this.selectedPlayers.push(playerId);
        }
        this.updateSelectedPlayersUI();
    }

    movePlayer(index, direction) {
        if (direction === -1 && index > 0) {
            // Move Up
            [this.selectedPlayers[index], this.selectedPlayers[index - 1]] = [this.selectedPlayers[index - 1], this.selectedPlayers[index]];
        } else if (direction === 1 && index < this.selectedPlayers.length - 1) {
            // Move Down
            [this.selectedPlayers[index], this.selectedPlayers[index + 1]] = [this.selectedPlayers[index + 1], this.selectedPlayers[index]];
        }
        this.updateSelectedPlayersUI();
    }

    updateSelectedPlayersUI() {
        const listContainer = document.getElementById('selected-players-list');
        if (!listContainer) return;

        const players = this.store.getPlayers();

        if (this.selectedPlayers.length === 0) {
            listContainer.innerHTML = '<p style="color:#999; text-align:center; padding:10px;">Aucun joueur sélectionné</p>';
            return;
        }

        listContainer.innerHTML = this.selectedPlayers.map((pid, index) => {
            const p = players.find(pl => pl.id === pid);
            if (!p) return '';

            return `
                <div class="card draggable-item" draggable="true" data-index="${index}" style="display:flex; align-items:center; padding:10px; margin-bottom:10px; cursor: move; user-select: none; touch-action: none;">
                    <div style="margin-right:15px; cursor:move; font-size:1.2em; color:#ccc;">☰</div>
                    <div style="margin-right:10px; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
                        ${p.photo ? `<img src="${p.photo}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">` : `<span style="font-size:1.5em;">${p.avatar}</span>`}
                    </div>
                    <span style="flex:1; font-weight:bold;">${p.name}</span>
                </div>
            `;
        }).join('');

        this.initDragAndDrop();
    }

    initDragAndDrop() {
        const container = document.getElementById('selected-players-list');
        if (!container) return;

        let draggedItem = null;
        let originalIndex = null;

        const items = container.querySelectorAll('.draggable-item');

        const onDragStart = (e, index) => {
            draggedItem = items[index];
            originalIndex = index;
            e.dataTransfer?.setData('text/plain', index);
            draggedItem.classList.add('dragging-source');
        };

        const onDragEnd = () => {
            if (draggedItem) draggedItem.classList.remove('dragging-source');
            draggedItem = null;
            originalIndex = null;
            items.forEach(item => item.classList.remove('drag-over'));
        };

        const onDragOver = (e) => {
            e.preventDefault();
            const target = e.target.closest('.draggable-item');
            if (target && target !== draggedItem) {
                // Remove drag-over from all others
                items.forEach(item => item !== target && item.classList.remove('drag-over'));
                target.classList.add('drag-over');
            }
        };

        const onDrop = (e) => {
            e.preventDefault();
            const target = e.target.closest('.draggable-item');
            if (target && draggedItem) {
                const targetIndex = parseInt(target.dataset.index);
                const sourceIndex = originalIndex;

                if (sourceIndex !== targetIndex) {
                    // Update array - Remove from source, insert at target
                    const [removed] = this.selectedPlayers.splice(sourceIndex, 1);
                    this.selectedPlayers.splice(targetIndex, 0, removed);

                    // Allow UI update
                    this.updateSelectedPlayersUI();
                }
            }
        };

        // Standard Drag Events
        items.forEach((item, index) => {
            item.addEventListener('dragstart', (e) => onDragStart(e, index));
            item.addEventListener('dragend', onDragEnd);
        });

        container.addEventListener('dragover', onDragOver);
        container.addEventListener('drop', onDrop);

        // Touch Events for Mobile
        let touchStartIndex = null;
        let mirrorElement = null;
        let touchedItem = null;

        const onTouchStart = (e) => {
            const item = e.target.closest('.draggable-item');
            if (!item) return;

            touchedItem = item;
            touchStartIndex = parseInt(item.dataset.index);

            // Create "mirror" element (visual clone)
            mirrorElement = item.cloneNode(true);
            mirrorElement.classList.add('draggable-mirror');

            // Calculate position to center under finger or keep relative offset
            const rect = item.getBoundingClientRect();
            // We want the mirror to visually align initially
            mirrorElement.style.width = `${rect.width}px`;
            mirrorElement.style.left = `${rect.left}px`;
            mirrorElement.style.top = `${rect.top}px`;

            document.body.appendChild(mirrorElement);
            item.classList.add('dragging-source');
        };

        const onTouchMove = (e) => {
            if (!mirrorElement) return;
            e.preventDefault(); // Prevent scrolling based on CSS touch-action: none

            const touch = e.touches[0];

            // Move the mirror to wrap the finger
            mirrorElement.style.left = `${touch.clientX - mirrorElement.offsetWidth / 2}px`;
            mirrorElement.style.top = `${touch.clientY - mirrorElement.offsetHeight / 2}px`;

            const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
            const targetItem = elementUnder ? elementUnder.closest('.draggable-item') : null;

            // Visual feedback on potential target
            items.forEach(item => item.classList.remove('drag-over'));
            if (targetItem && targetItem !== touchedItem) {
                targetItem.classList.add('drag-over');
            }
        };

        const onTouchEnd = (e) => {
            if (!touchedItem) return;

            touchedItem.classList.remove('dragging-source');
            items.forEach(item => item.classList.remove('drag-over'));

            if (mirrorElement) {
                mirrorElement.remove();
                mirrorElement = null;
            }

            const changedTouch = e.changedTouches[0];
            const elementUnder = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
            const targetItem = elementUnder ? elementUnder.closest('.draggable-item') : null;

            if (targetItem) {
                const targetIndex = parseInt(targetItem.dataset.index);
                if (touchStartIndex !== null && targetIndex !== null && touchStartIndex !== targetIndex && !isNaN(targetIndex)) {
                    const [removed] = this.selectedPlayers.splice(touchStartIndex, 1);
                    this.selectedPlayers.splice(targetIndex, 0, removed);
                    this.updateSelectedPlayersUI();
                }
            }
            touchedItem = null;
            touchStartIndex = null;
        };

        items.forEach(item => {
            item.addEventListener('touchstart', onTouchStart, { passive: false });
            item.addEventListener('touchmove', onTouchMove, { passive: false });
            item.addEventListener('touchend', onTouchEnd);
        });
    }

    proceedToSetup(gameId) {
        if (this.selectedPlayers.length === 0) {
            alert("Sélectionnez au moins un joueur !");
            return;
        }
        this.router.navigate('gameSetup', { gameId });
    }

    finishSetupAndStart(gameId) {
        const scoreLimitInput = document.getElementById('setup-score-limit');
        const roundLimitInput = document.getElementById('setup-round-limit');

        const config = {
            target: scoreLimitInput.value ? parseInt(scoreLimitInput.value) : null,
            rounds: roundLimitInput.value ? parseInt(roundLimitInput.value) : null
        };

        const game = this.store.getGames().find(g => g.id === gameId);

        // Save selected players for next time (in store) - Order is preserved
        const playersList = [...this.selectedPlayers];
        this.store.state.lastSelectedPlayers = playersList;
        this.store.save();

        this.store.startNewSession(gameId, playersList, game.name, config);
        this.router.navigate('game');
    }

    handleImageUpload(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.openCropper(e.target.result, (croppedDataUrl) => {
                const previewId = inputElement.id + '-preview';
                const previewEl = document.getElementById(previewId);
                if (previewEl) {
                    previewEl.src = croppedDataUrl;
                    previewEl.style.display = 'block';
                }
            });
        };
        reader.readAsDataURL(file);
    }

    async startCamera(prefix) {
        const container = document.getElementById(`${prefix}-camera-container`);
        const video = document.getElementById(`${prefix}-camera-video`);
        const actions = document.getElementById(`${prefix}-photo-actions`);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("L'appareil photo n'est pas accessible (HTTPS requis ou pas de caméra détectée).");
            return;
        }

        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            video.srcObject = this.cameraStream;
            container.style.display = 'block';
            actions.style.display = 'none';
        } catch (err) {
            console.error("Erreur caméra:", err);
            alert("Erreur d'accès à la caméra: " + err.message);
        }
    }

    capturePhoto(prefix) {
        const video = document.getElementById(`${prefix}-camera-video`);
        const canvas = document.createElement('canvas');

        // Capture full frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        this.stopCamera(prefix);

        // Open cropper
        this.openCropper(dataUrl, (croppedDataUrl) => {
            const previewEl = document.getElementById(`${prefix}-photo-preview`);
            if (previewEl) {
                previewEl.src = croppedDataUrl;
                previewEl.style.display = 'block';
            }
        });
    }

    stopCamera(prefix) {
        const container = document.getElementById(`${prefix}-camera-container`);
        const actions = document.getElementById(`${prefix}-photo-actions`);

        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }

        if (container) container.style.display = 'none';
        if (actions) actions.style.display = 'block';
    }

    submitCreatePlayer() {
        const nameInput = document.getElementById('new-player-name');
        const avatarInput = document.getElementById('new-player-avatar');
        const previewEl = document.getElementById('new-player-photo-preview');

        const name = nameInput.value.trim();
        const avatar = avatarInput.value;
        const photo = (previewEl && previewEl.style.display !== 'none' && previewEl.src.startsWith('data:')) ? previewEl.src : null;

        if (name) {
            this.store.addPlayer(name, avatar, photo);
            this.router.back();
        } else {
            alert("Le nom est obligatoire");
        }
    }

    editPlayer(playerId) {
        this.router.navigate('editPlayer', { playerId });
    }

    submitEditPlayer() {
        const idInput = document.getElementById('edit-player-id');
        const nameInput = document.getElementById('edit-player-name');
        const avatarInput = document.getElementById('edit-player-avatar');
        const previewEl = document.getElementById('edit-player-photo-preview');

        const id = idInput.value;
        const name = nameInput.value.trim();
        const avatar = avatarInput.value;
        // Check if photo was explicitly removed or kept
        let photo = null;
        if (previewEl && previewEl.style.display !== 'none' && previewEl.src.startsWith('data:')) {
            photo = previewEl.src;
        } else if (previewEl && previewEl.style.display === 'none') {
            // Explicitly hidden -> means remove photo. 
            // We pass an empty string or specific flag to store to indicate removal?
            // Store expects 'null' to keep or new value.
            // Let's look at store: 
            // if (photo !== null) player.photo = photo; 
            // So if I pass null, it does nothing.
            // I need to be able to pass something that says "remove".
            // Let's pass empty string '' for removal.
            photo = '';
        } else {
            // Preview visible but not data URL? (Unlikely with our logic, unless we support external URLs later)
            // or it is existing persistence.
            // If we just navigated here, previewEl.src is the Existing photo.
            // If we didn't touch it, it is still the existing photo.
            // If it was existing photo, it is a data-url from store.
            // So the first check covers it.

            // Wait, if I enter edit, preview is src="data:..." and display:block.
            // check 1: src starts with data -> photo = src. Correct.
            // If I click "Remove", display becomes none, src becomes ''.
            // check 2: display none -> photo = ''. 
            // Then in store: if (photo !== null) ...
            // if photo is '', player.photo = '' -> Effectively removed.

            // BUT, what if there was NO photo initially? 
            // preview src='', display:none.
            // check 2 matches. photo = ''. Store sets player.photo = ''. result: no photo. Correct.
        }

        if (name) {
            this.store.updatePlayer(id, name, avatar, photo);
            this.router.back();
        } else {
            alert("Le nom est obligatoire");
        }
    }

    submitCreateGame() {
        const nameInput = document.getElementById('new-game-name');
        const typeInput = document.getElementById('new-game-type');
        const roundsInput = document.getElementById('new-game-rounds');


        const fixedScoreValue = document.getElementById('new-game-fixed-score-value');

        const name = nameInput.value.trim();

        if (name) {
            this.store.createGame({
                name,
                winCondition: typeInput.value,
                target: (document.getElementById('new-game-target').value) ? parseInt(document.getElementById('new-game-target').value) : 0,
                rounds: roundsInput.value ? parseInt(roundsInput.value) : null,
                fixedRoundScore: fixedScoreValue.value ? parseInt(fixedScoreValue.value) : null
            });
            this.router.back();
        } else {
            alert("Le nom est obligatoire");
        }
    }

    editGame(gameId) {
        this.router.navigate('editGame', { gameId });
    }

    submitEditGame() {
        const idInput = document.getElementById('edit-game-id');
        const nameInput = document.getElementById('edit-game-name');
        const typeInput = document.getElementById('edit-game-type');
        const roundsInput = document.getElementById('edit-game-rounds');


        const fixedScoreValue = document.getElementById('edit-game-fixed-score-value');

        const id = idInput.value;
        const name = nameInput.value.trim();

        if (name) {
            this.store.updateGame(id, {
                name,
                winCondition: typeInput.value,
                target: (document.getElementById('edit-game-target').value) ? parseInt(document.getElementById('edit-game-target').value) : 0,
                rounds: roundsInput.value ? parseInt(roundsInput.value) : null,
                fixedRoundScore: fixedScoreValue.value ? parseInt(fixedScoreValue.value) : null
            });
            this.router.back();
        } else {
            alert("Le nom est obligatoire");
        }
    }

    navigateDeleteGame(gameId) {
        this.router.navigate('confirmDeleteGame', { gameId });
    }

    executeDeleteGame(gameId) {
        this.store.deleteGame(gameId);
        this.router.back();
    }

    addRound() {
        this.store.addEmptyRound();
        const content = ActiveGameView(this.store);
        document.querySelector('.view:last-child').innerHTML = content;
    }

    updateRound(roundIndex, playerId, value) {
        // Treat empty as 0
        const numValue = value === "" ? 0 : parseInt(value);
        if (isNaN(numValue)) return;

        this.store.updateRoundScore(roundIndex, playerId, numValue);

        // Refresh Leaderboard Only
        const session = this.store.restoreSession();
        const game = this.store.getGames().find(g => g.id === session.gameId);

        // Update Check Value in Round Column if exists
        const checkValSpan = document.getElementById(`check-val-${roundIndex}`);
        const hasFixedScore = game && (game.fixedRoundScore !== null && game.fixedRoundScore !== undefined && game.fixedRoundScore !== 0);

        if (checkValSpan && hasFixedScore) {
            const roundData = session.history[roundIndex];
            let roundSum = 0;
            session.players.forEach(p => {
                const val = roundData[p.id];
                if (val !== undefined && val !== "") roundSum += parseInt(val);
            });
            const diff = game.fixedRoundScore - roundSum;
            checkValSpan.textContent = diff === 0 ? 'OK' : diff;
            checkValSpan.style.color = diff === 0 ? 'var(--primary-color)' : '#ef4444';
        }

        const isLowestWin = game && game.winCondition === 'lowest';
        const players = session.players.map(sp => {
            const info = this.store.getPlayers().find(p => p.id === sp.id);
            return { ...sp, ...info };
        });

        const sorted = [...players].sort((a, b) => isLowestWin ? a.score - b.score : b.score - a.score);

        const html = `
            <table class="leaderboard-table">
                <tbody>
                    <tr>
                        ${sorted.map((p, i) => {
            let themeClass = 'theme-default';

            if (i === 0) {
                themeClass = 'theme-first';
            } else if (i === sorted.length - 1 && sorted.length > 1) {
                themeClass = 'theme-last';
            }

            return `
                            <td class="leaderboard-cell">
                                 <div class="leaderboard-card ${themeClass}" style="flex-direction:column; justify-content:center;">
                                    <div style="margin-bottom:2px; font-weight:bold; font-size:0.9em;">
                                        <span class="leaderboard-rank">${i + 1}</span>:${p.score}
                                    </div>
                                    <div style="display:flex; align-items:center; gap:4px;">
                                        ${p.photo ? `<img src="${p.photo}" style="width:16px; height:16px; border-radius:50%; object-fit:cover;">` : `<span style="font-size:0.9em;">${p.avatar}</span>`} 
                                        <span class="name-full" style="font-size:0.85em;">${p.name}</span>
                                        <span class="name-initial" style="font-size:0.85em;">${p.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                </div>
                            </td>
                     `}).join('')}
                    </tr>
                </tbody>
            </table>
        `;

        const container = document.getElementById('leaderboard-content');
        if (container) container.innerHTML = html;

        // CHECK FOR GAME OVER CONDITIONS
        const reason = this.checkGameEndCondition(session, game);

        // AUTO-ADD NEW ROUND LOGIC
        // If NO game over and the LAST round is fully filled, add a new one automatically.
        if (!reason) {
            const currentRoundData = session.history[roundIndex];
            // We only care if we just updated the *last* round
            const isLastRound = parseInt(roundIndex) === session.history.length - 1;

            if (isLastRound) {
                const isRoundComplete = session.players.every(p => currentRoundData[p.id] !== undefined && currentRoundData[p.id] !== "");
                if (isRoundComplete) {
                    // Auto-add new round
                    // Warning: if we just update innerHTML of the whole view, focus will be lost.
                    // The requirement "when entering LAST score... create new round".
                    // Ideally we want to just append the row to the table without full re-render, 
                    // OR re-render but put focus on the first cell of the new row?

                    // Adding a round updates store history.
                    this.store.addEmptyRound();

                    // Re-render view to show new round
                    // To avoid jarring experience, maybe small delay? 
                    // Or immediate.
                    // IMPORTANT: We need to preserve focus or at least scrolling.
                    // Full re-render kills focus. 

                    // Let's re-render. User has finished typing. They might be looking for next box.
                    const content = ActiveGameView(this.store);
                    document.querySelector('.view:last-child').innerHTML = content;

                    // Attempt to scroll to bottom or focus new row?
                    // Let's rely on standard render.
                }
            }
        }
    }

    checkGameEndCondition(session, game) {
        // 1. Check if all scores for the current round are filled
        // We only check the LAST round (or all rounds, but typically the game ends on the latest activity)
        // Actually, we should check if ANY end condition is met, but usually we wait for the round to be "complete"
        // Let's check if the CURRENT round (last in history) is fully filled
        const currentRound = session.history[session.history.length - 1];
        if (!currentRound) return;

        const isRoundComplete = session.players.every(p => currentRound[p.id] !== undefined && currentRound[p.id] !== "");
        let reason = null;

        // Determine effective limits (session config overrides game defaults if present)
        const effectiveRounds = (session.config && session.config.rounds) !== undefined ? session.config.rounds : game.rounds;
        const effectiveTarget = (session.config && session.config.target) !== undefined ? session.config.target : game.target;

        if (isRoundComplete) {
            // Check Max Rounds
            if (effectiveRounds && session.history.length >= effectiveRounds) {
                reason = "Limite de tours atteinte";
            } else if (effectiveTarget && effectiveTarget > 0) {
                // Check if any player has reached the target
                const anyReached = session.players.some(p => p.score >= effectiveTarget);
                if (anyReached) reason = "Limite de score atteinte";
            }
        }

        const bannerContainer = document.getElementById('game-over-banner-bottom');
        const newRoundBtn = document.getElementById('btn-new-round');

        if (bannerContainer && newRoundBtn) {
            if (reason) {
                // Only show if not manually dismissed (we can track this in state or simply re-show it on update? 
                // The user request implies "Continue Game" dismisses it. 
                // If we check every update, it might reappear if we don't track dismissal.
                // For now, let's assume if condition is met, we show it, unless we are in "continued" mode.
                // But we don't have "continued" mode in state. 
                // Let's rely on the view re-render or explicit method.
                // Actually, if I type a score and it triggers, it should show.
                // "Continue Game" will just hide it DOM-wise? No, next update it will come back.
                // We need a flag in session? Or just let it be. 
                // Let's just update DOM. 
                // If "Continue Game" is clicked, we'll probably want to ignore this check until next round?
                // Let's keeping it simple: Update shows it. "Continue" hides it.
                // If user updates score again, it might reappear if condition still met. That seems correct.

                // Wait, if I click "Continue", I want to add a round.
                // So "Continue" just hides banner and shows button.
                // Then I click "Add Round", which adds round.
                // Then condition (rounds limit) might be valid or not depending on if limit was "reached" or "exceeded".
                // If limit was 10 rounds, and we are at 10. Banner shows.
                // "Continue". Banner hides. Button shows.
                // Click "New Round". Now 11 rounds.
                // Update checks... 11 >= 10. Banner shows again?
                // Probably yes. The user wants to "Force" continue.
                // Maybe we should only show banner if `!session.continued`?
                // Let's implement `continueGame` to set a flag in session?

                // For this step, let's just do the DOM update as requested.
                // If the user wants to truly "disable" the limit, they should probably change config.
                // But "Continuer la partie" implies ignoring the CURRENT stop.

                bannerContainer.innerHTML = `
                    <div style="background-color:var(--primary-color); color:white; padding:15px; border-radius:8px; margin-bottom:10px; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div style="font-size:1.2em; font-weight:bold;">🏁 Partie Terminée</div>
                        <div style="opacity:0.9; margin-bottom:10px;">${reason}</div>
                        <div style="display:flex; justify-content:center; gap:10px;">
                             <button onclick="window.app.navigateUpdateLimits()" style="background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.5); color:white; padding:8px 12px; font-size:0.9rem; border-radius:4px; flex:1;">Continuer</button>
                             <button onclick="window.app.navigateEndGame()" style="background:white; color:var(--primary-color); border:none; padding:8px 12px; font-size:0.9rem; border-radius:4px; font-weight:bold; flex:1;">Terminer</button>
                        </div>
                    </div>
                `;
                bannerContainer.style.display = 'block';
                newRoundBtn.style.display = 'none';
            } else {
                bannerContainer.innerHTML = '';
                bannerContainer.style.display = 'none';
                newRoundBtn.style.display = 'block';
            }
        }
        return reason;
    }

    navigateUpdateLimits() {
        this.router.navigate('updateLimits');
    }

    submitUpdateLimits() {
        const scoreLimitInput = document.getElementById('update-score-limit');
        const roundLimitInput = document.getElementById('update-round-limit');

        const newTarget = scoreLimitInput.value ? parseInt(scoreLimitInput.value) : null;
        const newRounds = roundLimitInput.value ? parseInt(roundLimitInput.value) : null;

        // Update session config
        this.store.updateSessionConfig({
            target: newTarget,
            rounds: newRounds
        });

        this.router.back();
    }

    navigateReorderPlayers() {
        this.reorderIngameState = null; // Clear state
        this.router.navigate('reorderPlayers');
    }

    cancelReorderIngame() {
        this.reorderIngameState = null;
        this.router.back();
    }

    saveReorderIngame() {
        if (this.reorderIngameState) {
            this.store.reorderSessionPlayers(this.reorderIngameState);
        }
        this.reorderIngameState = null;
        this.router.back();
    }

    updateReorderIngameUI() {
        const listContainer = document.getElementById('reorder-ingame-list');
        if (!listContainer || !this.reorderIngameState) return;

        const players = this.store.getPlayers();

        listContainer.innerHTML = this.reorderIngameState.map((pid, index) => {
            const p = players.find(pl => pl.id === pid);
            if (!p) return '';

            return `
                <div class="card draggable-ingame-item" draggable="true" data-index="${index}" style="display:flex; align-items:center; padding:10px; margin-bottom:10px; cursor: move; user-select: none; touch-action: none;">
                    <div style="margin-right:15px; cursor:move; font-size:1.2em; color:#ccc;">☰</div>
                    <div style="margin-right:10px; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
                        ${p.photo ? `<img src="${p.photo}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">` : `<span style="font-size:1.5em;">${p.avatar}</span>`}
                    </div>
                    <span style="flex:1; font-weight:bold;">${p.name}</span>
                </div>
            `;
        }).join('');

        this.initDragAndDropIngame();
    }

    initDragAndDropIngame() {
        const container = document.getElementById('reorder-ingame-list');
        if (!container) return;

        let draggedItem = null;
        let originalIndex = null;
        const items = container.querySelectorAll('.draggable-ingame-item');

        const onDragStart = (e, index) => {
            draggedItem = items[index];
            originalIndex = index;
            e.dataTransfer?.setData('text/plain', index);
            draggedItem.classList.add('dragging-source');
        };

        const onDragEnd = () => {
            if (draggedItem) draggedItem.classList.remove('dragging-source');
            draggedItem = null;
            originalIndex = null;
            items.forEach(item => item.classList.remove('drag-over'));
        };

        const onDragOver = (e) => {
            e.preventDefault();
            const target = e.target.closest('.draggable-ingame-item');
            if (target && target !== draggedItem) {
                items.forEach(item => item !== target && item.classList.remove('drag-over'));
                target.classList.add('drag-over');
            }
        };

        const onDrop = (e) => {
            e.preventDefault();
            const target = e.target.closest('.draggable-ingame-item');
            if (target && draggedItem) {
                const targetIndex = parseInt(target.dataset.index);
                const sourceIndex = originalIndex;

                if (sourceIndex !== targetIndex) {
                    const [removed] = this.reorderIngameState.splice(sourceIndex, 1);
                    this.reorderIngameState.splice(targetIndex, 0, removed);
                    this.updateReorderIngameUI();
                }
            }
        };

        // Standard Drag Events
        items.forEach((item, index) => {
            item.addEventListener('dragstart', (e) => onDragStart(e, index));
            item.addEventListener('dragend', onDragEnd);
        });

        container.addEventListener('dragover', onDragOver);
        container.addEventListener('drop', onDrop);

        // Touch Events for Mobile (Reusing logic structure but simplified)
        let touchStartIndex = null;
        let mirrorElement = null;
        let touchedItem = null;

        const onTouchStart = (e) => {
            const item = e.target.closest('.draggable-ingame-item');
            if (!item) return;

            touchedItem = item;
            touchStartIndex = parseInt(item.dataset.index);

            mirrorElement = item.cloneNode(true);
            mirrorElement.classList.add('draggable-mirror');
            const rect = item.getBoundingClientRect();
            mirrorElement.style.width = scrollX + rect.width + 'px'; // Fix width
            mirrorElement.style.left = rect.left + 'px';
            mirrorElement.style.top = rect.top + 'px';

            document.body.appendChild(mirrorElement);
            item.classList.add('dragging-source');
        };

        const onTouchMove = (e) => {
            if (!mirrorElement) return;
            e.preventDefault();
            const touch = e.touches[0];
            mirrorElement.style.left = `${touch.clientX - mirrorElement.offsetWidth / 2}px`;
            mirrorElement.style.top = `${touch.clientY - mirrorElement.offsetHeight / 2}px`;

            const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
            const targetItem = elementUnder ? elementUnder.closest('.draggable-ingame-item') : null;

            items.forEach(item => item.classList.remove('drag-over'));
            if (targetItem && targetItem !== touchedItem) {
                targetItem.classList.add('drag-over');
            }
        };

        const onTouchEnd = (e) => {
            if (!touchedItem) return;

            touchedItem.classList.remove('dragging-source');
            items.forEach(item => item.classList.remove('drag-over'));

            if (mirrorElement) {
                mirrorElement.remove();
                mirrorElement = null;
            }

            const changedTouch = e.changedTouches[0];
            const elementUnder = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
            const targetItem = elementUnder ? elementUnder.closest('.draggable-ingame-item') : null;

            if (targetItem) {
                const targetIndex = parseInt(targetItem.dataset.index);
                if (touchStartIndex !== null && targetIndex !== null && touchStartIndex !== targetIndex && !isNaN(targetIndex)) {
                    const [removed] = this.reorderIngameState.splice(touchStartIndex, 1);
                    this.reorderIngameState.splice(targetIndex, 0, removed);
                    this.updateReorderIngameUI();
                }
            }
            touchedItem = null;
            touchStartIndex = null;
        };

        items.forEach(item => {
            item.addEventListener('touchstart', onTouchStart, { passive: false });
            item.addEventListener('touchmove', onTouchMove, { passive: false });
            item.addEventListener('touchend', onTouchEnd);
        });
    }

    navigateAddPlayerInGame() {
        this.router.navigate('addIngamePlayer');
    }

    navigateRemovePlayerInGame() {
        this.router.navigate('removeIngamePlayer');
    }

    addPlayerToGame(playerId) {
        this.store.addPlayerToSession(playerId);
        this.router.navigate('game', {}, 'back');
    }

    // New method for the confirmation view action
    executeRemovePlayer(playerId) {
        this.store.removePlayerFromSession(playerId);
        // We need to go back twice ideally (Confirm -> RemoveList -> Game), 
        // OR just navigate explicitly to game.
        // If we navigate to 'game', we might lose history stack, but that's okay for now.
        // Better: store.restoreSession() is reliable.
        this.router.navigate('game', {}, 'back');
        // Note: 'back' animation might be weird if we jump multiple steps, but acceptable. 
        // Actually router 'back' just reverses animation direction.
        // It doesn't pop multiple states. 
        // Navigation to 'game' is safer.
    }

    // Deprecated / Unused: old method with confirm
    // removePlayerFromGame(playerId) {
    //     if (confirm("Êtes-vous sûr de vouloir supprimer ce joueur de la partie ?")) {
    //         this.store.removePlayerFromSession(playerId);
    //         this.router.navigate('game', {}, 'back');
    //     }
    // }

    updateStatisticsState(action, value) {
        if (!this.statsState) {
            this.statsState = { game: 'all', players: [], tab: 'comparator' };
        }

        if (action === 'game') {
            this.statsState.game = value;
        } else if (action === 'togglePlayer') {
            const playerId = value;
            const index = this.statsState.players.indexOf(playerId);
            if (index === -1) {
                this.statsState.players.push(playerId);
            } else {
                this.statsState.players.splice(index, 1);
            }
        } else if (action === 'tab') {
            this.statsState.tab = value;
        }

        // Re-render
        const html = StatisticsView(this.store);
        const app = document.getElementById('app');
        if (app) app.innerHTML = html;
    }

    toggleHistoryDetails(sessionId) {
        const el = document.getElementById(`history-details-${sessionId}`);
        if (el) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Navigate to confirmation page
    navigateEndGame() {
        this.router.navigate('confirmEndGame');
    }

    // Actual execution
    executeEndGame() {
        this.store.clearSession();
        // Clear history to prevent back button from returning to the game
        this.router.history = [];
        this.router.navigate('home');
    }

    navigateCancelGame() {
        this.router.navigate('confirmCancelGame');
    }

    executeCancelGame() {
        this.store.cancelSession();
        this.router.history = [];
        this.router.navigate('home');
    }

    // Old method deprecated
    // resetGame() { ... }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Viewport Height Fix
    const setAppHeight = () => {
        const doc = document.documentElement;
        doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    new App();
});
