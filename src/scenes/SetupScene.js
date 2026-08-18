import Phaser from 'phaser';
import { paintMenu, addTitle, addSubtitle, addButton, addChoiceRow } from '../ui/menu.js';
import { hideHud } from '../ui/hud.js';
import MatchState, { session } from '../state/MatchState.js';

export default class SetupScene extends Phaser.Scene {
    constructor() {
        super('SetupScene');
    }

    create() {
        hideHud();
        paintMenu(this);
        addTitle(this, 70, 'Match Setup', 40);
        addSubtitle(this, 120, 'Traditional KKFI  ·  You are Team A');

        const config = {
            difficulty: 'medium',
            turnLength: 'practice',
            playerChoosesChase: true,
        };

        this.add.text(540, 170, 'Difficulty', {
            fontSize: '16px', color: '#a5d6a7', fontFamily: 'system-ui, sans-serif',
        }).setOrigin(0.5);
        addChoiceRow(this, 210, ['Easy', 'Medium', 'Hard'], 1, (i) => {
            config.difficulty = ['easy', 'medium', 'hard'][i];
        });

        this.add.text(540, 270, 'Turn length', {
            fontSize: '16px', color: '#a5d6a7', fontFamily: 'system-ui, sans-serif',
        }).setOrigin(0.5);
        addChoiceRow(this, 310, ['Practice 2:00', 'Official 9:00'], 0, (i) => {
            config.turnLength = i === 1 ? 'official' : 'practice';
        });

        this.add.text(540, 370, 'Toss — you won. Choose:', {
            fontSize: '16px', color: '#a5d6a7', fontFamily: 'system-ui, sans-serif',
        }).setOrigin(0.5);
        addChoiceRow(this, 410, ['Chase first', 'Defend first'], 0, (i) => {
            config.playerChoosesChase = i === 0;
        });

        addButton(this, 500, 'Kick Off', () => {
            session.config = config;
            session.match = new MatchState(config);
            this.scene.start('GameScene');
        });
        addButton(this, 560, 'Back', () => this.scene.start('MenuScene'));
    }
}
