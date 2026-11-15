// Seeded city, in metres. +Z storefronts face the main street.
let seed = 1996;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const palette = {
  brick: [0.43, 0.32, 0.29],
  teal: [0.27, 0.4, 0.39],
  concrete: [0.52, 0.51, 0.46],
  road: [0.19, 0.23, 0.24],
  metal: [0.26, 0.3, 0.29],
};
const signs = [
  "REWIND VIDEO",
  "STARLIGHT DINER",
  "INSERT COIN",
  "GROOVE MERCHANT",
  "STARLIGHT MOTEL",
  "FROSTY COLA",
  "98.5 FM THE WOLF",
  "LAST STOP GAS",
  "EAT",
  "VACANCY",
  "BE KIND · REWIND",
  "REGULAR 1.19",
];
const atlas = document.createElement("canvas");
atlas.width = 1024;
atlas.height = 1024;
const ctx = atlas.getContext("2d");
signs.forEach((s, i) => {
  let y = i * 80;
  ctx.fillStyle = ["#273d40", "#a6a28a", "#291d3a", "#483b37"][i % 4];
  ctx.fillRect(0, y, 1024, 80);
  ctx.strokeStyle = i === 2 ? "#e58fae" : "#b2ae94";
  ctx.lineWidth = 3;
  ctx.strokeRect(6, y + 6, 1012, 68);
  ctx.fillStyle = i === 2 ? "#99e4df" : i === 0 ? "#e0bc88" : "#e4ddbc";
  ctx.textAlign = "center";
  ctx.font = "bold " + (s.length > 18 ? 42 : 54) + "px monospace";
  ctx.fillText(s, 512, y + 58);
});
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
function sign(i, x, y, z, w, h) {
  let t = (i * 80) / 1024,
    b = (i * 80 + 80) / 1024;
  quad(
    [x - w / 2, y, z],
    [x + w / 2, y, z],
    [x + w / 2, y + h, z],
    [x - w / 2, y + h, z],
    [1, 1, 1],
    [
      [0, b],
      [1, b],
      [1, t],
      [0, t],
    ],
  );
}
const colliders = [],
  swings = [];
function building(x, z, w, d, h, c, shop = -1) {
  box(x, 0, z, w, h, d, c);
  colliders.push({ x, z, w: w / 2 + 0.55, d: d / 2 + 0.55, h });
  box(x, h, z, w + 0.4, 0.45, d + 0.4, palette.concrete);
  box(x + 2, h + 0.45, z, 3, 1.2, 2, palette.metal);
  for (let yy = 3; yy < h - 1; yy += 3.6) {
    for (let xx = x - w / 2 + 1.6; xx < x + w / 2 - 1; xx += 2.6) {
      let lit = random() > 0.42,
        col = lit ? [0.75, 0.73, 0.51] : [0.19, 0.27, 0.28];
      box(xx, yy, z + d / 2 + 0.025, 1.35, 1.9, 0.08, col);
      box(xx, yy, z - d / 2 - 0.025, 1.35, 1.9, 0.08, col);
    }
    for (let zz = z - d / 2 + 2; zz < z + d / 2 - 1; zz += 3) {
      box(
        x - w / 2 - 0.025,
        yy,
        zz,
        0.08,
        1.9,
        1.4,
        random() > 0.55 ? [0.67, 0.7, 0.55] : [0.22, 0.28, 0.28],
      );
      box(x + w / 2 + 0.025, yy, zz, 0.08, 1.9, 1.4, [0.3, 0.37, 0.36]);
    }
  }
  if (shop >= 0) {
    box(x, 0, z + d / 2 + 0.1, w - 1, 3, 0.2, [0.23, 0.32, 0.31]);
    for (let xx = x - w / 2 + 2; xx < x + w / 2; xx += 3)
      box(xx, 0.5, z + d / 2 + 0.23, 2.3, 2.2, 0.1, [0.67, 0.65, 0.44]);
    sign(shop, x, 3.6, z + d / 2 + 0.3, w - 1, 1.9);
    box(x, 3.2, z + d / 2 + 1.2, w, 0.25, 2.3, palette.teal);
  }
}
// Ground, streets, sidewalks and wet patches.
box(0, -0.25, 0, 245, 0.2, 245, [0.31, 0.35, 0.33]);
for (let s of [-72, -24, 24, 72]) {
  box(s, -0.03, 0, 12, 0.04, 240, palette.road);
  box(0, -0.03, s, 240, 0.04, 12, palette.road);
  for (let k = -112; k < 116; k += 8) {
    box(s, 0.015, k, 0.15, 0.015, 3, [0.57, 0.53, 0.36]);
    box(k, 0.015, s, 3, 0.015, 0.15, [0.57, 0.53, 0.36]);
  }
  for (let side of [-1, 1]) {
    box(s + side * 7, 0.02, 0, 1.8, 0.16, 240, [0.48, 0.49, 0.46]);
    box(0, 0.02, s + side * 7, 240, 0.16, 1.8, [0.48, 0.49, 0.46]);
  }
}
for (let i = 0; i < 160; i++) {
  let x = random() * 230 - 115,
    z = random() * 230 - 115;
  box(
    x,
    0.025,
    z,
    1 + random() * 4,
    0.01,
    0.5 + random() * 2,
    [0.39, 0.44, 0.44],
  );
}
building(-9, -3, 23, 24, 15, palette.brick, 0);
building(15, -3, 18, 24, 10, palette.teal, 1);
building(44, -5, 19, 20, 17, palette.brick, 3);
building(44, -48, 18, 22, 13, palette.concrete, 2);
building(91, 44, 25, 28, 8, [0.5, 0.42, 0.35], 4);
// Additional blocks leave the school, gas station, parking lot and alley open.
for (let x of [-96, -48, 0, 48, 96])
  for (let z of [-96, -48, 0, 48, 96]) {
    if (
      (z === 0 && x >= 0) ||
      (z === -48 && x === 48) ||
      (z === 48 && x >= 0) ||
      (z === 96 && x === 48)
    )
      continue;
    let h = 12 + random() * 27;
    building(x + random() * 3, z, 23 + random() * 5, 25 + random() * 6, h, [
      0.35 + random() * 0.15,
      0.34 + random() * 0.13,
      0.3 + random() * 0.13,
    ]);
  }
