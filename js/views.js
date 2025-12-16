export const HomeView = (store) => {
    const games = store.getGames();
    return `
        <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; z-index:1001; position:relative;">
            <h1>Jeux</h1>
            <button onclick="document.getElementById('home-menu').classList.toggle('active')" style="background:none; color:var(--text-color); padding:0; font-size:1.5rem;">&#9776;</button>
        </header>

        <!-- Menu dropdown -->
        <div id="home-menu" class="menu-overlay" onclick="if(event.target === this) this.classList.remove('active')">
            <div class="menu-content">
                <button class="menu-item" onclick="window.app.router.navigate('statistics')">Statistiques</button>
                <div style="height:1px; background:#eee; margin:5px 0;"></div>
                <button class="menu-item" onclick="window.app.router.navigate('about')">A propos</button>
            </div>
        </div>

        <div class="grid" style="padding-bottom:100px;">
            <!-- New Game Card -->
            <div class="card" onclick="window.app.router.navigate('createGame')" style="display:flex; align-items:center; justify-content:center; cursor:pointer; min-height:80px; border: 2px dashed #ccc; background:transparent;">
                 <div style="text-align:center; color:#888;">
                    <span style="font-size:2em;">+</span><br>Nouveau
                 </div>
            </div>

            ${games.map(g => `
                <div class="card" onclick="window.app.selectGame('${g.id}')" style="min-height:80px; display:flex; align-items:center; justify-content: space-between;">
                    <div style="display:flex; align-items:center;">
                        <h3 style="margin:0;">${g.name}</h3>
                    </div>
                    <div style="z-index:10;">
                        <span onclick="event.stopPropagation(); window.app.editGame('${g.id}')" style="cursor:pointer; font-size:1.2em; padding:10px;">✏️</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

export const PlayerSelectView = (store, gameId) => {
    const players = store.getPlayers();
    return `
        <header style="display:flex; align-items:center; margin-bottom: 20px;">
            <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
            <h1>Choix des joueurs</h1>
        </header>
        <p class="subtitle">Sélectionnez les joueurs pour la partie</p>
        <div class="grid" id="player-grid" style="padding-bottom: 100px;">
            <!-- New Player Card -->
            <div class="card" onclick="window.app.router.navigate('createPlayer')" style="display:flex; align-items:center; justify-content:center; cursor:pointer; min-height:80px; border: 2px dashed #ccc; background:transparent;">
                 <div style="text-align:center; color:#888;">
                    <span style="font-size:2em;">+</span><br>Nouveau
                 </div>
            </div>

            ${players.map(p => {
        const isSelected = window.app.selectedPlayers.includes(p.id);
        return `
                <div class="card player-card ${isSelected ? 'selected' : ''}" data-id="${p.id}" onclick="this.classList.toggle('selected'); window.app.togglePlayer('${p.id}')" style="cursor:pointer; padding:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:5px;">
                        <div style="width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
                             ${p.photo ? `<img src="${p.photo}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">` : `<span style="font-size:1.8em;">${p.avatar}</span>`}
                        </div>
                        <div onclick="event.stopPropagation(); window.app.editPlayer('${p.id}')" style="font-size:1.2rem; cursor:pointer;">✏️</div>
                    </div>
                    <div style="text-align:center;">
                        <h3 style="margin:0; font-size:1em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name}</h3>
                    </div>
                </div>
            `;
    }).join('')}
        </div>
        
        <div style="position:fixed; bottom:20px; left:20px; right:20px; z-index:100;">
            <button onclick="window.app.navigatePlayerOrder('${gameId}')" style="width:100%; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">Suivant</button>
        </div>
        <style>
            .player-card.selected { border: 2px solid var(--primary-color); background-color: #e0f2fe; }
        </style>
`;
};

export const PlayerOrderView = (store, gameId) => {
    return `
        <header style="display:flex; align-items:center; margin-bottom: 20px;">
             <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
            <h1>Ordre</h1>
        </header>
        <p class="subtitle">Définissez l'ordre de tour des joueurs</p>
        
        <div id="selected-players-list" style="margin-bottom:80px;">
             <!-- Populated by window.app.updateSelectedPlayersUI() -->
        </div>

        <script>
            setTimeout(() => window.app.updateSelectedPlayersUI(), 0);
        </script>

        <div style="position:fixed; bottom:20px; left:20px; right:20px; z-index:100;">
            <button onclick="window.app.proceedToSetup('${gameId}')" style="width:100%; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">Suivant</button>
        </div>
`;
};

export const ActiveGameView = (store) => {
    const session = store.restoreSession();
    if (!session) return `<div class="card">Erreur: Pas de session active.</div>`;

    const game = store.getGames().find(g => g.id === session.gameId);
    const isLowestWin = game && game.winCondition === 'lowest';
    const hasFixedScore = game && (game.fixedRoundScore !== null && game.fixedRoundScore !== undefined && game.fixedRoundScore !== 0);

    const players = session.players.map(sp => {
        const info = store.getPlayers().find(p => p.id === sp.id);
        return { ...sp, ...info };
    });

    // Check Game End
    let gameOverReason = null;
    const currentRound = session.history[session.history.length - 1];
    const isRoundComplete = currentRound && players.every(p => currentRound[p.id] !== undefined && currentRound[p.id] !== "");

    // Determine effective limits (session config overrides game defaults if present)
    const effectiveRounds = (session.config && session.config.rounds) !== undefined ? session.config.rounds : game.rounds;
    const effectiveTarget = (session.config && session.config.target) !== undefined ? session.config.target : game.target;

    if (isRoundComplete) {
        if (effectiveRounds && session.history.length >= effectiveRounds) {
            gameOverReason = "Limite de tours atteinte";
        } else if (effectiveTarget && effectiveTarget > 0) {
            // Check if anyone reached the target
            // Depending on winCondition (highest/lowest), logic might differ, 
            // but usually 'target' is a threshold.
            const anyReached = players.some(p => p.score >= effectiveTarget);
            if (anyReached) gameOverReason = "Limite de score atteinte";
        }
    }

    // Players for columns (fixed order)
    const tablePlayers = [...players];

    // Players for leaderboard (sorted)
    const getLeaderboardHTML = () => {
        const sorted = [...players].sort((a, b) => isLowestWin ? a.score - b.score : b.score - a.score);
        return `
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
                                 <div class="leaderboard-card ${themeClass}">
                                    <span class="leaderboard-rank">
                                        ${i + 1} 
                                        ${p.photo ? `<img src="${p.photo}" style="width:20px; height:20px; border-radius:50%; object-fit:cover; vertical-align:middle;">` : p.avatar} 
                                        ${p.score}
                                    </span>
                                    <br>
                                    <span class="name-full">${p.name}</span>
                                    <span class="name-initial">${p.name.charAt(0).toUpperCase()}</span>
                                    
                                </div>
                            </td>
                     `}).join('')}
            </tr>
        </tbody>
            </table>
    `;
    };

    return `
    <div style="display:flex; flex-direction:column; height:100%; overflow:hidden;">
        <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; z-index:1001; position:relative; flex-shrink:0;">

            <div style="display:flex; align-items:center; gap:10px; overflow:hidden; flex:1;">

                <h3 style="margin:0; font-size:1.3rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex-shrink:1;">${session.title}</h3>
                
                <div style="font-size:0.9em; color:#666; display:flex; align-items:center; gap:8px; white-space:nowrap; flex-shrink:0;">
                    <span style="border-left:1px solid #ccc; padding-left:8px;"><span style="font-size:1.2em;">🔄</span> ${((session.config && session.config.rounds !== undefined) ? session.config.rounds : game.rounds) || '∞'}</span>
                    <span><span style="font-size:1.2em;">🔢</span> ${((session.config && session.config.target !== undefined) ? session.config.target : game.target) || '∞'}</span>
                </div>
            </div>
            <button onclick="document.getElementById('game-menu').classList.toggle('active')" style="background:none; color:var(--text-color); padding:0; font-size:1.8rem; margin-left:10px;">&#9776;</button> 
        </header>

        <div id="game-over-banner-top" style="display:none;"></div>

        <!--Menu dropdown-->
        <div id="game-menu" class="menu-overlay" onclick="if(event.target === this) this.classList.remove('active')">
            <div class="menu-content">
                <div style="font-size:0.8em; color:#999; margin:5px 10px; font-weight:bold;">JOUEUR</div>
                <button class="menu-item" onclick="window.app.navigateAddPlayerInGame()">Ajouter un joueur</button>
                <button class="menu-item" onclick="window.app.navigateRemovePlayerInGame()">Supprimer un joueur</button>
                <button class="menu-item" onclick="window.app.navigateReorderPlayers()">Ordre des joueurs</button>
                
                <div style="height:1px; background:#eee; margin:5px 0;"></div>
                <div style="font-size:0.8em; color:#999; margin:5px 10px; font-weight:bold;">PARTIE</div>
                <button class="menu-item" onclick="window.app.navigateUpdateLimits()">Modifier les limites</button>
                <button class="menu-item" onclick="window.app.navigateEndGame()">Terminer la partie</button>
                <button class="menu-item danger" onclick="window.app.navigateCancelGame()">Annuler la partie</button>
            </div>
        </div>
        
        <div style="flex:1; overflow-y:auto; padding-bottom: 20px;">
            <div class="card" style="overflow-x: auto; max-width: 100%;">
                <table class="history-table" style="text-align: center;">
                    <thead style="position: sticky; top: 0; background: var(--surface-color); z-index: 1;">
                        <tr>
                            <th class="history-header">#</th>
                            ${tablePlayers.map(p => `
                                <th class="history-header">
                                    <div style="height:42px; display:flex; align-items:center; justify-content:center;">
                                        ${p.photo ? `<img src="${p.photo}" style="width:38px; height:38px; border-radius:50%; object-fit:cover;">` : `<span style="font-size:1.8em;">${p.avatar}</span>`}
                                    </div>
                                    <div style="font-size:0.9em;">
                                        <span class="name-full">${p.name}</span>
                                        <span class="name-initial">${p.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                </th>
                            `).join('')}
                            ${hasFixedScore ? '<th class="history-header-check">Check</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${session.history.map((round, roundIndex) => {
        let roundSum = 0;
        tablePlayers.forEach(p => {
            const val = round[p.id];
            if (val !== undefined && val !== "") roundSum += parseInt(val);
        });
        const checkValue = hasFixedScore ? (game.fixedRoundScore - roundSum) : null;

        return `
                            <tr>
                                <td class="history-cell-round">${roundIndex + 1}</td>
                                ${tablePlayers.map(p => `
                                    <td class="history-cell-score">
                                        <input type="number" 
                                               class="score-input"
                                               value="${round[p.id] !== undefined ? round[p.id] : ''}" 
                                               onchange="window.app.updateRound('${roundIndex}', '${p.id}', this.value)"
                                               onfocus="this.select()"
                                               placeholder="-">
                                    </td>
                                `).join('')}
                                ${hasFixedScore ? `<td id="check-cell-${roundIndex}" class="history-cell-check ${checkValue === 0 ? 'text-primary' : 'text-danger'}">${checkValue === 0 ? 'OK' : checkValue}</td>` : ''}
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>

        </div>

        <div id="sticky-leaderboard">
            <div style="padding:10px 10px 0 10px;">
                <div id="game-over-banner-bottom" style="display:${gameOverReason ? 'block' : 'none'};">
                        <div style="background-color:var(--primary-color); color:white; padding:15px; border-radius:8px; margin-bottom:10px; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="font-size:1.2em; font-weight:bold;">🏁 Partie Terminée</div>
                            <div style="opacity:0.9; margin-bottom:10px;">${gameOverReason}</div>
                            <div style="display:flex; justify-content:center; gap:10px;">
                                <button onclick="window.app.navigateUpdateLimits()" style="background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.5); color:white; padding:8px 12px; font-size:0.9rem; border-radius:4px; flex:1;">Continuer</button>
                                <button onclick="window.app.navigateEndGame()" style="background:white; color:var(--primary-color); border:none; padding:8px 12px; font-size:0.9rem; border-radius:4px; font-weight:bold; flex:1;">Terminer</button>
                            </div>
                        </div>
                </div>
                <button id="btn-new-round" onclick="window.app.addRound()" style="width:100%; padding: 12px; font-size: 1.1rem; margin-bottom:10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display:${gameOverReason ? 'none' : 'block'};">+ Nouveau Tour</button>
            </div>
            
            <div id="leaderboard-content" class="sticky-leaderboard-content">
                ${getLeaderboardHTML()}
            </div>
        </div>
            </div>
        </div>
    </div>
    `;
};
export const CreateGameView = () => `
    <header style="display:flex; align-items:center; margin-bottom: 20px;">
        <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
        <h1>Nouveau Jeu</h1>
    </header>
    <div class="card">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="new-game-name" style="font-weight:bold; width: 60%;">Nom du jeu</label>
            <input type="text" id="new-game-name" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
        </div>



        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="new-game-type" style="font-weight:bold; width: 60%;">Vainqueur</label>
            <select id="new-game-type" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right; background:white;">
                <option value="highest">Score le plus élevé</option>
                <option value="lowest">Score le moins élevé</option>
            </select>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="new-game-target" style="font-weight:bold; width:60%;">Limite de score <!--(opt)--></label>
            <input type="number" id="new-game-target" placeholder="Illimité" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="new-game-rounds" style="font-weight:bold; width:60%;">Limite de tours <!--(opt)--></label>
            <input type="number" id="new-game-rounds" placeholder="Illimité" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="new-game-fixed-score-value" style="font-weight:bold; width:60%;">Total score fixe par tour ?</label>
            <input type="number" id="new-game-fixed-score-value" placeholder="Optionnel" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
        </div>



        <button onclick="window.app.submitCreateGame()" style="width:100%">Créer</button>
    </div>
`;

