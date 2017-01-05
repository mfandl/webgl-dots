precision mediump float;

attribute vec3 vertexPosition;
attribute vec4 vertexColor;

uniform float elapsedTime;

uniform mat4 mvMatrix;
uniform mat4 pMatrix;

varying vec4 color;

void main(void) {
    gl_Position = pMatrix * mvMatrix * vec4(vertexPosition * (1.0 + abs(sin(elapsedTime))), 1.0);
    color = vertexColor;
}