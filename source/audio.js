// All ambience is synthesized after the entry gesture. No samples or requests.
let audio,
  master,
  muted = false,
  audioTimer;
function tone(freq, duration, volume, type = "sine", bend = 0) {
  if (!audio || muted) return;
  const o = audio.createOscillator(),
    g = audio.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, audio.currentTime);
  o.frequency.linearRampToValueAtTime(
    Math.max(20, freq + bend),
    audio.currentTime + duration,
  );
  g.gain.setValueAtTime(0, audio.currentTime);
  g.gain.linearRampToValueAtTime(volume, audio.currentTime + 0.08);
  g.gain.exponentialRampToValueAtTime(0.00001, audio.currentTime + duration);
  o.connect(g).connect(master);
  o.start();
  o.stop(audio.currentTime + duration);
}
function startAudio() {
  if (audio) {
    audio.resume();
    return;
  }
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  audio = new Audio();
  master = audio.createGain();
  master.gain.value = 0.48;
  master.connect(audio.destination);
  const b = audio.createBuffer(1, audio.sampleRate * 4, audio.sampleRate),
    data = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 4;
  }
  const noise = audio.createBufferSource(),
    filter = audio.createBiquadFilter(),
    gain = audio.createGain();
  noise.buffer = b;
  noise.loop = true;
  filter.type = "lowpass";
  filter.frequency.value = 550;
  gain.gain.value = 0.11;
  noise.connect(filter).connect(gain).connect(master);
  noise.start();
  const hum = audio.createOscillator(),
    hg = audio.createGain();
  hum.frequency.value = 53;
  hg.gain.value = 0.018;
  hum.connect(hg).connect(master);
  hum.start();
  let event = 0;
  audioTimer = setInterval(() => {
    if (document.hidden || muted) return;
    event++;
    tone(1100 + Math.random() * 1300, 0.25, 0.012, "sine", -400);
    if (event % 7 === 0) {
      tone(330, 5, 0.013, "sine", 180);
      tone(334, 5, 0.007, "sine", 180);
    }
    if (event % 11 === 0) {
      tone(440, 3, 0.026);
      tone(880, 2, 0.009);
    }
    if (event % 13 === 0) {
      tone(155, 4, 0.022);
      tone(196, 4, 0.012);
    }
    if (event % 5 === 0) {
      tone(740, 0.45, 0.017, "triangle", -390);
      setTimeout(() => tone(680, 0.4, 0.012, "triangle", -300), 500);
    }
  }, 2800);
}
function toggleSound() {
  muted = !muted;
  if (master)
    master.gain.setTargetAtTime(muted ? 0 : 0.48, audio.currentTime, 0.15);
  document.querySelector("#sound").textContent = muted
    ? "Sound off"
    : "Sound on";
}

// Keep quiet when the visitor switches away.
addEventListener("visibilitychange", () => {
  if (!audio) return;
  if (document.hidden) audio.suspend();
  else audio.resume();
});
