"use strict";
// A small WebGL renderer: static geometry is batched into a shared mesh.
const canvas = document.querySelector("#city");
const gl =
  canvas.getContext("webgl2", { antialias: false, alpha: false }) ||
  canvas.getContext("webgl", { antialias: false, alpha: false });
if (!gl) {
  document.querySelector("#loading").textContent =
    "This memory needs WebGL. Please enable hardware acceleration or try another browser.";
  throw new Error("WebGL unavailable");
}
const vertex = `attribute vec3 position;attribute vec3 color;attribute vec2 uv;uniform mat4 camera;uniform mediump vec3 eye;varying vec3 tint;varying vec2 tex;varying float distanceToEye;varying vec3 world;void main(){world=position;tint=color;tex=uv;distanceToEye=distance(position,eye);gl_Position=camera*vec4(position,1.);}`;
const fragment = `precision mediump float;varying vec3 tint;varying vec2 tex;varying float distanceToEye;varying vec3 world;uniform sampler2D atlas;uniform float fog;uniform mediump vec3 eye;void main(){vec3 c=tint;if(tex.x<0.&&tint.r>.32&&tint.r<.53&&world.y>.4&&world.y<40.){float brick=step(.955,fract(world.y*2.7));float joints=step(.97,fract((world.x+world.z)*1.8+floor(world.y*2.7)*.5));c*=1.-.10*max(brick,joints);}if(tex.x>=0.)c*=texture2D(atlas,tex).rgb;if(world.y<.1&&tint.r<.26){float sheen=pow(1.-clamp((eye.y-world.y)/max(.1,distanceToEye),0.,1.),3.);float patches=.5+.5*sin(world.x*1.7+sin(world.z*2.3));c=mix(c,vec3(.53,.57,.58),sheen*(.08+patches*.16));}float pink=max(0.,1.-distance(world.xz,vec2(37.,-34.))/10.);float cyan=max(0.,1.-distance(world.xz,vec2(51.,-34.))/10.);float low=max(0.,1.-world.y/12.);c+=(vec3(.13,.02,.07)*pink+vec3(.01,.10,.12)*cyan)*low;float f=1.-exp(-pow(distanceToEye/fog,1.65));gl_FragColor=vec4(mix(c,vec3(.53,.57,.58),f),1.);}`;
function shader(type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw Error(gl.getShaderInfoLog(s));
  return s;
}
const program = gl.createProgram();
gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS))
  throw Error(gl.getProgramInfoLog(program));
gl.useProgram(program);
const locations = {};
for (const n of ["camera", "eye", "fog", "atlas"])
  locations[n] = gl.getUniformLocation(program, n);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
function bindMesh(mesh) {
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh);
  for (const [n, size, offset] of [
    ["position", 3, 0],
    ["color", 3, 12],
    ["uv", 2, 24],
  ]) {
    const a = gl.getAttribLocation(program, n);
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, size, gl.FLOAT, false, 32, offset);
  }
}
bindMesh(buffer);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.53, 0.57, 0.58, 1);
let vertices = [],
  staticMesh,
  staticCount = 0;
