import { COURT, isFreeZone, SQUARE_XS, SQUARE_FACING } from '../config/constants.js';

export function findKhoTarget(active, sitters) {
    if (!active || active.sitting) return null;
    let best = null;
    let bestDist = COURT.khoRange;
    for (const sitter of sitters) {
        if (!sitter.sitting) continue;
        const dx = active.x - sitter.x;
        const dy = active.y - sitter.y;
        const dist = Math.hypot(dx, dy);
        if (dist > COURT.khoRange) continue;
        if (Math.abs(dx) > COURT.khoXSlack) continue;
        const behind = sitter.facingDirection === 1 ? active.y < sitter.y - 2 : active.y > sitter.y + 2;
        if (!behind) continue;
        if (dist < bestDist) {
            best = sitter;
            bestDist = dist;
        }
    }
    return best;
}

export function applyKho(active, target) {
    const idx = target.squareIndex;
    const x = SQUARE_XS[idx];
    const facing = SQUARE_FACING[idx];
    active.makeSitting(idx, x, COURT.centerY, facing);
    target.makeActive(facing, true);
    return target;
}

export function updateDefenderAI(defender, chaser, skill, time) {
    if (time < defender.aiCooldown) return;
    defender.aiCooldown = time + 40;

    const awayX = defender.x - chaser.x;
    const awayY = defender.y - chaser.y;
    const dist = Math.max(1, Math.hypot(awayX, awayY));
    const chaserHalf = chaser.y >= COURT.centerY ? 1 : -1;
    const myHalf = defender.y >= COURT.centerY ? 1 : -1;
    const speed = defender.speed;

    let tx = awayX / dist;
    let ty = awayY / dist;

    const shouldCross = skill > 0.3 && myHalf === chaserHalf && dist < 220 + skill * 120;
    if (shouldCross) {
        const poleX = defender.x < COURT.width / 2 ? COURT.poleLeft : COURT.poleRight;
        if (!isFreeZone(defender.x)) {
            tx = Math.sign(poleX - defender.x) || tx;
            ty *= 0.35;
        } else {
            ty = myHalf === 1 ? -1 : 1;
        }
    } else if (dist > 340) {
        tx *= 0.2;
        ty *= 0.2;
    }

    const jitter = (1 - skill) * 0.45;
    tx += (Math.random() - 0.5) * jitter;
    ty += (Math.random() - 0.5) * jitter;
    const mag = Math.max(0.15, Math.hypot(tx, ty));
    let vx = (tx / mag) * speed;
    let vy = (ty / mag) * speed;

    const margin = 22;
    if (defender.x < margin && vx < 0) vx = speed * 0.6;
    if (defender.x > COURT.width - margin && vx > 0) vx = -speed * 0.6;
    if (defender.y < margin && vy < 0) vy = speed * 0.6;
    if (defender.y > COURT.height - margin && vy > 0) vy = -speed * 0.6;

    defender.applyVelocity(vx, vy);
}

export function updateChaserAI(chaser, defenders, sitters, inputHold, time, skill) {
    const live = defenders.filter((d) => d.active);
    if (!live.length) {
        inputHold.left = inputHold.right = inputHold.up = inputHold.down = false;
        return { wantKho: false, wantDive: false };
    }

    const sameHalf = live.filter((d) => isFreeZone(chaser.x) || Math.sign(d.y - COURT.centerY) === chaser.facingDirection || Math.abs(d.y - COURT.centerY) < 20);
    let target = nearest(chaser, sameHalf.length ? sameHalf : []);
    let wantKho = false;
    let wantDive = false;

    if (!target) {
        const neededFacing = live[0].y >= COURT.centerY ? 1 : -1;
        const sitter = sitters.find((s) => s.sitting && s.facingDirection === neededFacing);
        if (sitter) {
            steerToward(inputHold, chaser, sitter.x, sitter.y - sitter.facingDirection * 22);
            wantKho = true;
            return { wantKho, wantDive };
        }
        target = nearest(chaser, live);
    }

    if (target) {
        steerToward(inputHold, chaser, target.x, target.y);
        const dist = Math.hypot(chaser.x - target.x, chaser.y - target.y);
        wantDive = dist < 70 && time > (chaser.diveCooldownUntil || 0);
        if (dist > 160 && findKhoTarget(chaser, sitters) && Math.random() < skill * 0.02) {
            wantKho = true;
        }
    }

    if (findKhoTarget(chaser, sitters) && (!sameHalf.length || Math.random() < 0.01)) {
        wantKho = true;
    }

    return { wantKho, wantDive };
}

function nearest(from, list) {
    let best = null;
    let bestD = Infinity;
    for (const item of list) {
        const d = Math.hypot(from.x - item.x, from.y - item.y);
        if (d < bestD) {
            bestD = d;
            best = item;
        }
    }
    return best;
}

function steerToward(input, chaser, x, y) {
    input.left = input.right = input.up = input.down = false;
    const dx = x - chaser.x;
    const dy = y - chaser.y;
    if (Math.abs(dx) > 8) {
        if (dx < 0) input.left = true;
        else input.right = true;
    }
    if (Math.abs(dy) > 8) {
        if (dy < 0) input.up = true;
        else input.down = true;
    }
}