// Water tower: tapered legs and a many-sided tank.
for (let x of [-14, -6])
  for (let z of [-7, 1])
    line(
      [x, 15, z],
      [-10 + (x + 10) * 0.8, 27, -3 + (z + 3) * 0.8],
      0.22,
      palette.metal,
    );
for (let i = 0; i < 16; i++) {
  let a = (i * Math.PI) / 8,
    b = ((i + 1) * Math.PI) / 8;
  quad(
    [-10 + 4 * Math.cos(a), 25, -3 + 4 * Math.sin(a)],
    [-10 + 4 * Math.cos(b), 25, -3 + 4 * Math.sin(b)],
    [-10 + 4 * Math.cos(b), 31, -3 + 4 * Math.sin(b)],
    [-10 + 4 * Math.cos(a), 31, -3 + 4 * Math.sin(a)],
    [0.35, 0.35, 0.3],
  );
  triangle(
    [-10, 33, -3],
    [-10 + 4.5 * Math.cos(a), 31, -3 + 4.5 * Math.sin(a)],
    [-10 + 4.5 * Math.cos(b), 31, -3 + 4.5 * Math.sin(b)],
    [0.28, 0.32, 0.3],
  );
}
// Poles, sagging wires, street lamps and traffic signals.
for (let z = -108; z <= 108; z += 24) {
  box(-17, 0, z, 0.28, 10, 0.28, [0.28, 0.24, 0.19]);
  box(-17, 8.8, z, 3, 0.16, 0.2, palette.metal);
  for (let offset of [-1, 1])
    for (let j = 0; j < 12; j++) {
      let t = j / 12,
        v = (j + 1) / 12;
      line(
        [-17 + offset, 9 - 1.3 * 4 * t * (1 - t), z + t * 24],
        [-17 + offset, 9 - 1.3 * 4 * v * (1 - v), z + v * 24],
        0.025,
        [0.17, 0.22, 0.22],
      );
    }
}
for (let x of [-79, -17, 31, 79])
  for (let z of [-78, -30, 18, 66]) {
    line([x, 0, z], [x, 7, z], 0.12, palette.metal);
    line([x, 7, z], [x + 2, 7, z], 0.1, palette.metal);
    box(x + 2, 6.8, z, 1, 0.16, 0.6, [0.91, 0.85, 0.57]);
    if (x === -17) {
      box(x + 3, 4.8, z, 0.55, 1.7, 0.5, [0.2, 0.24, 0.22]);
      box(x + 3, 5.9, z + 0.27, 0.25, 0.28, 0.03, [0.72, 0.25, 0.18]);
    }
  }
// The neon grotto is a narrow corridor between old shops.
building(33, -33, 7, 8, 9, palette.brick);
building(55, -33, 7, 8, 11, palette.teal);
for (let x of [33.7, 54.3]) {
  line([x, 0.3, -34], [x, 6, -34], 0.08, [0.46, 0.76, 0.73]);
  line([x, 6, -34], [x, 6, -59], 0.08, [0.65, 0.29, 0.47]);
}

