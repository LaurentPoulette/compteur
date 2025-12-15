import { Store } from './store.js';
import { Router } from './router.js';
import { HomeView, PlayerSelectView, ActiveGameView, CreateGameView, CreatePlayerView, EditPlayerView, GameSetupView, AddIngamePlayerView, RemoveIngamePlayerView, ConfirmRemoveIngamePlayerView, ConfirmEndGameView, AboutView, StatisticsView, EditGameView, ConfirmDeleteGameView, ConfirmCancelGameView, GameOverView, UpdateLimitsView } from './views.js';

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
        this.router.register('game', () => ActiveGameView(this.store));
        this.router.register('createGame', () => CreateGameView());
        this.router.register('createPlayer', () => CreatePlayerView());
        this.router.register('editPlayer', ({ playerId }) => EditPlayerView(this.store, playerId));
        this.router.register('gameSetup', ({ gameId }) => GameSetupView(this.store, gameId));
        this.router.register('addIngamePlayer', () => AddIngamePlayerView(this.store));
        this.router.register('removeIngamePlayer', () => RemoveIngamePlayerView(this.store));
        this.router.register('confirmRemoveIngamePlayer', ({ playerId }) => ConfirmRemoveIngamePlayerView(this.store, playerId));
        this.router.register('confirmEndGame', () => ConfirmEndGameView(this.store));
        this.router.register('confirmCancelGame', () => ConfirmCancelGameView(this.store));
        this.router.register('gameOver', () => GameOverView(this.store));
        this.router.register('about', () => AboutView());
        this.router.register('statistics', () => StatisticsView(this.store));
        this.router.register('editGame', ({ gameId }) => EditGameView(this.store, gameId));
        this.router.register('confirmDeleteGame', ({ gameId }) => ConfirmDeleteGameView(this.store, gameId));
        this.router.register('updateLimits', () => UpdateLimitsView(this.store));

        // Restore state or go home
        const session = this.store.restoreSession();
        if (session) {
            this.router.navigate('game', {}, 'active');
        } else {
            this.router.navigate('home', {}, 'active');
        }

        // Global exposing for inline onclicks (simple implementation)
        window.app = this;
    }

    /* Actions attached to window.app */

    selectGame(gameId) {
        this.router.navigate('playerSelect', { gameId });
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
                    <span style="font-size:1.5em; margin-right:10px;">${p.avatar}</span>
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

    submitCreatePlayer() {
        const nameInput = document.getElementById('new-player-name');
        const avatarInput = document.getElementById('new-player-avatar');

        const name = nameInput.value.trim();
        const avatar = avatarInput.value;

        if (name) {
            this.store.addPlayer(name, avatar); // Need to update store.js to accept avatar if not already
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

        const id = idInput.value;
        const name = nameInput.value.trim();
        const avatar = avatarInput.value;

        if (name) {
            this.store.updatePlayer(id, name, avatar);
            this.router.back();
        } else {
            alert("Le nom est obligatoire");
        }
    }

    submitCreateGame() {
        const nameInput = document.getElementById('new-game-name');
        const typeInput = document.getElementById('new-game-type');
        const colorInput = document.getElementById('new-game-color');
        const iconInput = document.getElementById('new-game-icon');

        const roundsInput = document.getElementById('new-game-rounds');
        const fixedScoreCheck = document.getElementById('new-game-fixed-score-check');
        const fixedScoreValue = document.getElementById('new-game-fixed-score-value');

        const name = nameInput.value.trim();

        if (name) {
            this.store.createGame({
                name,
                winCondition: typeInput.value,
                icon: iconInput.value,
                target: (document.getElementById('new-game-target').value) ? parseInt(document.getElementById('new-game-target').value) : 0,
                color: colorInput.value,
                rounds: roundsInput.value ? parseInt(roundsInput.value) : null,
                fixedRoundScore: fixedScoreCheck.checked && fixedScoreValue.value ? parseInt(fixedScoreValue.value) : null
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
        const colorInput = document.getElementById('edit-game-color');
        const iconInput = document.getElementById('edit-game-icon');

        const roundsInput = document.getElementById('edit-game-rounds');
        const fixedScoreCheck = document.getElementById('edit-game-fixed-score-check');
        const fixedScoreValue = document.getElementById('edit-game-fixed-score-value');

        const id = idInput.value;
        const name = nameInput.value.trim();

        if (name) {
            this.store.updateGame(id, {
                name,
                winCondition: typeInput.value,
                icon: iconInput.value,
                color: colorInput.value,
                target: (document.getElementById('edit-game-target').value) ? parseInt(document.getElementById('edit-game-target').value) : 0,
                rounds: roundsInput.value ? parseInt(roundsInput.value) : null,
                fixedRoundScore: fixedScoreCheck.checked && fixedScoreValue.value ? parseInt(fixedScoreValue.value) : null
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

        // Update Check Column if exists
        const checkCell = document.getElementById(`check-cell-${roundIndex}`);
        const hasFixedScore = game && (game.fixedRoundScore !== null && game.fixedRoundScore !== undefined && game.fixedRoundScore !== 0);

        if (checkCell && hasFixedScore) {
            const roundData = session.history[roundIndex];
            let roundSum = 0;
            session.players.forEach(p => {
                const val = roundData[p.id];
                if (val !== undefined && val !== "") roundSum += parseInt(val);
            });
            const diff = game.fixedRoundScore - roundSum;
            checkCell.textContent = diff === 0 ? 'OK' : diff;
            checkCell.style.color = diff === 0 ? 'var(--primary-color)' : '#ef4444';
        }

        const isLowestWin = game && game.winCondition === 'lowest';
        const players = session.players.map(sp => {
            const info = this.store.getPlayers().find(p => p.id === sp.id);
            return { ...sp, ...info };
        });

        const sorted = [...players].sort((a, b) => isLowestWin ? a.score - b.score : b.score - a.score);

        const html = `
            <table class="leaderboard-table" style="width:100%; font-size:0.9em;">
                <tbody>
                    <tr>
                 ${sorted.map((p, i) => {
            let bgColor = '#e0f2fe'; // Default Blue-ish
            let borderColor = '#3b82f6';

            if (i === 0) {
                bgColor = '#dcfce7'; // Green-ish
                borderColor = '#22c55e';
            } else if (i === sorted.length - 1 && sorted.length > 1) {
                bgColor = '#fee2e2'; // Red-ish
                borderColor = '#ef4444';
            }

            return `
                        <td style="min-width:140px; padding:5px; border-right:1px solid #eee;">
                             <div style="background-color:${bgColor}; border:1px solid ${borderColor}; border-radius:8px; padding:5px 8px; display:flex; align-items:center; gap:8px;">
                                <span style="font-weight:bold; color:${borderColor}; opacity:0.8;">#${i + 1}</span>
                                <div style="font-size:1.2em;">${p.avatar}</div>
                                <div style="font-weight:600; font-size:0.9em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">
                                    <span class="name-full">${p.name}</span>
                                    <span class="name-initial">${p.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <span style="font-weight:bold; font-size:1.1em;">${p.score}</span>
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
        this.checkGameEndCondition(session, game);
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
                reason = "Nombre de tours maximum atteint";
            } else if (effectiveTarget && effectiveTarget > 0) {
                // Check if any player has reached the target
                const anyReached = session.players.some(p => p.score >= effectiveTarget);
                if (anyReached) reason = "Score cible atteint";
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

    updateStats() {
        const selectedEls = document.querySelectorAll('.stats-player-selector.selected');
        const selectedIds = Array.from(selectedEls).map(el => el.dataset.id);
        const resultsContainer = document.getElementById('stats-results');

        if (selectedIds.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align:center; color:#999; font-style:italic;">Sélectionnez au moins un joueur...</p>';
            return;
        }

        const history = this.store.state.history || [];
        const gamesDef = this.store.getGames();
        const playersDef = this.store.getPlayers();

        // Filter games where ALL selected players participated
        const commonGames = history.filter(h => {
            const playerIdsInGame = new Set(h.players.map(p => p.id));
            return selectedIds.every(id => playerIdsInGame.has(id));
        });

        if (commonGames.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align:center; color:#999;">Aucune partie commune trouvée.</p>';
            return;
        }

        // Helper to compute stats for a list of games
        const computeStats = (gameList) => {
            const stats = {};
            selectedIds.forEach(id => {
                stats[id] = { wins: 0, sumRank: 0, count: 0 };
            });

            gameList.forEach(g => {
                const gameDef = gamesDef.find(gd => gd.id === g.gameId);
                const isLowest = gameDef && gameDef.winCondition === 'lowest';

                // Sort players of this game to find ranks
                // create shallow copy to sort
                const sorted = [...g.players].sort((a, b) => isLowest ? a.score - b.score : b.score - a.score);

                selectedIds.forEach(id => {
                    const rankIndex = sorted.findIndex(p => p.id === id);
                    if (rankIndex !== -1) {
                        stats[id].count++;
                        stats[id].sumRank += (rankIndex + 1);
                        if (rankIndex === 0) stats[id].wins++;
                    }
                });
            });
            return stats;
        };

        const globalStats = computeStats(commonGames);

        // Render
        let html = `
            <div style="margin-bottom:20px; text-align:center; font-weight:bold;">
                ${commonGames.length} partie(s) commune(s)
            </div>
            
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <thead>
                    <tr style="background:#eee; font-size:0.9em;">
                        <th style="padding:5px;">Joueur</th>
                        <th style="padding:5px; text-align:center;">Victoires</th>
                        <th style="padding:5px; text-align:center;">Rang Moyen</th>
                        <th style="padding:5px; text-align:center;">Win %</th>
                    </tr>
                </thead>
                <tbody>
        `;

        selectedIds.forEach(id => {
            const s = globalStats[id];
            const pDef = playersDef.find(p => p.id === id);
            const avgRank = s.count ? (s.sumRank / s.count).toFixed(1) : '-';
            const winRate = s.count ? Math.round((s.wins / s.count) * 100) : 0;

            html += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:5px;">${pDef.avatar} ${pDef.name}</td>
                    <td style="padding:5px; text-align:center; font-weight:bold;">${s.wins}</td>
                    <td style="padding:5px; text-align:center;">${avgRank}</td>
                    <td style="padding:5px; text-align:center;">${winRate}%</td>
                </tr>
            `;
        });
        html += `</tbody></table>`;

        resultsContainer.innerHTML = html;
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