export const EditGameView = (store, gameId) => {
    const game = store.getGames().find(g => g.id === gameId);
    if (!game) return '<div>Jeu introuvable</div>';

    return `
    <header style="display:flex; align-items:center; margin-bottom: 20px;">
        <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
        <h1>Modifier Jeu</h1>
    </header>
    <div class="card">
        <input type="hidden" id="edit-game-id" value="${game.id}">
        
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="edit-game-name" style="font-weight:bold; width: 60%;">Nom du jeu</label>
            <input type="text" id="edit-game-name" value="${game.name}" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
        </div>
        


        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="edit-game-type" style="font-weight:bold; width: 60%;">Vainqueur</label>
            <select id="edit-game-type" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; background:white; text-align:right;">
                <option value="highest" ${game.winCondition === 'highest' ? 'selected' : ''}>Score le plus élevé</option>
                <option value="lowest" ${game.winCondition === 'lowest' ? 'selected' : ''}>Score le moins élevé</option>
            </select>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="edit-game-target" style="font-weight:bold; width: 60%;">Limite de score <!--(opt)--></label>
            <input type="number" id="edit-game-target" value="${game.target || ''}" placeholder="Illimité" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="edit-game-rounds" style="font-weight:bold; width: 60%;">Limite de tours <!--(opt)--></label>
            <input type="number" id="edit-game-rounds" value="${game.rounds || ''}" placeholder="Illimité" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
            <label for="edit-game-fixed-score-value" style="font-weight:bold; width:60%;">Score total fixe par tour</label>
            <input type="number" id="edit-game-fixed-score-value" value="${game.fixedRoundScore || ''}" placeholder="Optionnel" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
        </div>



        <button onclick="window.app.submitEditGame()" style="width:100%; margin-bottom:15px;">Enregistrer</button>
        <button onclick="window.app.navigateDeleteGame('${game.id}')" style="width:100%; background-color:#ef4444; color:white;">Supprimer ce jeu</button>
    </div>
    <style>
        .game-icon-opt.selected { background-color: var(--primary-color) !important; color: white; }
    </style>
`;
};

