precision mediump float;

uniform float elapsedTime;

varying vec4 color;

void main(void) {
    gl_FragColor = abs(sin(vec4(color.xyz + elapsedTime, 1.0)));
}