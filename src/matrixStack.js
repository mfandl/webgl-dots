'use strict';

const mat4 = require('gl-matrix').mat4;

let matrices = [
    mat4.create()
];

let activeIndex = 0;

function current () {
    return matrices[activeIndex];
}

function push () {
    const currentMatrix = current();

    if (++activeIndex >= matrices.length) {
        const gap = activeIndex - matrices.length;
        for (let i = 0; i <= gap; ++i) {
            matrices.push(mat4.clone(currentMatrix));
        }
    }

    mat4.copy(current(), currentMatrix);
}

function pop () {
    if (--activeIndex < 0) {
        console.error('Matrix stack empty.');
        activeIndex = 0;
    }
}

module.exports = {
    current: current,
    push: push,
    pop: pop
}