export const ConfirmDeleteGameView = (store, gameId) => {
    const game = store.getGames().find(g => g.id === gameId);
    if (!game) return '<div>Jeu introuvable</div>';

    return `
    <header style="display:flex; align-items:center; margin-bottom: 20px;">
        <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
        <h1>Supprimer Jeu</h1>
    </header>
    <div class="card" style="text-align:center; padding: 40px 20px;">
        <div style="font-size:4em; margin-bottom:10px; color:${game.color};">🎲</div>
        <h2 style="margin-bottom:10px;">Supprimer ${game.name} ?</h2>
        <p style="color:#666; margin-bottom:30px;">Cette action est irréversible. L'historique des parties de ce jeu ne sera plus accessible correctement.</p>

        <button onclick="window.app.executeDeleteGame('${gameId}')" style="width:100%; background-color:#ef4444; margin-bottom:15px; padding:15px;">Supprimer définitivement</button>
        <button onclick="window.app.router.back()" style="width:100%; background-color:#ddd; color:#333; padding:15px;">Annuler</button>
    </div>
`;
};

export const CreatePlayerView = () => `
    <header style="display:flex; align-items:center; margin-bottom: 20px;">
        <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
        <h1>Nouveau Joueur</h1>
    </header>
    <div class="card">
        <label style="display:block; margin-bottom:20px;">
            Nom du joueur
            <input type="text" id="new-player-name" style="width:100%; padding:10px; margin-top:5px; border:1px solid #ccc; border-radius:5px;">
        </label>

        <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; margin-bottom:20px;">
            ${['👤', '🧑‍🚀', '🦸', '🦹', '🧙', '🧟', '🧛', '🧞', '🧜', '🧚'].map(emoji => `
                <div onclick="document.querySelectorAll('.avatar-opt').forEach(el=>el.classList.remove('selected')); this.classList.add('selected'); document.getElementById('new-player-avatar').value='${emoji}'; const p = document.getElementById('new-player-photo-preview'); p.src=''; p.style.display='none';" class="avatar-opt" style="font-size:2em; text-align:center; padding:5px; border-radius:5px; cursor:pointer; background:#eee;">${emoji}</div>
            `).join('')}
        </div>
        <input type="hidden" id="new-player-avatar" value="👤">

            <div style="margin-bottom:20px; text-align:center;">
                <div style="margin-bottom:5px; font-weight:bold;">Ou une photo</div>

                <!-- Camera Actions -->
                <div id="new-player-photo-actions" style="margin-bottom:10px;">
                    <button onclick="window.app.startCamera('new-player')" style="background:var(--primary-color); color:white; padding:8px 12px; border-radius:5px; border:none; margin-right:5px;">📷 Appareil Photo</button>
                    <button onclick="document.getElementById('new-player-photo').click()" style="background:#eee; color:#333; padding:8px 12px; border-radius:5px; border:1px solid #ccc;">📁 Fichier</button>
                </div>

                <!-- Camera View -->
                <div id="new-player-camera-container" style="display:none; margin-bottom:10px;">
                    <video id="new-player-camera-video" autoplay playsinline style="width:100%; max-width:250px; background:#000; border-radius:8px; margin-bottom:5px;"></video>
                    <br>
                        <button onclick="window.app.capturePhoto('new-player')" style="background:var(--primary-color); color:white; padding:10px 20px; border-radius:20px; border:none; font-weight:bold;">📸 Prendre Photo</button>
                        <button onclick="window.app.stopCamera('new-player')" style="background:#eee; color:#333; padding:10px; border-radius:5px; margin-left:10px;">Annuler</button>
                </div>

                <input type="file" id="new-player-photo" accept="image/*" onchange="window.app.handleImageUpload(this)" style="display:none;">
                    <img id="new-player-photo-preview" style="width:100px; height:100px; border-radius:50%; object-fit:cover; display:none; margin: 0 auto; border:3px solid var(--primary-color); margin-top:10px;">
                    </div>

                    <button onclick="window.app.submitCreatePlayer()" style="width:100%">Ajouter</button>
            </div>
            <style>
                .avatar-opt.selected {background - color: var(--primary-color) !important; color: white; }
            </style>
            `;

