import { sfx } from '../audio/sfx.js';

export function paintMenu(scene) {
    scene.cameras.main.setBackgroundColor('#102416');
    const g = scene.add.graphics();
    g.fillStyle(0x1a3d24, 1);
    g.fillRect(0, 0, 1080, 640);
    g.lineStyle(2, 0xf1c40f, 0.35);
    g.lineBetween(80, 320, 1000, 320);
}

export function addTitle(scene, y, text, size = 52) {
    return scene.add.text(540, y, text, {
        fontSize: `${size}px`,
        color: '#f6d365',
        fontFamily: 'Georgia, "Times New Roman", serif',
    }).setOrigin(0.5);
}

export function addSubtitle(scene, y, text) {
    return scene.add.text(540, y, text, {
        fontSize: '18px',
        color: '#c8e6c9',
        fontFamily: 'system-ui, sans-serif',
        align: 'center',
        wordWrap: { width: 760 },
    }).setOrigin(0.5);
}

export function addButton(scene, y, label, onClick) {
    const t = scene.add.text(540, y, label, {
        fontSize: '22px',
        color: '#ffffff',
        backgroundColor: '#1f6b38',
        padding: { x: 28, y: 12 },
        fontFamily: 'system-ui, sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    t.on('pointerover', () => t.setStyle({ backgroundColor: '#2d8a4c' }));
    t.on('pointerout', () => t.setStyle({ backgroundColor: '#1f6b38' }));
    t.on('pointerdown', () => {
        sfx.click();
        onClick();
    });
    return t;
}

export function addChoiceRow(scene, y, labels, initialIndex, onChange) {
    const nodes = [];
    let selected = initialIndex;
    const refresh = () => {
        nodes.forEach((n, i) => {
            n.setStyle({ backgroundColor: i === selected ? '#c9a227' : '#2a4a34', color: i === selected ? '#1a1a1a' : '#ffffff' });
        });
    };
    labels.forEach((label, i) => {
        const t = scene.add.text(250 + i * 290, y, label, {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#2a4a34',
            padding: { x: 18, y: 10 },
            fontFamily: 'system-ui, sans-serif',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        t.on('pointerdown', () => {
            selected = i;
            refresh();
            sfx.click();
            onChange(i, label);
        });
        nodes.push(t);
    });
    refresh();
    return { nodes, get selected() { return selected; } };
}
