import Phaser from 'phaser';
import { paintMenu, addTitle, addSubtitle, addButton } from '../ui/menu.js';
import { hideHud } from '../ui/hud.js';
import { session } from '../state/MatchState.js';

export default class SummaryScene extends Phaser.Scene {
    constructor() {
        super('SummaryScene');
    }

    create() {
        hideHud();
        paintMenu(this);
        const match = session.match;
        addTitle(this, 120, 'Match Summary', 40);
        if (match) {
            addSubtitle(this, 210, match.summaryText());
            addSubtitle(
                this,
                320,
                `Outs ${match.outs}   ·   Khos ${match.khos}   ·   Fouls ${match.fouls}   ·   Dives ${match.dives}`
                + (match.phase === 'MIN_CHASE' || match.minChaseTimes.A
                    ? `\nMin chase  A ${fmt(match.minChaseTimes.A)}   B ${fmt(match.minChaseTimes.B)}`
                    : ''),
            );
        }
        addButton(this, 460, 'Play Again', () => this.scene.start('SetupScene'));
        addButton(this, 530, 'Main Menu', () => this.scene.start('MenuScene'));
    }
}

function fmt(ms) {
    if (ms == null) return '—';
    return `${(ms / 1000).toFixed(1)}s`;
}
