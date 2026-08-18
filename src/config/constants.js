/** Traditional KKFI court at 40 px per metre → 1080 × 640 (27 m × 16 m). */

export const PX_PER_M = 40;

export const COURT = {
    width: 27 * PX_PER_M,
    height: 16 * PX_PER_M,
    centerY: 8 * PX_PER_M,
    poleLeft: 1.5 * PX_PER_M,
    poleRight: 25.5 * PX_PER_M,
    poleRadius: 10,
    squareSize: 24,
    laneHalf: 6,
    khoRange: 52,
    khoXSlack: 30,
};

export const SQUARE_XS = (() => {
    const start = COURT.poleLeft + 2.55 * PX_PER_M;
    const end = COURT.poleRight - 2.55 * PX_PER_M;
    const gap = (end - start) / 7;
    return Array.from({ length: 8 }, (_, i) => start + i * gap);
})();

/** 1 = down (positive Y), -1 = up. Adjacent sitters never face the same sideline. */
export const SQUARE_FACING = [1, -1, 1, -1, 1, -1, 1, -1];

export const TURN_MS = {
    practice: 2 * 60 * 1000,
    official: 9 * 60 * 1000,
};

export const COLORS = {
    grass: 0x2d5a27,
    grassStripe: 0x33662c,
    line: 0xffffff,
    pole: 0xe8e8e8,
    sit: 0xc0392b,
    active: 0xf1c40f,
    defender: 0x3498db,
    selected: 0x2ecc71,
    foul: 0xe74c3c,
};

export const DIFFICULTY = {
    easy: {
        defenderSpeed: 200,
        chaserSpeed: 225,
        aiChaseSpeed: 155,
        evadeSkill: 0.35,
        reactionMs: 260,
    },
    medium: {
        defenderSpeed: 185,
        chaserSpeed: 210,
        aiChaseSpeed: 195,
        evadeSkill: 0.65,
        reactionMs: 140,
    },
    hard: {
        defenderSpeed: 170,
        chaserSpeed: 205,
        aiChaseSpeed: 235,
        evadeSkill: 0.9,
        reactionMs: 70,
    },
};

export function isFreeZone(x) {
    return x <= COURT.poleLeft + 12 || x >= COURT.poleRight - 12;
}

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
