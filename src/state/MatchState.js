import { TURN_MS } from '../config/constants.js';

export default class MatchState {
    constructor(config) {
        this.difficulty = config.difficulty;
        this.turnMs = config.turnLength === 'official' ? TURN_MS.official : TURN_MS.practice;
        this.playerChoosesChase = config.playerChoosesChase;

        this.teamAScore = 0;
        this.teamBScore = 0;
        this.inning = 1;
        this.turnsPlayed = 0;
        this.chasingTeam = config.playerChoosesChase ? 'A' : 'B';
        this.timeLeftMs = this.turnMs;
        this.pointsThisTurn = 0;
        this.batchIndex = 0;
        this.aliveInBatch = 3;
        this.mustKho = false;
        this.foul = false;
        this.outs = 0;
        this.khos = 0;
        this.fouls = 0;
        this.dives = 0;
        this.phase = 'TURN';
        this.minChaseTimes = { A: null, B: null };
        this.minChaseElapsed = 0;
        this.touchedSitterWarned = [false, false, false];
        this.done = false;
        this.winner = null;
    }

    get playerIsChaser() {
        return this.chasingTeam === 'A';
    }

    get roleLabel() {
        return this.playerIsChaser ? 'You Chase' : 'You Defend';
    }

    get chasingLabel() {
        return this.chasingTeam === 'A' ? 'Team A chasing' : 'Team B chasing';
    }

    get defendersLeftNine() {
        return 3 - this.aliveInBatch + (2 - this.batchIndex) * 3;
    }

    get canDeclare() {
        if (!this.playerIsChaser || this.phase !== 'TURN') return false;
        const firstChase = this.turnsPlayed <= 1 && this.inning === 1;
        if (firstChase) return this.pointsThisTurn > 9;
        return this.inning === 2 && this.pointsThisTurn > 0;
    }

    tick(delta) {
        this.timeLeftMs = Math.max(0, this.timeLeftMs - delta);
        if (this.phase === 'MIN_CHASE' && this.minChaseTimes[this.chasingTeam] == null) {
            this.minChaseElapsed += delta;
        }
        return this.timeLeftMs <= 0;
    }

    scoreOut({ force = false } = {}) {
        if (!force && (this.foul || this.mustKho)) return false;

        this.pointsThisTurn += 1;
        this.outs += 1;
        if (this.chasingTeam === 'A') this.teamAScore += 1;
        else this.teamBScore += 1;

        if (this.phase === 'MIN_CHASE') {
            this.minChaseTimes[this.chasingTeam] = this.minChaseElapsed;
            return { scored: true, batchWiped: false, minChasePoint: true };
        }

        this.aliveInBatch -= 1;
        let batchWiped = false;
        if (this.aliveInBatch <= 0) {
            batchWiped = true;
            this.mustKho = true;
            this.batchIndex = (this.batchIndex + 1) % 3;
            this.aliveInBatch = 3;
            this.touchedSitterWarned = [false, false, false];
        }
        return { scored: true, batchWiped, minChasePoint: false };
    }

    recordKho() {
        this.khos += 1;
        this.mustKho = false;
        this.foul = false;
    }

    setFoul() {
        if (this.foul) return;
        this.foul = true;
        this.fouls += 1;
    }

    clearFoul() {
        this.foul = false;
    }

    /** @returns {{ kind: 'break' | 'summary' | 'minChase', title: string, body: string }} */
    endTurn() {
        if (this.phase === 'MIN_CHASE') {
            if (this.minChaseTimes[this.chasingTeam] == null) {
                this.minChaseTimes[this.chasingTeam] = this.minChaseElapsed || this.turnMs;
            }
            if (this.minChaseTimes.A != null && this.minChaseTimes.B != null) {
                this.done = true;
                this.winner = this.resolveMinChaseWinner();
                return {
                    kind: 'summary',
                    title: 'Minimum Chase Complete',
                    body: this.summaryText(),
                };
            }
            this.chasingTeam = this.chasingTeam === 'A' ? 'B' : 'A';
            this.resetClock();
            return {
                kind: 'minChase',
                title: 'Minimum Chase',
                body: `${this.roleLabel()}. First defender out wins the clock.`,
            };
        }

        this.turnsPlayed += 1;
        if (this.turnsPlayed >= 4) {
            if (this.teamAScore === this.teamBScore) {
                this.phase = 'MIN_CHASE';
                this.chasingTeam = 'A';
                this.resetClock();
                this.timeLeftMs = Math.min(this.turnMs, 90_000);
                return {
                    kind: 'minChase',
                    title: 'Scores Tied',
                    body: 'Minimum chase: first out, faster team wins. You chase first.',
                };
            }
            this.done = true;
            this.winner = this.teamAScore > this.teamBScore ? 'A' : 'B';
            return { kind: 'summary', title: 'Match Over', body: this.summaryText() };
        }

        this.chasingTeam = this.chasingTeam === 'A' ? 'B' : 'A';
        if (this.turnsPlayed === 2) this.inning = 2;
        this.resetClock();
        const interval = this.turnsPlayed === 2 ? 'Inning interval.' : 'Turn break.';
        return {
            kind: 'break',
            title: `${interval} Inning ${this.inning}`,
            body: `Score  A ${this.teamAScore}  –  B ${this.teamBScore}\nNext: ${this.roleLabel()}`,
        };
    }

    resetClock() {
        this.timeLeftMs = this.phase === 'MIN_CHASE' ? Math.min(this.turnMs, 90_000) : this.turnMs;
        this.pointsThisTurn = 0;
        this.batchIndex = 0;
        this.aliveInBatch = 3;
        this.mustKho = false;
        this.foul = false;
        this.minChaseElapsed = 0;
        this.touchedSitterWarned = [false, false, false];
    }

    resolveMinChaseWinner() {
        const a = this.minChaseTimes.A;
        const b = this.minChaseTimes.B;
        if (a === b) return 'DRAW';
        return a < b ? 'A' : 'B';
    }

    summaryText() {
        if (this.winner === 'DRAW') return `Draw  A ${this.teamAScore}  –  B ${this.teamBScore}`;
        const name = this.winner === 'A' ? 'Team A (You)' : 'Team B';
        return `${name} win  A ${this.teamAScore}  –  B ${this.teamBScore}`;
    }
}

export const session = {
    config: null,
    match: null,
    lastBreak: null,
};
