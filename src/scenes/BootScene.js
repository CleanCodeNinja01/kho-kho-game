import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';

function circleTexture(scene, key, color, radius) {
    const g = scene.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(radius, radius, radius);
    g.lineStyle(2, 0x111111, 0.35);
    g.strokeCircle(radius, radius, radius - 1);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
}

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        circleTexture(this, 'chaser-sit', COLORS.sit, 12);
        circleTexture(this, 'chaser-active', COLORS.active, 12);
        circleTexture(this, 'defender', COLORS.defender, 11);
        this.scene.start('MenuScene');
    }
}
