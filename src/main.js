import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import TutorialScene from './scenes/TutorialScene.js';
import SetupScene from './scenes/SetupScene.js';
import GameScene from './scenes/GameScene.js';
import BreakScene from './scenes/BreakScene.js';
import SummaryScene from './scenes/SummaryScene.js';
import { COURT } from './config/constants.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: COURT.width,
    height: COURT.height,
    backgroundColor: '#2d5a27',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scene: [BootScene, MenuScene, TutorialScene, SetupScene, GameScene, BreakScene, SummaryScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

new Phaser.Game(config);
