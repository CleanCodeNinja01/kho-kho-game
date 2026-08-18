let ctx;

function audio() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

function tone(freq, duration, type = 'sine', gain = 0.08, delay = 0) {
    const ac = audio();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ac.destination);
    const t = ac.currentTime + delay;
    osc.start(t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.stop(t + duration + 0.02);
}

export function unlockAudio() {
    try {
        audio();
    } catch {
        /* ignore */
    }
}

export const sfx = {
    kho() {
        tone(392, 0.08, 'square', 0.06);
        tone(523, 0.12, 'square', 0.05, 0.07);
    },
    out() {
        tone(880, 0.05, 'square', 0.05);
        tone(1320, 0.08, 'square', 0.04, 0.05);
    },
    foul() {
        tone(160, 0.18, 'sawtooth', 0.05);
    },
    whistle() {
        tone(1760, 0.22, 'square', 0.04);
    },
    click() {
        tone(600, 0.04, 'square', 0.03);
    },
};