function triangle(
  a,
  b,
  c,
  color,
  uvs = [
    [-1, -1],
    [-1, -1],
    [-1, -1],
  ],
) {
  for (const [i, p] of [a, b, c].entries())
    vertices.push(...p, ...color, ...uvs[i]);
}
function quad(a, b, c, d, color, uv) {
  triangle(a, b, c, color, uv ? [uv[0], uv[1], uv[2]] : undefined);
  triangle(a, c, d, color, uv ? [uv[0], uv[2], uv[3]] : undefined);
}
function box(x, y, z, w, h, d, c) {
  let X = x + w / 2,
    A = x - w / 2,
    Y = y + h,
    B = z - d / 2,
    Z = z + d / 2;
  quad([A, y, Z], [X, y, Z], [X, Y, Z], [A, Y, Z], c);
  quad(
    [X, y, B],
    [A, y, B],
    [A, Y, B],
    [X, Y, B],
    c.map((v) => v * 0.77),
  );
  quad(
    [A, y, B],
    [A, y, Z],
    [A, Y, Z],
    [A, Y, B],
    c.map((v) => v * 0.84),
  );
  quad(
    [X, y, Z],
    [X, y, B],
    [X, Y, B],
    [X, Y, Z],
    c.map((v) => v * 0.92),
  );
  quad(
    [A, Y, Z],
    [X, Y, Z],
    [X, Y, B],
    [A, Y, B],
    c.map((v) => v * 1.08),
  );
}
function line(a, b, r, c) {
  let dx = b[0] - a[0],
    dy = b[1] - a[1],
    dz = b[2] - a[2],
    len = Math.hypot(dx, dy, dz),
    u = Math.hypot(dx, dz) > 0.001 ? [-dz, 0, dx] : [1, 0, 0];
  let ul = Math.hypot(...u);
  u = u.map((v) => (v * r) / ul);
  let v = [
    dy * u[2] - dz * u[1],
    dz * u[0] - dx * u[2],
    dx * u[1] - dy * u[0],
  ].map((k) => k / len);
  let pts = [u, v, u.map((k) => -k), v.map((k) => -k)];
  for (let i = 0; i < 4; i++) {
    let p = pts[i],
      q = pts[(i + 1) % 4];
    quad(
      a.map((k, j) => k + p[j]),
      b.map((k, j) => k + p[j]),
      b.map((k, j) => k + q[j]),
      a.map((k, j) => k + q[j]),
      c,
    );
  }
}
function multiply(a, b) {
  let r = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let row = 0; row < 4; row++)
      for (let k = 0; k < 4; k++)
        r[c * 4 + row] += a[k * 4 + row] * b[c * 4 + k];
  return r;
}
function cameraMatrix(p, yaw, pitch, aspect) {
  let f = [
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    ],
    r = [Math.cos(yaw), 0, Math.sin(yaw)],
    u = [
      -Math.sin(yaw) * Math.sin(pitch),
      Math.cos(pitch),
      Math.cos(yaw) * Math.sin(pitch),
    ];
  let v = new Float32Array([
    r[0],
    u[0],
    -f[0],
    0,
    r[1],
    u[1],
    -f[1],
    0,
    r[2],
    u[2],
    -f[2],
    0,
    -r.reduce((s, k, i) => s + k * p[i], 0),
    -u.reduce((s, k, i) => s + k * p[i], 0),
    f.reduce((s, k, i) => s + k * p[i], 0),
    1,
  ]);
  let t = 1 / Math.tan(Math.PI / 6),
    n = 0.1,
    F = 450;
  return multiply(
    new Float32Array([
      t / aspect,
      0,
      0,
      0,
      0,
      t,
      0,
      0,
      0,
      0,
      (F + n) / (n - F),
      -1,
      0,
      0,
      (2 * F * n) / (n - F),
      0,
    ]),
    v,
  );
}
// A soft cloud ceiling rendered behind the district; no sky image.
const skyProgram = gl.createProgram();
gl.attachShader(
  skyProgram,
  shader(
    gl.VERTEX_SHADER,
    "attribute vec2 point;varying vec2 screen;void main(){screen=point;gl_Position=vec4(point,0.,1.);}",
  ),
);
gl.attachShader(
  skyProgram,
  shader(
    gl.FRAGMENT_SHADER,
    `precision mediump float;varying vec2 screen;uniform vec3 heading;uniform float aspect;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}void main(){vec3 f=vec3(sin(heading.x)*cos(heading.y),sin(heading.y),-cos(heading.x)*cos(heading.y));vec3 r=vec3(cos(heading.x),0.,sin(heading.x));vec3 u=vec3(-sin(heading.x)*sin(heading.y),cos(heading.y),cos(heading.x)*sin(heading.y));vec3 ray=normalize(f+r*screen.x*aspect*.577+u*screen.y*.577);vec2 p=ray.xz/max(.12,ray.y)*1.8+vec2(heading.z*.002,0.);float n=noise(p)*.6+noise(p*2.)*.28+noise(p*4.)*.12;float height=smoothstep(-.02,.5,ray.y);vec3 fog=vec3(.53,.57,.58);vec3 clouds=vec3(.62,.65,.65)+(n-.5)*.15;gl_FragColor=vec4(mix(fog,clouds,height),1.);}`,
  ),
);
gl.linkProgram(skyProgram);
const skyBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 3, -1, -1, 3]),
  gl.STATIC_DRAW,
);
function drawSky(yaw, pitch, time) {
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(skyProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
  const a = gl.getAttribLocation(skyProgram, "point");
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 8, 0);
  gl.uniform3f(gl.getUniformLocation(skyProgram, "heading"), yaw, pitch, time);
  gl.uniform1f(
    gl.getUniformLocation(skyProgram, "aspect"),
    canvas.width / canvas.height,
  );
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  bindMesh(buffer);
}
bindMesh(buffer);
