import Phaser from 'phaser';
import { paintMenu, addTitle, addSubtitle, addButton } from '../ui/menu.js';
import { hideHud } from '../ui/hud.js';
import { unlockAudio } from '../audio/sfx.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        hideHud();
        paintMenu(this);
        addTitle(this, 160, 'KHO KHO');
        addSubtitle(this, 230, 'Digital Edition  ·  Traditional rules  ·  Team A is you');
        addButton(this, 330, 'Start Match', () => {
            unlockAudio();
            this.scene.start('SetupScene');
        });
        addButton(this, 400, 'How to Play', () => this.scene.start('TutorialScene'));
    }
}