export const EditPlayerView = (store, playerId) => {
    const player = store.getPlayers().find(p => p.id === playerId);
    if (!player) return '<div>Joueur introuvable</div>';

    return `
            <header style="display:flex; align-items:center; margin-bottom: 20px;">
                <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                <h1>Modifier Joueur</h1>
            </header>
            <div class="card">
                <input type="hidden" id="edit-player-id" value="${player.id}">
                    <label style="display:block; margin-bottom:20px;">
                        Nom du joueur
                        <input type="text" id="edit-player-name" value="${player.name}" style="width:100%; padding:10px; margin-top:5px; border:1px solid #ccc; border-radius:5px;">
                    </label>

                    <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; margin-bottom:20px;">
                        ${['👤', '🧑‍🚀', '🦸', '🦹', '🧙', '🧟', '🧛', '🧞', '🧜', '🧚'].map(emoji => `
                <div onclick="document.querySelectorAll('.avatar-opt').forEach(el=>el.classList.remove('selected')); this.classList.add('selected'); document.getElementById('edit-player-avatar').value='${emoji}'; const p = document.getElementById('edit-player-photo-preview'); p.src=''; p.style.display='none';" class="avatar-opt ${player.avatar === emoji ? 'selected' : ''}" style="font-size:2em; text-align:center; padding:5px; border-radius:5px; cursor:pointer; background:#eee;">${emoji}</div>
            `).join('')}
                    </div>
                    <input type="hidden" id="edit-player-avatar" value="${player.avatar}">

                        <div style="margin-bottom:20px; text-align:center;">
                            <div style="margin-bottom:5px; font-weight:bold;">Ou une photo</div>

                            <!-- Camera Actions -->
                            <div id="edit-player-photo-actions" style="margin-bottom:10px;">
                                <button onclick="window.app.startCamera('edit-player')" style="background:var(--primary-color); color:white; padding:8px 12px; border-radius:5px; border:none; margin-right:5px;">📷 Appareil Photo</button>
                                <button onclick="document.getElementById('edit-player-photo').click()" style="background:#eee; color:#333; padding:8px 12px; border-radius:5px; border:1px solid #ccc;">📁 Fichier</button>
                            </div>

                            <!-- Camera View -->
                            <div id="edit-player-camera-container" style="display:none; margin-bottom:10px;">
                                <video id="edit-player-camera-video" autoplay playsinline style="width:100%; max-width:250px; background:#000; border-radius:8px; margin-bottom:5px;"></video>
                                <br>
                                    <button onclick="window.app.capturePhoto('edit-player')" style="background:var(--primary-color); color:white; padding:10px 20px; border-radius:20px; border:none; font-weight:bold;">📸 Prendre Photo</button>
                                    <button onclick="window.app.stopCamera('edit-player')" style="background:#eee; color:#333; padding:10px; border-radius:5px; margin-left:10px;">Annuler</button>
                            </div>

                            <input type="file" id="edit-player-photo" accept="image/*" onchange="window.app.handleImageUpload(this)" style="display:none;">
                                <img id="edit-player-photo-preview" src="${player.photo || ''}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; display:${player.photo ? 'block' : 'none'}; margin: 0 auto; border:3px solid var(--primary-color); margin-top:10px;">
                                    ${player.photo ? `<button onclick="document.getElementById('edit-player-photo-preview').src=''; document.getElementById('edit-player-photo-preview').style.display='none';" style="margin-top:5px; background:none; border:none; color:red; text-decoration:underline; font-size:0.8em; cursor:pointer;">Supprimer photo</button>` : ''}
                                </div>

                                <button onclick="window.app.submitEditPlayer()" style="width:100%">Enregistrer</button>
                        </div>
                        <style>
                            .avatar-opt.selected {background - color: var(--primary-color) !important; color: white; }
                        </style>
                        `;
};

