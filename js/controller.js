import { euler, euler_up, euler_fixed, runge_kutta } from "./methods.js";

function f(x, y) {
    return x * x / 10;
}

function genXS(a, b, n) {
    let h = (b - a) / (n - 1);
    let xs = [];

    for (let i = 0; i < n; i++) {
        xs.push(a + h * i);
    }

    return xs;
}
