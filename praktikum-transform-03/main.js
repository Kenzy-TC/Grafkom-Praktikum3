import { Mat3 } from "./matrix3.js";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2", { antialias: true });

if (!gl) {
  throw new Error("WebGL2 tidak tersedia.");
}

const vertexShaderSource = `#version 300 es
in vec2 a_position;
uniform mat3 u_matrix;
void main() {
  vec3 p = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
  gl_PointSize = 9.0;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  outColor = u_color;
}`;

function createShader(glContext, type, source) {
  const shader = glContext.createShader(type);
  glContext.shaderSource(shader, source);
  glContext.compileShader(shader);
  if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
    const message = glContext.getShaderInfoLog(shader);
    glContext.deleteShader(shader);
    throw new Error(`Shader compile error:\n${message}`);
  }
  return shader;
}

function createProgram(glContext, vertexShader, fragmentShader) {
  const programObject = glContext.createProgram();
  glContext.attachShader(programObject, vertexShader);
  glContext.attachShader(programObject, fragmentShader);
  glContext.linkProgram(programObject);
  if (!glContext.getProgramParameter(programObject, glContext.LINK_STATUS)) {
    const message = glContext.getProgramInfoLog(programObject);
    glContext.deleteProgram(programObject);
    throw new Error(`Program link error:\n${message}`);
  }
  return programObject;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

gl.useProgram(program);

const vertices = new Float32Array([
  -0.18, -0.15,
   0.18, -0.15,
   0.00,  0.22
]);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const matrixLocation = gl.getUniformLocation(program, "u_matrix");
const colorLocation = gl.getUniformLocation(program, "u_color");

const colorA = new Float32Array([0.10, 0.84, 1.00, 1.00]);
const colorB = new Float32Array([1.00, 0.48, 0.15, 1.00]);
const colorC = new Float32Array([0.68, 0.42, 1.00, 1.00]);
const axisColor = new Float32Array([0.32, 0.90, 0.96, 0.62]);
const gridColor = new Float32Array([0.16, 0.43, 0.55, 0.20]);
const pivotColor = new Float32Array([1.00, 0.92, 0.20, 1.00]);
const childColor = new Float32Array([0.25, 1.00, 0.67, 1.00]);

const objectA = {
  x: -0.35,
  y: 0.0,
  rotation: 0.0,
  scaleX: 1.0,
  scaleY: 1.0
};

const objectC = {
  x: 0.38,
  y: 0.03,
  rotation: 35.0,
  scaleX: 1.25,
  scaleY: 0.68
};

const pivotDemo = {
  enabled: false,
  pivotX: 0.18,
  pivotY: 0.0,
  x: 0.00,
  y: 0.31,
  rotation: 0.0,
  scaleX: 1.0,
  scaleY: 1.0
};

const childLocal = {
  x: 0.28,
  y: 0.02,
  rotation: 30.0,
  scaleX: 0.45,
  scaleY: 0.45
};

const keys = {};
let mouseMode = false;
let orderMode = 0;
let orbitMode = false;
let showAxes = true;
let showPivot = true;
let autoObjectB = true;
let showParentChild = false;
let paused = false;
let lastTime = 0;
let animationTime = 0;
let frameCount = 0;
let fpsAccumulator = 0;
let fpsFrames = 0;
let displayedFps = 60;
let rotationSpeed = 100.0;
let scaleSpeed = 0.8;

const positionInfo = document.getElementById("positionInfo");
const rotationInfo = document.getElementById("rotationInfo");
const scaleInfo = document.getElementById("scaleInfo");
const orderInfo = document.getElementById("orderInfo");
const pivotInfo = document.getElementById("pivotInfo");
const fpsInfo = document.getElementById("fpsInfo");
const frameInfo = document.getElementById("frameInfo");
const runStatus = document.getElementById("runStatus");

const rotationSpeedInput = document.getElementById("rotationSpeed");
const rotationSpeedValue = document.getElementById("rotationSpeedValue");
const scaleSpeedInput = document.getElementById("scaleSpeed");
const scaleSpeedValue = document.getElementById("scaleSpeedValue");
const autoObjectBInput = document.getElementById("autoObjectB");
const showAxesInput = document.getElementById("showAxes");
const showPivotInput = document.getElementById("showPivot");
const showParentChildInput = document.getElementById("showParentChild");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const orderButton = document.getElementById("orderButton");
const orbitButton = document.getElementById("orbitButton");
const pivotButton = document.getElementById("pivotButton");

function degToRad(degree) {
  return degree * Math.PI / 180;
}

function createTRSMatrix(transform) {
  const t = Mat3.translation(transform.x, transform.y);
  const r = Mat3.rotation(degToRad(transform.rotation));
  const s = Mat3.scaling(transform.scaleX, transform.scaleY);
  return Mat3.multiply(t, Mat3.multiply(r, s));
}

function createRTMatrix(transform) {
  const t = Mat3.translation(transform.x, transform.y);
  const r = Mat3.rotation(degToRad(transform.rotation));
  return Mat3.multiply(t, r);
}

function createScaleThenTranslateMatrix(transform) {
  const t = Mat3.translation(transform.x, transform.y);
  const s = Mat3.scaling(transform.scaleX, transform.scaleY);
  return Mat3.multiply(t, s);
}

function createPivotMatrix(transform) {
  const pivotT = Mat3.translation(transform.pivotX, transform.pivotY);
  const pivotBack = Mat3.translation(-transform.pivotX, -transform.pivotY);
  const r = Mat3.rotation(degToRad(transform.rotation));
  const s = Mat3.scaling(transform.scaleX, transform.scaleY);
  const local = Mat3.multiply(r, s);
  return Mat3.multiply(
    Mat3.translation(transform.x, transform.y),
    Mat3.multiply(pivotT, Mat3.multiply(local, pivotBack))
  );
}

function createOrbitMatrix(seconds) {
  const orbitRadius = 0.43;
  const orbitAngle = seconds * 55.0;
  const orbitT = Mat3.translation(
    Math.cos(degToRad(orbitAngle)) * orbitRadius,
    Math.sin(degToRad(orbitAngle)) * orbitRadius
  );
  const localR = Mat3.rotation(degToRad(seconds * 100.0));
  const localS = Mat3.scaling(0.60, 0.60);
  return Mat3.multiply(orbitT, Mat3.multiply(localR, localS));
}

function drawObject(matrix, color) {
  gl.bindVertexArray(vao);
  gl.uniformMatrix3fv(matrixLocation, false, matrix);
  gl.uniform4fv(colorLocation, color);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function drawLines(verticesData, color, matrix = Mat3.identity()) {
  gl.bindVertexArray(null);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesData, gl.STREAM_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix3fv(matrixLocation, false, matrix);
  gl.uniform4fv(colorLocation, color);
  gl.drawArrays(gl.LINES, 0, verticesData.length / 2);
  gl.deleteBuffer(buffer);
}

function drawPoint(position, color, matrix) {
  gl.bindVertexArray(null);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STREAM_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix3fv(matrixLocation, false, matrix);
  gl.uniform4fv(colorLocation, color);
  gl.drawArrays(gl.POINTS, 0, 1);
  gl.deleteBuffer(buffer);
}

function drawWorldGrid() {
  const lines = [];
  const step = 0.10;
  for (let value = -1; value <= 1.0001; value += step) {
    lines.push(value, -1, value, 1);
    lines.push(-1, value, 1, value);
  }
  drawLines(new Float32Array(lines), gridColor);
}

function drawWorldAxes() {
  const axisVertices = new Float32Array([
    -1.0, 0.0, 1.0, 0.0,
    0.0, -1.0, 0.0, 1.0
  ]);
  drawLines(axisVertices, axisColor);
}

function drawLocalBasis(matrix) {
  const basisVertices = new Float32Array([
    0.0, 0.0, 0.13, 0.0,
    0.0, 0.0, 0.0, 0.13
  ]);
  drawLines(basisVertices, new Float32Array([0.20, 1.00, 0.63, 0.75]), matrix);
}

function updateTranslation(dt) {
  const moveSpeed = 0.65;
  if (keys["arrowleft"] || keys["a"]) objectA.x -= moveSpeed * dt;
  if (keys["arrowright"] || keys["d"]) objectA.x += moveSpeed * dt;
  if (keys["arrowup"] || keys["w"]) objectA.y += moveSpeed * dt;
  if (keys["arrowdown"] || keys["s"]) objectA.y -= moveSpeed * dt;
}

function updateRotation(dt) {
  if (keys["q"]) objectA.rotation -= rotationSpeed * dt;
  if (keys["e"]) objectA.rotation += rotationSpeed * dt;
}

function updateUniformScale(dt) {
  if (keys["+"] || keys["="]) {
    objectA.scaleX += scaleSpeed * dt;
    objectA.scaleY += scaleSpeed * dt;
  }
  if (keys["-"] || keys["_"]) {
    objectA.scaleX -= scaleSpeed * dt;
    objectA.scaleY -= scaleSpeed * dt;
  }
}

function updateNonUniformScale(dt) {
  if (keys["z"]) objectA.scaleX -= scaleSpeed * dt;
  if (keys["x"]) objectA.scaleX += scaleSpeed * dt;
  if (keys["c"]) objectA.scaleY -= scaleSpeed * dt;
  if (keys["v"]) objectA.scaleY += scaleSpeed * dt;
}

function clampObjectA() {
  objectA.x = Math.max(-0.80, Math.min(0.80, objectA.x));
  objectA.y = Math.max(-0.72, Math.min(0.72, objectA.y));
  objectA.scaleX = Math.max(0.2, Math.min(2.5, objectA.scaleX));
  objectA.scaleY = Math.max(0.2, Math.min(2.5, objectA.scaleY));
  while (objectA.rotation > 360) objectA.rotation -= 360;
  while (objectA.rotation < -360) objectA.rotation += 360;
}

function resetObjectA() {
  objectA.x = -0.35;
  objectA.y = 0.0;
  objectA.rotation = 0.0;
  objectA.scaleX = 1.0;
  objectA.scaleY = 1.0;
  orderMode = 0;
  mouseMode = false;
  orbitMode = false;
  pivotDemo.enabled = false;
  showParentChild = false;
  showParentChildInput.checked = false;
}

function applyPreset(number) {
  if (number === 1) {
    objectA.x = -0.4; objectA.y = 0.2; objectA.rotation = 0.0; objectA.scaleX = 1.0; objectA.scaleY = 1.0;
  }
  if (number === 2) {
    objectA.x = 0.0; objectA.y = 0.0; objectA.rotation = 45.0; objectA.scaleX = 1.5; objectA.scaleY = 1.5;
  }
  if (number === 3) {
    objectA.x = 0.3; objectA.y = -0.2; objectA.rotation = 90.0; objectA.scaleX = 1.8; objectA.scaleY = 0.6;
  }
}

function pixelToNdc(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  return { x: x * 2 - 1, y: 1 - y * 2 };
}

function updateHUD() {
  positionInfo.textContent = `(${objectA.x.toFixed(2)}, ${objectA.y.toFixed(2)})`;
  rotationInfo.textContent = `${objectA.rotation.toFixed(1)}°`;
  scaleInfo.textContent = `(${objectA.scaleX.toFixed(2)}, ${objectA.scaleY.toFixed(2)})`;

  if (orderMode === 0) orderInfo.textContent = "Scale → Rotate → Translate";
  if (orderMode === 1) orderInfo.textContent = "Rotate → Translate";
  pivotInfo.textContent = pivotDemo.enabled ? "Door hinge demo ON" : "Local origin (0,0)";

  fpsInfo.textContent = `${displayedFps} FPS`;
  frameInfo.textContent = `FRAME ${String(frameCount).padStart(4, "0")}`;
  runStatus.textContent = paused ? "PAUSED" : "LIVE";
  pauseButton.firstChild.textContent = paused ? "Resume " : "Pause ";
  pauseButton.classList.toggle("primary", !paused);
  rotationSpeedValue.textContent = `${Math.round(rotationSpeed)}°/s`;
  scaleSpeedValue.textContent = scaleSpeed.toFixed(2);
}

function update(dt, seconds) {
  updateTranslation(dt);
  updateRotation(dt);
  updateUniformScale(dt);
  updateNonUniformScale(dt);
  clampObjectA();

  if (pivotDemo.enabled) {
    pivotDemo.rotation = seconds * 70.0;
  }
}

function getOrderMatrix(transform) {
  return orderMode === 0 ? createTRSMatrix(transform) : createRTMatrix(transform);
}

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.006, 0.012, 0.026, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  drawWorldGrid();
  if (showAxes) drawWorldAxes();

  const matrixA = getOrderMatrix(objectA);
  drawObject(matrixA, colorA);
  drawLocalBasis(matrixA);
  if (showPivot) drawPoint([0, 0], pivotColor, matrixA);

  if (showParentChild) {
    const parentMatrix = createTRSMatrix(objectC);
    drawObject(parentMatrix, colorC);
    if (showPivot) drawPoint([0, 0], pivotColor, parentMatrix);

    const childLocalMatrix = createTRSMatrix(childLocal);
    const childWorldMatrix = Mat3.multiply(parentMatrix, childLocalMatrix);
    drawObject(childWorldMatrix, childColor);
    if (showPivot) drawPoint([0, 0], childColor, childWorldMatrix);
  } else {
    let matrixC;
    if (orbitMode) {
      matrixC = createOrbitMatrix(animationTime);
    } else {
      matrixC = orderMode === 0 ? createTRSMatrix(objectC) : createScaleThenTranslateMatrix(objectC);
    }
    drawObject(matrixC, colorC);
    if (showPivot) drawPoint([0, 0], pivotColor, matrixC);
  }

  if (autoObjectB) {
    if (pivotDemo.enabled) {
      const pivotMatrix = createPivotMatrix(pivotDemo);
      drawObject(pivotMatrix, colorB);
      if (showPivot) {
        const pivotMarkerMatrix = Mat3.translation(pivotDemo.x, pivotDemo.y);
        drawPoint([pivotDemo.pivotX, pivotDemo.pivotY], pivotColor, pivotMarkerMatrix);
      }
    } else {
      const pulse = 1.0 + Math.sin(animationTime * 2.0) * 0.25;
      const transformB = {
        x: -0.04,
        y: 0.42,
        rotation: animationTime * 70.0,
        scaleX: pulse,
        scaleY: pulse
      };
      const matrixB = createTRSMatrix(transformB);
      drawObject(matrixB, colorB);
      if (showPivot) drawPoint([0, 0], pivotColor, matrixB);
    }
  }

  if (orbitMode) {
    drawPoint([0, 0], axisColor, Mat3.identity());
  }

  gl.bindVertexArray(null);
}

rotationSpeedInput.addEventListener("input", () => {
  rotationSpeed = Number(rotationSpeedInput.value);
  updateHUD();
});

scaleSpeedInput.addEventListener("input", () => {
  scaleSpeed = Number(scaleSpeedInput.value);
  updateHUD();
});

autoObjectBInput.addEventListener("change", () => { autoObjectB = autoObjectBInput.checked; });
showAxesInput.addEventListener("change", () => { showAxes = showAxesInput.checked; });
showPivotInput.addEventListener("change", () => { showPivot = showPivotInput.checked; });
showParentChildInput.addEventListener("change", () => { showParentChild = showParentChildInput.checked; });

pauseButton.addEventListener("click", () => { paused = !paused; updateHUD(); });
resetButton.addEventListener("click", () => { resetObjectA(); updateHUD(); });
orderButton.addEventListener("click", () => { orderMode = orderMode === 0 ? 1 : 0; updateHUD(); });
orbitButton.addEventListener("click", () => { orbitMode = !orbitMode; updateHUD(); });
pivotButton.addEventListener("click", () => { pivotDemo.enabled = !pivotDemo.enabled; updateHUD(); });

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.key.startsWith("Arrow") || event.key === " ") event.preventDefault();
  if (event.repeat) return;

  const key = event.key.toLowerCase();
  if (key === "r") resetObjectA();
  if (key === "1" || key === "2" || key === "3") applyPreset(Number(key));
  if (key === "t") orderMode = orderMode === 0 ? 1 : 0;
  if (key === "m") mouseMode = !mouseMode;
  if (key === "p" || key === " ") paused = !paused;
  if (key === "o") orbitMode = !orbitMode;
  if (key === "y") pivotDemo.enabled = !pivotDemo.enabled;
  if (key === "h") showParentChild = !showParentChild;
  updateHUD();
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("click", (event) => {
  if (!mouseMode) return;
  const ndc = pixelToNdc(event);
  objectA.x = ndc.x;
  objectA.y = ndc.y;
  clampObjectA();
  updateHUD();
});

function render(time) {
  const realDt = lastTime === 0 ? 0 : (time - lastTime) * 0.001;
  lastTime = time;
  const dt = Math.min(Math.max(realDt, 0), 0.05);

  if (!paused) animationTime += dt;
  update(dt, animationTime);
  updateHUD();
  drawScene();

  frameCount += 1;
  fpsAccumulator += dt;
  fpsFrames += 1;
  if (fpsAccumulator >= 0.5) {
    displayedFps = Math.round(fpsFrames / fpsAccumulator);
    fpsAccumulator = 0;
    fpsFrames = 0;
  }

  requestAnimationFrame(render);
}

updateHUD();
requestAnimationFrame(render);