export const GameSetupView = (store, gameId) => {
    const game = store.getGames().find(g => g.id === gameId);
    if (!game) return '<div>Jeu introuvable</div>';

    // Default values from game definition
    const defaultRounds = game.rounds || '';
    const defaultTarget = game.target || '';

    return `
                        <header style="display:flex; align-items:center; margin-bottom: 20px;">
                            <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                            <h1>Configuration</h1>
                        </header>
                        <div class="card" style="margin-bottom: 80px;">
                            <h2 style="margin-bottom:15px; color:var(--primary-color);">${game.name}</h2>
                            <p style="margin-bottom:20px;">Définissez les conditions de fin de partie.</p>

                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
                                <label for="setup-score-limit" style="font-weight:bold; width: 60%;">Limite de Score</label>
                                <input type="number" id="setup-score-limit" value="${defaultTarget}" placeholder="Ex: 1000" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
                            </div>

                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
                                <label for="setup-round-limit" style="font-weight:bold; width: 60%;">Nombre de tours</label>
                                <input type="number" id="setup-round-limit" value="${defaultRounds}" placeholder="Illimité" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
                            </div>
                        </div>

                        <div style="position:fixed; bottom:20px; left:20px; right:20px; z-index:100;">
                            <button onclick="window.app.finishSetupAndStart('${gameId}')" style="width:100%; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">Lancer la partie</button>
                        </div>
                        `;
};

