import Phaser from 'phaser';
import { paintMenu, addTitle, addButton } from '../ui/menu.js';
import { hideHud } from '../ui/hud.js';

const LINES = [
    'You are Team A. Chase on your turns, defend on theirs.',
    '',
    'CHASE — you are the yellow attacker. Tag blue defenders (1 point).',
    'Eight teammates sit on the lane, facing alternate sides.',
    'You cannot cross the central lane except in a FREE ZONE (the poles).',
    'Once you commit left or right, you cannot recede until a pole or Kho.',
    'Stand behind a sitter and press SPACE to Kho — they take over.',
    'After a batch of 3 is out, you must Kho before tagging the next 3.',
    'Illegal recede or lane cross is a foul: tags do not count until you',
    'reach a free zone or Kho. Shift / E to dive.',
    '',
    'DEFEND — WASD moves your highlighted runner. Tab (or 1/2/3) switches.',
    'Stay in court — leaving is out. Do not bump sitting chasers twice.',
    '',
    'Match: 2 innings × 2 turns. Practice clock 2:00 · official 9:00.',
];

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super('TutorialScene');
    }

    create() {
        hideHud();
        paintMenu(this);
        addTitle(this, 42, 'How to Play', 36);
        this.add.text(540, 78, LINES.join('\n'), {
            fontSize: '15px',
            color: '#dcedc8',
            fontFamily: 'system-ui, sans-serif',
            align: 'center',
            lineSpacing: 4,
            wordWrap: { width: 820 },
        }).setOrigin(0.5, 0);
        addButton(this, 590, 'Back', () => this.scene.start('MenuScene'));
    }
}