box(44, 0.03, -33, 8, 0.01, 8, [0.36, 0.33, 0.4]);
// Gas station, fictional billboards.
box(0, 4, 48, 25, 0.6, 16, [0.49, 0.51, 0.43]);
for (let x of [-10, 10]) box(x, 0, 48, 0.3, 4, 0.3, palette.metal);
for (let x of [-5, 5]) {
  box(x, 0, 48, 1.4, 2.5, 1, [0.57, 0.35, 0.29]);
  box(x, 1.5, 48 + 0.51, 1, 0.6, 0.05, [0.2, 0.26, 0.25]);
}
sign(7, 0, 4.7, 56.1, 24, 2);
sign(11, 0, 2, 49, 6, 1);
for (let [i, x, z] of [
  [5, -49, 13],
  [6, 0, -85],
]) {
  box(x, 0, z, 0.4, 13, 0.4, palette.metal);
  box(x, 11, z, 19, 5, 0.5, palette.metal);
  sign(i, x, 11.3, z + 0.3, 18.5, 4.4);
}
// Motel courtyard: empty sunken pool, coping and ladder.
box(91, 0.03, 64, 24, 0.25, 15, [0.65, 0.65, 0.56]);
box(91, 0.3, 64, 20, 0.12, 11, [0.28, 0.4, 0.39]);
box(91, 0.42, 64, 17, 0.02, 8, [0.4, 0.5, 0.47]);
for (let x of [81, 101]) box(x, 0.3, 64, 0.4, 1.2, 11, [0.62, 0.66, 0.59]);
for (let z of [58.5, 69.5]) box(91, 0.3, z, 20, 1.2, 0.4, [0.62, 0.66, 0.59]);
for (let x of [88, 89]) {
  line([x, 0.4, 69], [x, 2, 69], 0.07, palette.metal);
  line([x, 2, 69], [x, 2, 70.5], 0.07, palette.metal);
}
sign(4, 92, 8, 59, 23, 2.5);
sign(9, 92, 6.7, 59.1, 8, 1);
box(92, 0, 58.5, 0.4, 9, 0.4, palette.metal);
// Empty parking lot and blank drive-in screen.
box(44, 0.03, 94, 34, 0.03, 31, [0.24, 0.28, 0.28]);
for (let x = 30; x < 60; x += 4)
  for (let z of [85, 102]) box(x, 0.07, z, 0.12, 0.02, 7, [0.64, 0.62, 0.49]);
box(45, 5, 112, 30, 15, 0.5, [0.65, 0.67, 0.61]);
for (let x of [33, 57]) box(x, 0, 112, 0.5, 5, 0.5, palette.metal);
// Schoolyard: chain-link diamonds, hoop, swing frame.
box(44, 0.04, 47, 31, 0.04, 30, [0.36, 0.39, 0.36]);
for (let x = 29; x <= 59; x += 5)
  line([x, 0, 62], [x, 3, 62], 0.06, palette.metal);
for (let x = 29; x < 59; x += 0.6)
  for (let y = 0.3; y < 3; y += 0.6) {
    line([x, y, 62], [x + 0.6, y + 0.6, 62], 0.012, [0.48, 0.52, 0.49]);
    if (y > 0.5)
      line([x, y, 62], [x + 0.6, y - 0.6, 62], 0.012, [0.48, 0.52, 0.49]);
  }
for (let x of [35, 45]) {
  line([x - 1, 0, 39], [x, 4, 41], 0.09, palette.metal);
  line([x + 1, 0, 43], [x, 4, 41], 0.09, palette.metal);
}
line([35, 4, 41], [45, 4, 41], 0.12, palette.metal);
swings.push(38, 42);
line([55, 0, 50], [55, 4.8, 50], 0.1, palette.metal);
box(55, 3.8, 50, 3, 1.8, 0.15, [0.68, 0.68, 0.59]);
for (let i = 0; i < 16; i++) {
  let a = (i * Math.PI) / 8,
    b = ((i + 1) * Math.PI) / 8;
  line(
    [55 + 0.55 * Math.cos(a), 3.8, 51 + 0.55 * Math.sin(a)],
    [55 + 0.55 * Math.cos(b), 3.8, 51 + 0.55 * Math.sin(b)],
    0.035,
    [0.6, 0.34, 0.23],
  );
}
// A faded striped diner canopy, record sleeves in the shop window, curb drains.
sign(8, 22, 6, 9.5, 2, 2.5);
sign(10, -9, 1.1, 9.45, 6, 0.7);
for (let x = 7; x < 24; x += 1.5)
  box(x, 3.48, 10.7, 0.7, 0.03, 2, [0.57, 0.36, 0.29]);