export const UpdateLimitsView = (store) => {
    const session = store.restoreSession();
    if (!session) return '<div>Erreur</div>';

    // Get current effective limits
    const game = store.getGames().find(g => g.id === session.gameId);
    const currentRounds = (session.config && session.config.rounds !== undefined) ? session.config.rounds : (game.rounds || '');
    const currentTarget = (session.config && session.config.target !== undefined) ? session.config.target : (game.target || '');

    return `
                        <header style="display:flex; align-items:center; margin-bottom: 20px;">
                            <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                            <h1>Configuration</h1>
                        </header>
                        <div class="card" style="margin-bottom: 80px;">
                            <p style="margin-bottom:20px; color:#666;">Pour continuer, vous pouvez augmenter ou supprimer les limites de la partie.</p>

                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
                                <label for="update-score-limit" style="font-weight:bold; width:60%;">Limite de score</label>
                                <input type="number" id="update-score-limit" value="${currentTarget}" placeholder="Illimité" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
                            </div>

                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
                                <label for="update-round-limit" style="font-weight:bold; width:60%;">Limite de tours</label>
                                <input type="number" id="update-round-limit" value="${currentRounds}" placeholder="Illimité" style="width:30%; padding:10px; border:1px solid #ccc; border-radius:5px; text-align:right;">
                            </div>
                        </div>

                        <div style="position:fixed; bottom:20px; left:20px; right:20px; z-index:100;">
                            <button onclick="window.app.submitUpdateLimits()" style="width:100%; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">Valider et Continuer</button>
                        </div>
                        `;
};


export const AddIngamePlayerView = (store) => {
    // Show players NOT in current session
    const session = store.restoreSession();
    if (!session) return '<div>Erreur</div>';

    const existingIds = new Set(session.players.map(p => p.id));
    const availablePlayers = store.getPlayers().filter(p => !existingIds.has(p.id));

    return `
                        <header style="display:flex; align-items:center; margin-bottom: 20px;">
                            <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                            <h1>Ajouter un joueur</h1>
                        </header>
                        <div class="grid">
                            <!-- Option to create new -->
                            <div class="card" onclick="window.app.router.navigate('createPlayer')" style="display:flex; align-items:center; justify-content:center; cursor:pointer; min-height:100px; border: 2px dashed #ccc; background:transparent;">
                                <div style="text-align:center; color:#888;">
                                    <span style="font-size:2em;">+</span><br>Nouveau
                                </div>
                            </div>

                            ${availablePlayers.map(p => `
            <div class="card" onclick="window.app.addPlayerToGame('${p.id}')" style="cursor:pointer; text-align:center;">
                <span style="font-size:2em;">${p.avatar}</span>
                <h3>${p.name}</h3>
            </div>
        `).join('')}
                        </div>
                        `;
};

export const RemoveIngamePlayerView = (store) => {
    const session = store.restoreSession();
    if (!session) return '<div>Erreur</div>';

    // Show players IN current session
    const players = session.players.map(sp => {
        const info = store.getPlayers().find(p => p.id === sp.id);
        return { ...sp, ...info };
    });

    return `
                        <header style="display:flex; align-items:center; margin-bottom: 20px;">
                            <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                            <h1>Supprimer un joueur</h1>
                        </header>
                        <div class="card">
                            <p style="margin-bottom:20px; color: #ef4444;">Selectionnez le joueur à supprimer.</p>
                            <div class="grid">
                                ${players.map(p => `
                <div class="card" onclick="window.app.router.navigate('confirmRemoveIngamePlayer', { playerId: '${p.id}' })" style="cursor:pointer; text-align:center;">
                    <span style="font-size:2em;">${p.avatar}</span>
                    <h3>${p.name}</h3>
                </div>
            `).join('')}
                            </div>
                        </div>
                        <style>
                            .grid {display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
                        </style>
                        `;
};

