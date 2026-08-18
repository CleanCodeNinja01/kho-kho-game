import Phaser from 'phaser';
import { paintMenu, addTitle, addSubtitle, addButton } from '../ui/menu.js';
import { hideHud } from '../ui/hud.js';
import { session } from '../state/MatchState.js';

export default class BreakScene extends Phaser.Scene {
    constructor() {
        super('BreakScene');
    }

    create() {
        hideHud();
        paintMenu(this);
        const info = session.lastBreak || { title: 'Break', body: '' };
        addTitle(this, 180, info.title, 36);
        addSubtitle(this, 300, info.body);
        const next = info.kind === 'summary' ? 'SummaryScene' : 'GameScene';
        const label = info.kind === 'minChase' ? 'Start Minimum Chase' : 'Continue';
        addButton(this, 430, label, () => this.scene.start(next));
        addButton(this, 500, 'Quit to Menu', () => this.scene.start('MenuScene'));
    }
}