for (let x = 38; x < 51; x += 2) {
  box(x, 1.4, 5.5, 0.9, 0.9, 0.04, [0.51, 0.43, 0.32]);
  box(x, 1.6, 5.55, 0.5, 0.5, 0.02, [0.25, 0.3, 0.28]);
}
for (let z = -100; z < 110; z += 16) {
  box(-18, 0.12, z, 0.7, 0.04, 0.9, [0.21, 0.25, 0.25]);
  for (let k = 0; k < 5; k++)
    box(-18.25 + k * 0.12, 0.15, z, 0.04, 0.015, 0.8, [0.38, 0.41, 0.39]);
}
// Parked cars; moving cars are drawn from the same simple shapes each frame.
function car(x, z, c, turn = false) {
  if (turn) {
    box(x, 0.45, z, 4.7, 0.85, 2, c);
    box(x, 0.95, z, 2.5 + (x % 3 > 1 ? 0.6 : 0), 0.9, 1.8, [0.28, 0.36, 0.36]);
    for (let side of [-1, 1]) {
      box(x + side * 1.6, 0.2, z, 0.8, 0.65, 2.15, [0.12, 0.15, 0.15]);
      box(x + 2.38, 0.75, z + side * 0.65, 0.04, 0.3, 0.5, [0.89, 0.85, 0.6]);
    }
  } else {
    box(x, 0.45, z, 2, 0.85, 4.7, c);
    box(
      x,
      0.95,
      z,
      1.8,
      0.9,
      2.5 + (Math.abs(z) % 3 > 1 ? 0.6 : 0),
      [0.28, 0.36, 0.36],
    );
    for (let side of [-1, 1]) {
      box(x, 0.2, z + side * 1.6, 2.15, 0.65, 0.8, [0.12, 0.15, 0.15]);
      box(x + side * 0.65, 0.75, z - 2.38, 0.5, 0.3, 0.04, [0.89, 0.85, 0.6]);
    }
  }
}
for (let i = 0; i < 20; i++)
  car(-19, -100 + i * 10, [
    0.31 + random() * 0.2,
    0.32 + random() * 0.1,
    0.28 + random() * 0.1,
  ]);

// Spatial batches share one immutable GPU buffer; distant cells are skipped.
const cells = new Map();
for (let i = 0; i < vertices.length; i += 24) {
  let x = (vertices[i] + vertices[i + 8] + vertices[i + 16]) / 3,
    z = (vertices[i + 2] + vertices[i + 10] + vertices[i + 18]) / 3,
    wide =
      Math.max(vertices[i], vertices[i + 8], vertices[i + 16]) -
        Math.min(vertices[i], vertices[i + 8], vertices[i + 16]) >
        32 ||
      Math.max(vertices[i + 2], vertices[i + 10], vertices[i + 18]) -
        Math.min(vertices[i + 2], vertices[i + 10], vertices[i + 18]) >
        32,
    key = wide ? "global" : `${Math.floor(x / 24)},${Math.floor(z / 24)}`;
  if (!cells.has(key))
    cells.set(key, {
      x: Math.floor(x / 24) * 24 + 12,
      z: Math.floor(z / 24) * 24 + 12,
      data: [],
      global: wide,
    });
  let data = cells.get(key).data;
  for (let j = 0; j < 24; j++) data.push(vertices[i + j]);
}
vertices = [];
const batches = [];
for (const cell of cells.values()) {
  batches.push({
    x: cell.x,
    z: cell.z,
    global: cell.global,
    start: vertices.length / 8,
    count: cell.data.length / 8,
  });
  for (const v of cell.data) vertices.push(v);
}
cells.clear();
staticMesh = new Float32Array(vertices);
staticCount = vertices.length / 8;
vertices = [];
gl.bufferData(gl.ARRAY_BUFFER, staticMesh, gl.STATIC_DRAW);
staticMesh = null;
const movingBuffer = gl.createBuffer();
const viewpoints = [
  { name: "Main Street", p: [-3, 3.2, 32], target: [-7, 12, -3] },
  { name: "Rooftop", p: [-43, 40, 9], target: [-10, 24, -3] },
  { name: "Arcade Alley", p: [44, 2.8, -17], target: [44, 4.5, -39] },
  { name: "The Video Store", p: [-8, 2.5, 18], target: [-9, 4, 9] },
  { name: "Schoolyard / Parking Lot", p: [66, 20, 109], target: [44, 1, 68] },
  { name: "Motel Pool", p: [91, 5, 79], target: [91, 0, 64] },
];