export const ReorderIngamePlayersView = (store) => {
    const session = store.restoreSession();
    if (!session) return '<div>Partie introuvable</div>';

    // We want to re-use the updateSelectedPlayersUI logic but strictly for this view.
    // However, the existing logic is tied to "selectedPlayers" property of App.
    // We can just initialize App.selectedPlayers with session players?
    // Be careful not to mess up "New Game" selection.
    // A safer way is to have a dedicated logic or state for this view in App.
    // Or just make this view self-contained with its own script.

    // Let's use window.app.ingameReorderList as temporary state?
    // Or better: Let App handle it via a new method.

    // We need to initialize the list
    if (!window.app.reorderIngameState) {
        window.app.reorderIngameState = session.players.map(p => p.id);
    }

    // The view will be static initially, then populated by updateReorderIngameUI()
    // We can call updateReorderIngameUI() immediately after render (like we did for navigate).

    return `
                        <header style="display:flex; align-items:center; margin-bottom: 20px;">
                            <button onclick="window.app.cancelReorderIngame()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                            <h1>Ordre des joueurs</h1>
                        </header>
                        <div class="card" style="margin-bottom:80px;"> <!-- Margin bottom for fixed footer button space -->
                            <p style="margin-bottom:10px; color:#666; font-size:0.9em;">Glissez pour réorganiser.</p>
                            <div id="reorder-ingame-list"></div>
                        </div>
                        
                        <div style="position:fixed; bottom:20px; left:20px; right:20px; z-index:100;">
                            <button onclick="window.app.saveReorderIngame()" style="width:100%; padding: 15px; background:var(--primary-color); color:white; border:none; border-radius:10px; font-weight:bold; font-size:1.1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">Enregistrer l'ordre</button>
                        </div>

                        <!-- Script to init UI -->
                        <script>
                            setTimeout(() => window.app.updateReorderIngameUI(), 50);
                        </script>
                        `;
};

export const ConfirmRemoveIngamePlayerView = (store, playerId) => {
    const session = store.restoreSession();
    // find player in session or global store
    const player = store.getPlayers().find(p => p.id === playerId);

    if (!player) return '<div>Erreur: Joueur introuvable</div>';

    return `
                        <header style="display:flex; align-items:center; margin-bottom: 20px;">
                            <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                            <h1>Confirmation</h1>
                        </header>
                        <div class="card" style="text-align:center; padding: 40px 20px;">
                            <div style="font-size:4em; margin-bottom:10px;">${player.avatar}</div>
                            <h2 style="margin-bottom:10px;">${player.name}</h2>
                            <p style="color:#666; margin-bottom:30px;">Voulez-vous vraiment supprimer ce joueur de la partie en cours ? Son score sera perdu.</p>

                            <button onclick="window.app.executeRemovePlayer('${playerId}')" style="width:100%; background-color:#ef4444; margin-bottom:15px; padding:15px;">Supprimer définitivement</button>
                            <button onclick="window.app.router.back()" style="width:100%; background-color:#ddd; color:#333; padding:15px;">Annuler</button>
                        </div>
                        `;
};

export const ConfirmEndGameView = (store) => {
    return `
                        <header style="display:flex; align-items:center; margin-bottom: 20px;">
                            <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                            <h1>Fin de partie</h1>
                        </header>
                        <div class="card" style="text-align:center; padding: 40px 20px;">
                            <div style="font-size:4em; margin-bottom:10px;">🏁</div>
                            <h2 style="margin-bottom:10px;">Terminer la partie ?</h2>
                            <p style="color:#666; margin-bottom:30px;">La partie sera sauvegardée dans l'historique et vous retournerez à l'accueil.</p>

                            <button onclick="window.app.executeEndGame()" style="width:100%; background-color:var(--primary-color); margin-bottom:15px; padding:15px;">Terminer la partie</button>
                            <button onclick="window.app.router.back()" style="width:100%; background-color:#ddd; color:#333; padding:15px;">Annuler</button>
                        </div>
                        `;
};

export const ConfirmCancelGameView = (store) => {
    return `
                        <header style="display:flex; align-items:center; margin-bottom: 20px;">
                            <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                            <h1>Annuler la partie</h1>
                        </header>
                        <div class="card" style="text-align:center; padding: 40px 20px;">
                            <div style="font-size:4em; margin-bottom:10px; color:#ef4444;">🗑️</div>
                            <h2 style="margin-bottom:10px;">Tout effacer ?</h2>
                            <p style="color:#666; margin-bottom:30px;">Attention, si vous annulez, <strong>aucune donnée ne sera sauvegardée</strong>. L'historique de cette partie sera perdu.</p>

                            <button onclick="window.app.executeCancelGame()" style="width:100%; background-color:#ef4444; margin-bottom:15px; padding:15px;">Annuler sans sauvegarder</button>
                            <button onclick="window.app.router.back()" style="width:100%; background-color:#ddd; color:#333; padding:15px;">Retour au jeu</button>
                        </div>
                    </div>
                    `;
};

