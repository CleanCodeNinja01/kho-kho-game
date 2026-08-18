function el(id) {
    return document.getElementById(id);
}

export function showHud() {
    const root = el('hud');
    if (root) root.hidden = false;
}

export function hideHud() {
    const root = el('hud');
    if (root) root.hidden = true;
}

export function formatTime(ms) {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function updateHud(match, extras = {}) {
    if (!match) return;
    setText('score-a', match.teamAScore);
    setText('score-b', match.teamBScore);
    setText('timer', formatTime(match.timeLeftMs));
    setText('inning', `${match.inning}/2`);
    setText('role', match.roleLabel);
    setText('batch', `${match.aliveInBatch}/3`);
    const remainingInCycle = match.phase === 'MIN_CHASE'
        ? '—'
        : `${(9 - (match.pointsThisTurn % 9)) % 9 || 9}/9`;
    setText('cycle', remainingInCycle);

    const foul = el('foul-flag');
    if (foul) foul.hidden = !match.foul;

    const must = el('must-kho');
    if (must) must.hidden = !match.mustKho;

    const prompt = el('action-prompt');
    if (prompt) {
        prompt.classList.toggle('is-on', Boolean(extras.canKho));
        prompt.textContent = extras.prompt || 'PRESS SPACE TO KHO!';
    }

    const declareBtn = el('declare-btn');
    if (declareBtn) declareBtn.hidden = !match.canDeclare;

    const hint = el('control-hint');
    if (hint) {
        hint.textContent = extras.hint || (match.playerIsChaser
            ? 'WASD move · Space kho · Shift dive · Esc pause'
            : 'WASD move defender · Tab switch · Esc pause');
    }
}

function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = String(value);
}
