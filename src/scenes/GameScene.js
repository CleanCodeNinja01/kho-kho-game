import Phaser from 'phaser';
import { COURT, SQUARE_XS, SQUARE_FACING, DIFFICULTY, isFreeZone } from '../config/constants.js';
import { session } from '../state/MatchState.js';
import Chaser from '../entities/Chaser.js';
import Defender from '../entities/Defender.js';
import { drawCourt, spawnPoint } from '../systems/court.js';
import { findKhoTarget, applyKho, updateDefenderAI, updateChaserAI } from '../systems/play.js';
import { showHud, hideHud, updateHud } from '../ui/hud.js';
import { sfx } from '../audio/sfx.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.match = session.match;
        if (!this.match) {
            this.scene.start('MenuScene');
            return;
        }

        this.diff = DIFFICULTY[this.match.difficulty];
        this.paused = false;
        this.ending = false;
        this.selectedIndex = 0;
        this.aiInput = { left: false, right: false, up: false, down: false };

        drawCourt(this);
        this.physics.world.setBounds(0, 0, COURT.width, COURT.height);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.tab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        this.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.input.keyboard.addCapture([
            Phaser.Input.Keyboard.KeyCodes.TAB,
            Phaser.Input.Keyboard.KeyCodes.SPACE,
        ]);

        const speed = this.match.playerIsChaser ? this.diff.chaserSpeed : this.diff.aiChaseSpeed;
        this.chasers = [];
        SQUARE_XS.forEach((x, i) => {
            this.chasers.push(new Chaser(this, x, COURT.centerY, {
                sitting: true,
                squareIndex: i,
                facing: SQUARE_FACING[i],
                speed,
            }));
        });

        const ax = this.match.chasingTeam === 'A' ? COURT.poleLeft : COURT.poleRight;
        this.active = new Chaser(this, ax, COURT.centerY - 48, {
            sitting: false,
            facing: -1,
            speed,
        });
        this.chasers.push(this.active);

        this.defenders = [];
        this.spawnBatch(true);

        this.pauseText = this.add.text(COURT.width / 2, COURT.height / 2, 'PAUSED\nEsc to resume', {
            fontSize: '36px',
            color: '#fff',
            align: 'center',
            fontFamily: 'Georgia, serif',
            backgroundColor: '#00000099',
            padding: { x: 24, y: 16 },
        }).setOrigin(0.5).setDepth(30).setVisible(false);

        showHud();
        this.bindHud();
        this.banner(this.match.roleLabel);

        this.events.once('shutdown', () => this.unbindHud());
    }

    banner(text) {
        const t = this.add.text(COURT.width / 2, 72, text, {
            fontSize: '30px',
            color: '#f1c40f',
            fontFamily: 'Georgia, serif',
            stroke: '#000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
            targets: t,
            alpha: 0,
            y: 44,
            delay: 700,
            duration: 900,
            onComplete: () => t.destroy(),
        });
    }

    spawnBatch(initial = false) {
        this.defenders.forEach((d) => d.destroy());
        this.defenders = [];
        const half = initial ? 0 : Math.random() < 0.5 ? 0 : 1;
        for (let i = 0; i < 3; i += 1) {
            const p = spawnPoint(i, half);
            this.defenders.push(new Defender(this, p.x, p.y, i, this.diff.defenderSpeed));
        }
        this.selectedIndex = 0;
        this.refreshSelection();
    }

    refreshSelection() {
        this.defenders.forEach((d, i) => {
            d.setSelected(!this.match.playerIsChaser && i === this.selectedIndex);
        });
    }

    readMove() {
        return {
            left: this.cursors.left.isDown || this.wasd.A.isDown,
            right: this.cursors.right.isDown || this.wasd.D.isDown,
            up: this.cursors.up.isDown || this.wasd.W.isDown,
            down: this.cursors.down.isDown || this.wasd.S.isDown,
        };
    }

    update(time, delta) {
        if (this.ending || !this.match) return;

        if (Phaser.Input.Keyboard.JustDown(this.esc)) {
            this.paused = !this.paused;
            this.pauseText.setVisible(this.paused);
            if (this.paused) this.physics.world.pause();
            else this.physics.world.resume();
        }
        if (this.paused) return;

        const timedOut = this.match.tick(delta);
        const sitters = this.chasers.filter((c) => c.sitting);
        const khoTarget = findKhoTarget(this.active, sitters);

        if (this.match.playerIsChaser) {
            this.active.speed = this.diff.chaserSpeed;
            this.active.drive(this.readMove(), this.match, time, () => this.triggerFoul());
            if (Phaser.Input.Keyboard.JustDown(this.shift) || Phaser.Input.Keyboard.JustDown(this.eKey)) {
                if (this.active.tryDive(time)) this.match.dives += 1;
            }
            if (Phaser.Input.Keyboard.JustDown(this.space) && khoTarget) this.doKho(khoTarget);
            this.defenders.forEach((d) => updateDefenderAI(d, this.active, this.diff.evadeSkill, time));
        } else {
            const intent = updateChaserAI(
                this.active,
                this.defenders,
                sitters,
                this.aiInput,
                time,
                this.diff.evadeSkill,
            );
            this.active.speed = this.diff.aiChaseSpeed;
            if (this.match.mustKho) {
                const sitter = sitters[0];
                if (sitter) {
                    const tx = sitter.x;
                    const ty = sitter.y - sitter.facingDirection * 24;
                    this.aiInput.left = this.active.x > tx + 6;
                    this.aiInput.right = this.active.x < tx - 6;
                    this.aiInput.up = this.active.y > ty + 4;
                    this.aiInput.down = this.active.y < ty - 4;
                }
            }
            this.active.drive(this.aiInput, this.match, time, () => this.triggerFoul());
            if (intent.wantDive && !this.match.mustKho) this.active.tryDive(time);
            if ((intent.wantKho || this.match.mustKho) && khoTarget) this.doKho(khoTarget);

            if (Phaser.Input.Keyboard.JustDown(this.tab) && this.defenders.length) {
                this.selectedIndex = (this.selectedIndex + 1) % this.defenders.length;
            }
            if (Phaser.Input.Keyboard.JustDown(this.key1)) this.selectedIndex = 0;
            if (Phaser.Input.Keyboard.JustDown(this.key2)) this.selectedIndex = Math.min(1, this.defenders.length - 1);
            if (Phaser.Input.Keyboard.JustDown(this.key3)) this.selectedIndex = Math.min(2, this.defenders.length - 1);
            this.refreshSelection();

            const move = this.readMove();
            this.defenders.forEach((d, i) => {
                if (i === this.selectedIndex) d.drive(move);
                else updateDefenderAI(d, this.active, 0.55, time);
            });
        }

        this.defenders.forEach((d) => d.syncRing());

        if (isFreeZone(this.active.x) && this.match.foul) this.match.clearFoul();
        this.active.setTint(this.match.foul ? 0xff6666 : 0xffffff);

        this.checkTags(time);
        this.checkSitterTouches();
        this.checkLeaveCourt();

        if (Phaser.Input.Keyboard.JustDown(this.enter) && this.match.canDeclare) {
            this.finishTurn();
            return;
        }

        updateHud(this.match, {
            canKho: Boolean(khoTarget) && this.match.playerIsChaser,
            prompt: this.match.mustKho ? 'KHO REQUIRED — NEW BATCH' : 'PRESS SPACE TO KHO!',
            hint: this.match.playerIsChaser
                ? 'WASD move · Space kho · Shift dive · Enter declare · Esc pause'
                : 'WASD move defender · Tab switch · Esc pause',
        });

        if (timedOut) this.finishTurn();
    }

    triggerFoul() {
        if (!this.match.foul) sfx.foul();
        this.match.setFoul();
    }

    doKho(target) {
        this.active = applyKho(this.active, target);
        this.match.recordKho();
        sfx.kho();
        this.active.speed = this.match.playerIsChaser ? this.diff.chaserSpeed : this.diff.aiChaseSpeed;
    }

    checkTags(time) {
        const radius = this.active.isDiving(time) ? 22 : 18;
        for (const defender of [...this.defenders]) {
            if (!defender.active) continue;
            const dist = Phaser.Math.Distance.Between(this.active.x, this.active.y, defender.x, defender.y);
            if (dist < radius) this.tryTag(defender, false);
        }
    }

    checkLeaveCourt() {
        for (const defender of [...this.defenders]) {
            if (defender.isOutOfCourt()) this.tryTag(defender, true);
        }
    }

    checkSitterTouches() {
        for (const defender of [...this.defenders]) {
            let overlapping = false;
            for (const chaser of this.chasers) {
                if (!chaser.sitting) continue;
                if (Phaser.Math.Distance.Between(defender.x, defender.y, chaser.x, chaser.y) < 20) {
                    overlapping = true;
                    break;
                }
            }
            if (overlapping && !defender.wasTouchingSitter) {
                if (!this.match.touchedSitterWarned[defender.slot]) {
                    this.match.touchedSitterWarned[defender.slot] = true;
                    this.banner('Warning: do not touch sitters');
                } else {
                    this.tryTag(defender, true);
                }
            }
            defender.wasTouchingSitter = overlapping;
        }
    }

    tryTag(defender, force) {
        const result = this.match.scoreOut({ force });
        if (!result) return;
        sfx.out();
        defender.destroy();
        this.defenders = this.defenders.filter((d) => d !== defender);
        if (this.selectedIndex >= this.defenders.length) this.selectedIndex = 0;
        this.refreshSelection();

        if (result.minChasePoint) {
            this.finishTurn();
            return;
        }
        if (result.batchWiped) {
            sfx.whistle();
            this.spawnBatch();
        }
    }

    finishTurn() {
        if (this.ending) return;
        this.ending = true;
        sfx.whistle();
        session.lastBreak = this.match.endTurn();
        hideHud();
        this.time.delayedCall(350, () => {
            const kind = session.lastBreak?.kind;
            if (kind === 'summary') this.scene.start('SummaryScene');
            else this.scene.start('BreakScene');
        });
    }

    bindHud() {
        this._onDeclare = () => {
            if (this.match?.canDeclare) this.finishTurn();
        };
        document.getElementById('declare-btn')?.addEventListener('click', this._onDeclare);
    }

    unbindHud() {
        document.getElementById('declare-btn')?.removeEventListener('click', this._onDeclare);
    }
}