export const GameOverView = (store) => {
    const session = store.restoreSession();
    if (!session) return '<div>Partie non trouvée</div>';

    const game = store.getGames().find(g => g.id === session.gameId);
    const isLowestWin = game && game.winCondition === 'lowest';

    // Sort players
    const players = session.players.map(sp => {
        const info = store.getPlayers().find(p => p.id === sp.id);
        return { ...sp, ...info };
    }).sort((a, b) => isLowestWin ? a.score - b.score : b.score - a.score);

    const winner = players[0];

    return `
                    <div class="gameover-container">
                        <div class="gameover-icon">🏆</div>
                        <h1 class="gameover-title">${winner.name} a gagné !</h1>
                        <p class="gameover-subtitle">Partie terminée</p>

                        <div class="card">
                            <h3 class="gameover-section-title">Classement Final</h3>
                            <table class="leaderboard-table">
                                <tbody>
                                    ${players.map((p, i) => {
        let rankIcon = `#${i + 1}`;
        let size = '1em';

        if (i === 0) { rankIcon = '🥇'; size = '1.5em'; }
        if (i === 1) rankIcon = '🥈';
        if (i === 2) rankIcon = '🥉';

        let rankClass = 'rank-text-default';
        if (i === 0) rankClass = 'rank-text-0';
        else if (i === 1) rankClass = 'rank-text-1';
        else if (i === 2) rankClass = 'rank-text-2';

        return `
                        <tr>
                            <td class="gameover-rank-cell ${rankClass}">${rankIcon}</td>
                            <td class="gameover-name-cell">
                                <div class="gameover-name-flex">
                                    <span class="gameover-avatar">${p.avatar}</span>
                                    <span class="gameover-name">${p.name}</span>
                                </div>
                            </td>
                            <td class="gameover-score-cell">${p.score}</td>
                        </tr>
                 `}).join('')}
                                </tbody>
                            </table>
                        </div>

                        <button onclick="window.app.executeEndGame()" style="width:100%; margin-top:20px; padding:15px; font-size:1.1rem;">Retour à l'accueil</button>
                    </div>
                    `;
};

export const AboutView = () => `
                    <header style="display:flex; align-items:center; margin-bottom: 20px;">
                        <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                        <h1>A propos</h1>
                    </header>
                    <div class="card">
                        <h3>Compteur de Points</h3>
                        <p>Version 1.0</p>
                        <p style="margin-top:20px;">Une application simple et efficace pour compter les points de vos jeux de société favoris (Tarot, Belote, UNO, et bien d'autres).</p>
                        <p style="margin-top:20px;">Développé avec passion.</p>
                    </div>
                    `;

export const StatisticsView = (store) => {
    // Basic stats calculation
    const games = store.getGames();
    const history = store.state.history || [];
    const players = store.getPlayers();

    // 1. Games played count
    const statsByGame = games.map(g => {
        const count = history.filter(h => h.gameId === g.id).length;
        return { ...g, count };
    }).sort((a, b) => b.count - a.count);

    return `
                    <header style="display:flex; align-items:center; margin-bottom: 20px;">
                        <button onclick="window.app.router.back()" style="padding: 8px 12px; margin-right: 10px; display:flex; align-items:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
                        <h1>Statistiques</h1>
                    </header>

                    <div class="card">
                        <h3 style="margin-bottom:10px;">Parties Jouées</h3>
                        <table style="width:100%; border-collapse:collapse;">
                            ${statsByGame.map(g => `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px; border-left: 4px solid ${g.color}">${g.name}</td>
                    <td style="padding:10px; text-align:right; font-weight:bold;">${g.count}</td>
                </tr>
            `).join('')}
                        </table>
                    </div>

                    <div class="card">
                        <h3 style="margin-bottom:10px;">Comparateur</h3>
                        <p style="font-size:0.9em; color:#666; margin-bottom:10px;">Sélectionnez les joueurs pour voir leurs stats communes.</p>

                        <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap:10px; margin-bottom:20px;">
                            ${players.map(p => `
                <div class="stats-player-selector" data-id="${p.id}" onclick="this.classList.toggle('selected'); window.app.updateStats()" style="cursor:pointer; text-align:center; padding:5px; border:1px solid #eee; border-radius:8px;">
                    <div style="font-size:1.5em;">${p.avatar}</div>
                    <div style="font-size:0.8em; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                </div>
            `).join('')}
                        </div>

                        <div id="stats-results">
                            <p style="text-align:center; color:#999; font-style:italic;">Sélectionnez au moins un joueur...</p>
                        </div>
                    </div>
                    <style>
                        .stats-player-selector.selected {border: 2px solid var(--primary-color); background-color: #e0f2fe; }
                    </style>
                    `;
};
