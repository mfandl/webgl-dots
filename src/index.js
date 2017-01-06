'use strict';

let mat4 = require('gl-matrix').mat4;
let resl = require('resl');

let ms = require('./matrixStack');

let canvas;
let gl;

let shaderProgram;

let vertexBuffer;
let colorBuffer;
let indexBuffer;

let pMatrix;
let mvMatrix;

let startTime;
let elapsedTime = 0;

let positions = [];

let viewport = {
  width: 800,
  height: 600,
  get aspectRatio () {
    return this.width / this.height;
  }

};

addEventListener('load', onLoad);

addEventListener('resize', updateSize);

function updateSize () {
  viewport.width = canvas.width = window.innerWidth;
  viewport.height = canvas.height = window.innerHeight;
}

function onLoad () {
  resl({
    manifest: {
      fragmentShader: {
        type: 'text',
        src: 'shaders/fs.glsl'
      },

      vertexShader: {
        type: 'text',
        src: 'shaders/vs.glsl'
      }
    },

    onDone: init
  });
}

function init (assets) {
  const halfSide = 10;
  for (var i = 0; i < 1000; ++i) {
    positions.push(
      [
        randomSign() * Math.random() * halfSide,
        randomSign() * Math.random() * halfSide,
        randomSign() * Math.random() * halfSide
      ]);
  }

  console.log(positions);

  function randomSign () {
    return Math.random() < 0.5 ? -1 : 1;
  }

  startTime = new Date().getTime() / 1000;

  canvas = document.getElementById('cnvs');
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    console.error('WebGL init failed');
  }

  updateSize();

  pMatrix = mat4.create();
  mvMatrix = mat4.create();

  setShaders(
    compileShader(assets.vertexShader, gl.VERTEX_SHADER),
    compileShader(assets.fragmentShader, gl.FRAGMENT_SHADER)
  );

  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  setInterval(drawScene, 1000 / 60);
}

function compileShader (source, type) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
  }

  return shader;
}

function setShaders (vertex, fragment) {
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertex);
  gl.attachShader(shaderProgram, fragment);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Shader linking failed.");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'vertexPosition');
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'vertexColor');
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'pMatrix');
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'mvMatrix');
  shaderProgram.elapsedTimeUniform = gl.getUniformLocation(shaderProgram, 'elapsedTime');
}

function initBuffers () {
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  
  let vertices = [
    -1.0,  1.0,  0.0,
    -1.0, -1.0,  0.0,
    1.0, -1.0,  0.0,
    1.0, 1.0, 0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  vertexBuffer.itemSize = 3;
  vertexBuffer.numItems = 4;

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  let indices = [
    0, 1, 2,
    0, 2, 3
  ];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  indexBuffer.itemSize = 1;
  indexBuffer.numItems = 6;

  colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  
  let colors = [
    1.0, 0.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  colorBuffer.itemSize = 4;
  colorBuffer.numItems = 4;


}

function drawScene ()  {
  gl.viewport(0, 0, viewport.width, viewport.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  mat4.perspective(pMatrix, Math.PI / 4, viewport.aspectRatio, 0.1, 100);
  
  mat4.identity(ms.current());
  mat4.translate(ms.current(), ms.current(), [0.0, 0.0, -20.0]);

  positions.forEach((position) => drawTriangle(position));
}

function drawTriangle (position) {
  ms.push();
  mat4.rotate(ms.current(), ms.current(), elapsedTime, [1, 1, 1]);
  mat4.translate(ms.current(), ms.current(), position);
  
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

  elapsedTime = new Date().getTime() / 1000 - startTime;
  gl.uniform1f(shaderProgram.elapsedTimeUniform, elapsedTime);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  ms.pop();
  
}

function setMatrixUniforms () {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, ms.current());
}
