function euler(a, b, xs, y0, f) {
    let n = xs.length;
    let h = (b - a) / (n - 1);
    let e = (y_prev, x_prev) => { y_prev + h * f(x_prev, y_prev) };

    let ys = [e(y0, a)];
    for (let i = 1; i < n; i++) {
        ys.push(e(ys[i - 1], xs[i - 1]));
    }

    return ys;
}

function euler_up(a, b, xs, y0, f) {
    let n = xs.length;
    let h = (b - a) / (n - 1);
    let e = (y_prev, x_prev, x, y_corrector) => { y_prev + h * (f(x_prev, y_prev) + f(x, y_corrector)) / 2 };

    let ys = euler(a, b, xs, y0, f);
    let ys_up = [e(y0, a, a + h, ys[1])];

    for (let i = 1; i < n; i++) {
        ys_up.push(e(ys_up[i - 1], xs[i - 1], xs[i], ys[i]));
    }

    return ys_up;
}

function euler_fixed(a, b, xs, y0, f) {
    let n = xs.length;
    let h = (b - a) / (n - 1);
    let k1 = (x, y) => { h * f(x, y) };
    let k2 = (x, y) => { h * f(x + h, y + k1(x, y)) };
    let e = (x, y) => { y + (k1(x, y) + k2(x, y)) / 2 };

    let ys = [y0];
    for (let i = 1; i < n; i++) {
        ys.push(e(xs[i - 1], ys[i - 1]));
    }

    return ys;
}

function runge_kutta(a, b, xs, y0, f) {
    let n = xs.length;
    let h = (b - a) / (n - 1);
    let k1 = (x, y) => { f(x, y) };
    let k2 = (x, y) => { f(x + h / 2, y + h / 2 * k1(x, y)) };
    let k3 = (x, y) => { f(x + h / 2, y + h / 2 * k2(x, y)) };
    let k4 = (x, y) => { f(x + h, y + h * k3(x, y)) };
    let rk = (x, y) => { y + h / 6 * (k1(x, y) + 2 * k2(x, y) + 2 * k3(x, y) + k4(x, y)) };

    let ys = [y0];
    for (let i = 1; i < n; i++) {
        ys.push(rk(xs[i - 1], ys[i - 1]));
    }

    return ys;
}
