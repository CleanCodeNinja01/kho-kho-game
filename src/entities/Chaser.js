import Phaser from 'phaser';
import { COLORS, COURT, isFreeZone } from '../config/constants.js';

export default class Chaser extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, { sitting = true, squareIndex = 0, facing = 1, speed = 210 } = {}) {
        super(scene, x, y, sitting ? 'chaser-sit' : 'chaser-active');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(5);
        this.body.setCircle(12, this.width / 2 - 12, this.height / 2 - 12);
        this.body.setCollideWorldBounds(false);

        this.sitting = sitting;
        this.squareIndex = squareIndex;
        this.facingDirection = facing;
        this.speed = speed;
        this.lockedDirection = null;
        this.divingUntil = 0;
        this.diveCooldownUntil = 0;
        this.arrow = scene.add.triangle(x, y, 0, -16, 8, 10, -8, 10, 0xffffff, 0.85);
        this.arrow.setDepth(6);

        if (sitting) this.makeSitting(squareIndex, x, y, facing);
        else this.makeActive(facing, false);
    }

    makeSitting(squareIndex, x, y, facing) {
        this.sitting = true;
        this.squareIndex = squareIndex;
        this.facingDirection = facing;
        this.lockedDirection = null;
        this.setTexture('chaser-sit');
        this.setAlpha(0.75);
        this.body.setVelocity(0, 0);
        this.body.enable = false;
        this.body.setImmovable(true);
        this.setPosition(x, y);
        this.setDepth(5);
        this.divingUntil = 0;
        this.refreshArrow();
    }

    makeActive(facing, fromKho) {
        this.sitting = false;
        this.facingDirection = facing;
        this.lockedDirection = null;
        this.setTexture('chaser-active');
        this.setAlpha(1);
        this.setDepth(7);
        this.body.enable = true;
        this.body.setImmovable(false);
        this.originLaneX = this.x;
        if (fromKho) {
            this.y = COURT.centerY + facing * 18;
        }
        this.refreshArrow();
    }

    isDiving(time) {
        return time < this.divingUntil;
    }

    tryDive(time) {
        if (this.sitting || time < this.diveCooldownUntil) return false;
        this.divingUntil = time + 280;
        this.diveCooldownUntil = time + 1400;
        return true;
    }

    refreshArrow() {
        this.arrow.setPosition(this.x, this.y);
        this.arrow.setRotation(this.facingDirection === 1 ? Math.PI : 0);
        this.arrow.setAlpha(this.sitting ? 0.7 : 1);
        this.arrow.setFillStyle(this.sitting ? 0xffffff : COLORS.active, 0.9);
    }

    destroy(fromScene) {
        this.arrow?.destroy();
        super.destroy(fromScene);
    }

    /**
     * @param {{ left: boolean, right: boolean, up: boolean, down: boolean }} input
     * @param {object} match
     * @param {number} time
     * @param {(type: 'recede' | 'lane') => void} onFoul
     */
    drive(input, match, time, onFoul) {
        if (this.sitting) {
            this.refreshArrow();
            return;
        }

        const free = isFreeZone(this.x);
        const onCross = !free && this.originLaneX != null && Math.abs(this.x - this.originLaneX) < 16;
        if (free) this.lockedDirection = null;

        const speed = this.isDiving(time) ? this.speed * 1.85 : this.speed;
        let vx = 0;
        let vy = 0;

        if (input.left) {
            if (this.lockedDirection === 'RIGHT' && !free && !onCross) {
                onFoul?.('recede');
            } else {
                vx = -speed;
                if (!free && !onCross) this.lockedDirection = 'LEFT';
            }
        } else if (input.right) {
            if (this.lockedDirection === 'LEFT' && !free && !onCross) {
                onFoul?.('recede');
            } else {
                vx = speed;
                if (!free && !onCross) this.lockedDirection = 'RIGHT';
            }
        }

        if (input.up) vy = -speed;
        else if (input.down) vy = speed;

        this.body.setVelocity(vx, vy);

        if (free) {
            if (this.y > COURT.centerY + 10) this.facingDirection = 1;
            else if (this.y < COURT.centerY - 10) this.facingDirection = -1;
        } else {
            const margin = 14;
            if (this.facingDirection === 1 && this.y < COURT.centerY + margin) {
                if (this.y < COURT.centerY - 4) onFoul?.('lane');
                this.y = Math.max(this.y, COURT.centerY + 8);
                if (this.body.velocity.y < 0) this.body.setVelocityY(0);
            } else if (this.facingDirection === -1 && this.y > COURT.centerY - margin) {
                if (this.y > COURT.centerY + 4) onFoul?.('lane');
                this.y = Math.min(this.y, COURT.centerY - 8);
                if (this.body.velocity.y > 0) this.body.setVelocityY(0);
            }
        }

        this.x = Phaser.Math.Clamp(this.x, 16, COURT.width - 16);
        this.y = Phaser.Math.Clamp(this.y, 16, COURT.height - 16);
        this.refreshArrow();
    }
}
