import Phaser from 'phaser';
import { COLORS, COURT } from '../config/constants.js';

export default class Defender extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, slot, speed) {
        super(scene, x, y, 'defender');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setDepth(6);
        this.body.setCircle(11, this.width / 2 - 11, this.height / 2 - 11);
        this.body.setCollideWorldBounds(false);

        this.slot = slot;
        this.speed = speed;
        this.selected = false;
        this.aiCooldown = 0;
        this.wasTouchingSitter = false;
        this.ring = scene.add.circle(x, y, 16, COLORS.selected, 0);
        this.ring.setStrokeStyle(2, COLORS.selected, 0);
        this.ring.setDepth(5);
    }

    setSelected(on) {
        this.selected = on;
        this.ring.setStrokeStyle(2, COLORS.selected, on ? 1 : 0);
        this.setTint(on ? 0xccffdd : 0xffffff);
    }

    drive(input) {
        let vx = 0;
        let vy = 0;
        if (input.left) vx = -this.speed;
        else if (input.right) vx = this.speed;
        if (input.up) vy = -this.speed;
        else if (input.down) vy = this.speed;
        this.body.setVelocity(vx, vy);
        this.syncRing();
    }

    applyVelocity(vx, vy) {
        this.body.setVelocity(vx, vy);
        this.syncRing();
    }

    isOutOfCourt() {
        return this.x < 8 || this.x > COURT.width - 8 || this.y < 8 || this.y > COURT.height - 8;
    }

    syncRing() {
        this.ring.setPosition(this.x, this.y);
    }

    destroy(fromScene) {
        this.ring?.destroy();
        super.destroy(fromScene);
    }
}
