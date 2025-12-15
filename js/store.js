export class Store {
    constructor() {
        this.state = {
            games: [], // List of defined game types
            players: [], // List of known players
            activeGame: null, // Current running game state
            history: [], // Past games
            lastSelectedPlayers: [] // IDs of players selected in the last game
        };
        this.load();
    }

    load() {
        const stored = localStorage.getItem('point_counter_db');
        if (stored) {
            this.state = JSON.parse(stored);
        } else {
            this.seedDefaults();
        }
    }

    save() {
        localStorage.setItem('point_counter_db', JSON.stringify(this.state));
    }

    seedDefaults() {
        // Default games
        this.state.games = [
            { id: 'belote', name: 'Belote', winCondition: 'highest', target: 1000, color: '#ef4444', icon: '&nbsp;🃑&nbsp;' },
            { id: 'tarot', name: 'Tarot', winCondition: 'highest', target: 0, color: '#3b82f6', icon: '&nbsp;🃑&nbsp;' },
            { id: 'uno', name: 'UNO', winCondition: 'lowest', target: 500, color: '#eab308', icon: '&nbsp;🃑&nbsp;' },
            { id: '5R', name: 'Cinq rois', winCondition: 'lowest', target: 0, rounds: 13, color: '#eab308', icon: '&nbsp;🃑&nbsp;' },
        ];
        // Default players (example)
        this.state.players = [
            { id: 'p1', name: 'Joueur 1', avatar: '👤' },
            { id: 'p2', name: 'Joueur 2', avatar: '👤' }
        ];
        this.save();
    }

    getGames() {
        return this.state.games.sort((a, b) => a.name.localeCompare(b.name));
    }
    getPlayers() { return this.state.players; }

    addPlayer(name, avatar, photo = null) {
        const id = 'p_' + Date.now();
        this.state.players.push({ id, name, avatar: avatar || '👤', photo });
        this.save();
        return id;
    }

    updatePlayer(id, name, avatar, photo = null) {
        const player = this.state.players.find(p => p.id === id);
        if (player) {
            player.name = name;
            player.avatar = avatar;
            if (photo !== null) player.photo = photo; // Only update if provided (undefined means keep existing, null means clear? No let's assume passed value is new value)
            // Actually, if I pass undefined to update, I might want to keep it.
            // But from app controller I will likely pass string or empty.
            // Let's settle: if photo is passed (even empty string), update it.
            // If the user didn't upload a new one, we might re-pass the old one or just pass null.
            // Let's say: photo argument is the new photo data.
            this.save();
        }
    }

    createGame(config) {
        this.state.games.push({ ...config, id: 'g_' + Date.now() });
        this.save();
    }

    updateGame(id, config) {
        const gameIndex = this.state.games.findIndex(g => g.id === id);
        if (gameIndex !== -1) {
            this.state.games[gameIndex] = { ...this.state.games[gameIndex], ...config };
            this.save();
        }
    }

    deleteGame(id) {
        this.state.games = this.state.games.filter(g => g.id !== id);
        // Optional: Remove history associated with this game?
        // For now we keep history but it might display "Unknown Game" if we are not careful.
        // Let's leave history as is, but maybe filter it in stats.
        this.save();
    }

    startNewSession(gameId, playerIds, title, config = {}) {
        this.state.activeGame = {
            sessionId: 's_' + Date.now(),
            gameId,
            title: title || new Date().toLocaleString(),
            config, // Store the game configuration (limits)
            players: playerIds.map(pid => ({ id: pid, score: 0, rounds: [] })),
            currentRound: 1,
            history: [{}], // Start with one empty round
            startTime: Date.now()
        };
        this.save();
    }

    addEmptyRound() {
        if (!this.state.activeGame) return;
        this.state.activeGame.history.push({});
        this.state.activeGame.currentRound++;
        this.save();
    }

    updateSessionConfig(newConfig) {
        console.log('Updating session config:', newConfig);
        if (!this.state.activeGame) return;
        // Merge with existing config
        this.state.activeGame.config = { ...this.state.activeGame.config, ...newConfig };
        this.save();
    }

    updateRoundScore(roundIndex, playerId, value) {
        if (!this.state.activeGame) return;

        // Update history
        if (!this.state.activeGame.history[roundIndex]) {
            this.state.activeGame.history[roundIndex] = {};
        }
        this.state.activeGame.history[roundIndex][playerId] = value;

        // Recalculate totals
        this.recalculateTotals();
        this.save();
    }

    recalculateTotals() {
        if (!this.state.activeGame) return;

        // Reset scores
        this.state.activeGame.players.forEach(p => p.score = 0);

        // Sum up history
        this.state.activeGame.history.forEach(round => {
            this.state.activeGame.players.forEach(p => {
                const val = round[p.id] || 0;
                p.score += val;
            });
        });
    }

    addPlayerToSession(playerId) {
        if (!this.state.activeGame) return;

        // Add to players list with 0 score
        this.state.activeGame.players.push({ id: playerId, score: 0, rounds: [] });

        // Ensure history rows have this player (optional, but good for table rendering)
        // Actually, the view handles undefined, so we don't strict need to back-fill history
        // But let's Recalculate just in case
        this.recalculateTotals();
        this.save();
    }
    reorderSessionPlayers(newPlayerIdsStartOrder) {
        if (!this.state.activeGame) return;

        // Current players
        const currentPlayers = this.state.activeGame.players;

        // Reorder players array based on the list of IDs
        // Note: newPlayerIdsStartOrder might contain all players. 
        // We just map the IDs back to the player objects.

        const newOrder = newPlayerIdsStartOrder.map(pid => currentPlayers.find(p => p.id === pid)).filter(p => p !== undefined);

        // Safety check if something missing
        if (newOrder.length === currentPlayers.length) {
            this.state.activeGame.players = newOrder;
            this.save();
        }
    }

    removePlayerFromSession(playerId) {
        if (!this.state.activeGame) return;

        // Remove from players array
        this.state.activeGame.players = this.state.activeGame.players.filter(p => p.id !== playerId);

        // We ideally should remove their data from history too, 
        // effectively deleting the property from each round object to keep it clean.
        this.state.activeGame.history.forEach(round => {
            delete round[playerId];
        });

        this.recalculateTotals();
        this.save();
    }

    restoreSession() {
        return this.state.activeGame;
    }

    clearSession() {
        if (this.state.activeGame) {
            this.state.history.push(this.state.activeGame);
            this.state.activeGame = null;
            this.save();
        }
    }

    cancelSession() {
        this.state.activeGame = null;
        this.save();
    }
}
