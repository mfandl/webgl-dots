'use strict';

let mat4 = require('gl-matrix-mat4');
let resl = require('resl');

let canvas;
let gl;
let w, h;

let shaderProgram;

let vertexBuffer;
let colorBuffer;

let pMatrix;
let mvMatrix;

let startTime;
let elapsedTime = 0;


addEventListener('load', onLoad);

addEventListener('resize', resize);

function resize () {
  w = gl.viewportWidth = canvas.width = window.innerWidth;
  h = gl.viewportHeight = canvas.height = window.innerHeight;
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
  startTime = new Date().getTime() / 1000;

  canvas = document.getElementById('cnvs');
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    console.error('WebGL init failed');
  }

  resize();

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
    0.0,  1.0,  0.0,
    -1.0, -1.0,  0.0,
    1.0, -1.0,  0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  vertexBuffer.itemSize = 3;
  vertexBuffer.numItems = 3;

  colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  
  let colors = [
    1.0, 0.0, 0.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    1.0, 0.0, 1.0, 1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  colorBuffer.itemSize = 4;
  colorBuffer.numItems = 3;
}

function drawScene ()  {

  
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  mat4.perspective(pMatrix, Math.PI / 4, gl.viewportWidth / gl.viewportHeight, 0.1, 100);
  mat4.identity(mvMatrix);

  mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -7.0]);
  mat4.rotate(mvMatrix, mvMatrix, Math.random() * 0.02, [1, 1, 1]);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);

  elapsedTime = new Date().getTime() / 1000 - startTime;
  gl.uniform1f(shaderProgram.elapsedTimeUniform, elapsedTime);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexBuffer.numItems);
}

function setMatrixUniforms () {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}
