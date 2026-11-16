const $ = (s) => document.querySelector(s),
  keys = new Set(),
  touches = new Map();
let position = [0, 3, 30],
  yaw = 0,
  pitch = 0,
  entered = false,
  paused = false,
  lastTime = 0,
  frames = 0,
  frameSeconds = 0,
  slowSeconds = 0,
  fps = 60,
  level = 1,
  manualUntil = 0,
  touchStart = 0,
  viewIndex = 0;
const quality = [
  { ratio: 1, fog: 82, rain: 45 },
  { ratio: 1.35, fog: 115, rain: 100 },
  { ratio: 1.75, fog: 150, rain: 180 },
];
try {
  const saved = localStorage.getItem("rewind-detail");
  level =
    saved === null
      ? (navigator.hardwareConcurrency || 4) <= 4 ||
        matchMedia("(pointer:coarse)").matches
        ? 0
        : 1
      : Math.max(0, Math.min(2, Number(saved) || 0));
} catch {}
function setDetail(value, manual = false) {
  level = value;
  $("#detail").selectedIndex = level;
  if (manual) {
    manualUntil = performance.now() + 30000;
    slowSeconds = 0;
  }
  try {
    localStorage.setItem("rewind-detail", String(level));
  } catch {}
  resize();
}
function resize() {
  let ratio = Math.min(devicePixelRatio || 1, quality[level].ratio);
  canvas.width = Math.round(innerWidth * ratio);
  canvas.height = Math.round(innerHeight * ratio);
  gl.viewport(0, 0, canvas.width, canvas.height);
}
addEventListener("resize", resize);
setDetail(level);
function viewpoint(i) {
  viewIndex = i;
  const v = viewpoints[i];
  position = [...v.p];
  const d = v.target.map((x, j) => x - position[j]);
  yaw = Math.atan2(d[0], -d[2]);
  pitch = Math.atan2(d[1], Math.hypot(d[0], d[2]));
  $("#place").textContent = v.name;
  [...$("#views").children].forEach((b, j) =>
    b.classList.toggle("active", j === i),
  );
}
viewpoints.forEach((v, i) => {
  const b = document.createElement("button");
  b.textContent = `${i + 1}  ${v.name}`;
  b.onclick = () => {
    viewpoint(i);
  };
  $("#views").append(b);
});
viewpoint(0);
function lock() {
  if (!matchMedia("(pointer:coarse)").matches) {
    try {
      const result = canvas.requestPointerLock?.();
      if (result?.catch) result.catch(() => {});
    } catch {}
  }
}
function showMenu(value) {
  paused = value;
  $("#menu").hidden = !value;
  keys.clear();
  touches.clear();
  if (value && document.pointerLockElement) document.exitPointerLock();
  else if (!value) lock();
}
$("#enter").onclick = () => {
  entered = true;
  $("#overlay").hidden = true;
  startAudio();
  lock();
};
$("#menuButton").onclick = () => {
  if (entered) showMenu(!paused);
};
$("#resume").onclick = () => showMenu(false);
$("#home").onclick = (e) => {
  e.preventDefault();
  if (entered) showMenu(true);
};
$("#sound").onclick = toggleSound;
$("#detail").onchange = (e) => setDetail(e.target.selectedIndex, true);
addEventListener("pointerlockchange", () => {
  if (
    entered &&
    !document.pointerLockElement &&
    !matchMedia("(pointer:coarse)").matches
  )
    showMenu(true);
});
addEventListener("keydown", (e) => {
  if (/^(INPUT|SELECT)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (["w", "a", "s", "d", "q", "e", " ", "arrowup", "arrowdown"].includes(k))
    e.preventDefault();
  if (!entered) return;
  if (e.repeat) {
    keys.add(k);
    return;
  }
  if (k === "escape") {
    showMenu(!paused);
    return;
  }
  if (k === "m") toggleSound();
  if (k === "h") $("#stats").hidden = !$("#stats").hidden;
  if (k >= "1" && k <= "6") viewpoint(Number(k) - 1);
  keys.add(k);
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => {
  keys.clear();
  touches.clear();
  if (entered) showMenu(true);
});
function look(dx, dy) {
  yaw += dx * 0.0025;
  pitch = Math.max(-1.45, Math.min(1.45, pitch - dy * 0.0025));
}
addEventListener("mousemove", (e) => {
  if (entered && !paused && document.pointerLockElement === canvas)
    look(e.movementX, e.movementY);
});
canvas.addEventListener("pointerdown", (e) => {
  if (!entered || paused) return;
  if (e.pointerType === "touch") {
    canvas.setPointerCapture(e.pointerId);
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    touchStart = performance.now();
  } else lock();
});
canvas.addEventListener("pointermove", (e) => {
  if (touches.has(e.pointerId)) {
    const p = touches.get(e.pointerId);
    look(e.clientX - p[0], e.clientY - p[1]);
    touches.set(e.pointerId, [e.clientX, e.clientY]);
  }
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
  canvas.addEventListener(event, (e) => touches.delete(e.pointerId));
function collides(p) {
  return colliders.some(
    (b) =>
      p[1] < b.h + 0.5 &&
      Math.abs(p[0] - b.x) < b.w &&
      Math.abs(p[2] - b.z) < b.d,
  );
}
function move(dt) {
  let forward =
      (keys.has("w") ? 1 : 0) -
      (keys.has("s") ? 1 : 0) +
      (touches.size && performance.now() - touchStart > 240 ? 1 : 0),
    side = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0),
    vertical = (keys.has("e") ? 1 : 0) - (keys.has("q") ? 1 : 0);
  let speed = (keys.has("shift") || touches.size > 1 ? 16 : 6) * dt,
    normal = Math.max(1, Math.hypot(forward, side, vertical));
  let delta = [
    ((Math.sin(yaw) * Math.cos(pitch) * forward + Math.cos(yaw) * side) *
      speed) /
      normal,
    ((Math.sin(pitch) * forward + vertical) * speed) / normal,
    ((-Math.cos(yaw) * Math.cos(pitch) * forward + Math.sin(yaw) * side) *
      speed) /
      normal,
  ];
  for (let axis of [0, 2, 1]) {
    let p = [...position];
    p[axis] += delta[axis];
    p[0] = Math.max(-116, Math.min(116, p[0]));
    p[2] = Math.max(-116, Math.min(116, p[2]));
    p[1] = Math.max(1.1, Math.min(60, p[1]));
    if (!collides(p)) position = p;
  }
}
function animated(t) {
  vertices = [];
  for (let i = 0; i < 4; i++) {
    let u = (t * 2.4 + i * 47) % 192,
      x,
      z,
      turn;
    if (u < 48) {
      x = -24 + u;
      z = 21;
      turn = true;
    } else if (u < 96) {
      x = 27;
      z = 21 - (u - 48);
      turn = false;
    } else if (u < 144) {
      x = 24 - (u - 96);
      z = -27;
      turn = true;
    } else {
      x = -27;
      z = -24 + (u - 144);
      turn = false;
    }
    car(x, z, [0.35 + i * 0.025, 0.36, 0.32], turn);
  }
  for (let x of swings) {
    let z = 41 + Math.sin(t * 0.7 + x) * 0.25;
    for (let xx of [x - 0.6, x + 0.6])
      line([xx, 4, 41], [xx, 1.2, z], 0.025, [0.3, 0.33, 0.3]);
    box(x, 1.1, z, 1.5, 0.12, 0.65, [0.23, 0.27, 0.25]);
  }
  // A remote plane, circling only occasionally; crows are spare moving silhouettes.
  let plane = t % 100;
  if (plane < 42) {
    let x = -150 + plane * 7;
    box(x, 65, -85, 5, 0.5, 0.7, [0.42, 0.46, 0.46]);
    box(x, 65, -85, 0.8, 0.15, 8, [0.42, 0.46, 0.46]);
  }
  for (let i = 0; i < 5; i++) {
    let x = ((t * 3 + i * 11) % 230) - 115,
      y = 26 + Math.sin(t * 0.7 + i) * 2,
      z = -15 + i * 4;
    let flap = Math.sin(t * 5 + i) * 0.65;
    line([x - 1, y + flap, z + 0.3], [x, y, z], 0.045, [0.2, 0.25, 0.25]);
    line([x, y, z], [x + 1, y + flap, z + 0.3], 0.045, [0.2, 0.25, 0.25]);
  }
  // Fine drifting mist streaks, wrapped around the camera, never heavy rain.
  for (let i = 0; i < quality[level].rain; i++) {
    let x =
        position[0] + Math.sin(i * 71.3) * 26 + Math.sin(t * 0.15 + i) * 0.2,
      z = position[2] + Math.cos(i * 53.7) * 26,
      y = (((i * 1.71 - t * 0.8) % 18) + 18) % 18;
    line([x, y, z], [x + 0.015, y + 0.17, z], 0.009, [0.6, 0.64, 0.63]);
  }
  return new Float32Array(vertices);
}
function render(now) {
  const elapsed = lastTime ? (now - lastTime) / 1000 : 0.016;
  const dt = Math.min(elapsed, 0.1);
  lastTime = now;
  if (entered && !paused) move(dt);
  const dynamic = animated(now * 0.001);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawSky(yaw, pitch, now * 0.001);
  gl.uniformMatrix4fv(
    locations.camera,
    false,
    cameraMatrix(position, yaw, pitch, canvas.width / canvas.height),
  );
  gl.uniform3fv(locations.eye, position);
  gl.uniform1f(locations.fog, quality[level].fog);
  bindMesh(buffer);
  let drawn = 0;
  for (const b of batches) {
    if (
      b.global ||
      Math.hypot(b.x - position[0], b.z - position[2]) <
        quality[level].fog * 1.6 + 20
    ) {
      gl.drawArrays(gl.TRIANGLES, b.start, b.count);
      drawn += b.count;
    }
  }
  bindMesh(movingBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, dynamic, gl.DYNAMIC_DRAW);
  gl.drawArrays(gl.TRIANGLES, 0, dynamic.length / 8);
  drawn += dynamic.length / 8;
  frames++;
  frameSeconds += elapsed;
  if (frameSeconds >= 2) {
    fps = Math.round(frames / frameSeconds);
    $("#stats").textContent =
      `${fps} fps · ${["Low", "Medium", "High"][level]} · ${Math.round(drawn / 3).toLocaleString()} triangles`;
    if (!document.hidden && entered && !paused && fps < 28 && now > manualUntil)
      slowSeconds += frameSeconds;
    else slowSeconds = 0;
    if (slowSeconds >= 6 && level > 0) {
      setDetail(level - 1);
      slowSeconds = 0;
    }
    frames = 0;
    frameSeconds = 0;
  }
  requestAnimationFrame(render);
}
addEventListener("visibilitychange", () => {
  lastTime = 0;
  frames = 0;
  frameSeconds = 0;
  slowSeconds = 0;
});
$("#loading").textContent = "Your afternoon is ready.";
$("#enter").disabled = false;
requestAnimationFrame(render);
// Read-only diagnostics for reproducible smoke checks, also useful to contributors.
window.rewind = {
  get state() {
    return {
      position: [...position],
      yaw,
      pitch,
      level,
      fps,
      staticCount,
      entered,
      paused,
      viewIndex,
    };
  },
};
