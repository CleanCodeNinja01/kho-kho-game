import { COURT, COLORS, SQUARE_XS, SQUARE_FACING } from '../config/constants.js';

export function drawCourt(scene) {
    const g = scene.add.graphics();
    const { width, height, centerY, poleLeft, poleRight, poleRadius, squareSize } = COURT;

    for (let i = 0; i < 8; i += 1) {
        g.fillStyle(i % 2 === 0 ? COLORS.grass : COLORS.grassStripe, 1);
        g.fillRect(0, i * (height / 8), width, height / 8);
    }

    g.lineStyle(3, COLORS.line, 0.95);
    g.strokeRect(2, 2, width - 4, height - 4);

    g.lineStyle(6, COLORS.line, 0.35);
    g.lineBetween(poleLeft, centerY, poleRight, centerY);

    g.lineStyle(2, COLORS.line, 0.55);
    g.lineBetween(poleLeft, 8, poleLeft, height - 8);
    g.lineBetween(poleRight, 8, poleRight, height - 8);

    g.fillStyle(COLORS.pole, 1);
    g.fillCircle(poleLeft, centerY, poleRadius);
    g.fillCircle(poleRight, centerY, poleRadius);

    SQUARE_XS.forEach((x, i) => {
        g.lineStyle(2, COLORS.line, 0.7);
        g.strokeRect(x - squareSize / 2, centerY - squareSize / 2, squareSize, squareSize);
        g.lineStyle(2, 0xfff3c4, 0.85);
        const dir = SQUARE_FACING[i];
        g.lineBetween(x, centerY - 4 * dir, x, centerY + 14 * dir);
    });

    scene.add.text(poleLeft, 18, 'FREE ZONE', {
        fontSize: '11px', color: '#ffffff99', fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 0);
    scene.add.text(poleRight, 18, 'FREE ZONE', {
        fontSize: '11px', color: '#ffffff99', fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 0);

    return g;
}

export function spawnPoint(slot, half = 0) {
    const col = slot % 3;
    const x = 180 + col * 280 + (half === 1 ? 80 : 0);
    const y = half === 0
        ? 90 + slot * 18
        : COURT.height - 90 - slot * 18;
    return { x, y };
}
