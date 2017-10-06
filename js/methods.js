
export function analytical(xs, coffee_temp, env_temp, cooling_coef) {
    let c = coffee_temp - env_temp;
    let T  = (t) => { return c / Math.pow(Math.E, cooling_coef * t) + env_temp };
    
    let Ts = [];
    for (let i = 0; i < xs.length + 1; i++) {
        Ts.push(T(xs[i]));
    }

    return {name: 'Аналитическое решение', ys: Ts};
}

export function euler(a, b, xs, y0, f) {
    let n = xs.length;
    let h = (b - a) / n;
    let e = (y_prev, x_prev) => { return y_prev + h * f(x_prev, y_prev) };

    let ys = [y0];
    for (let i = 1; i < n + 1; i++) {
        ys.push(e(ys[i - 1], xs[i - 1]));
    }

    return {name: 'Метод Эйлера', ys: ys};
}

export function euler_up(a, b, xs, y0, f) {
    let n = xs.length;
    let h = (b - a) / n;
    let e = (y_prev, x_prev, x, y_corrector) => { return y_prev + h * (f(x_prev, y_prev) + f(x, y_corrector)) / 2 };

    let ys = euler(a, b, xs, y0, f).ys;
    let ys_up = [y0];

    for (let i = 1; i < n + 1; i++) {
        ys_up.push(e(ys_up[i - 1], xs[i - 1], xs[i], ys[i]));
    }

    return {name: 'Модифицированный метод Эйлера', ys: ys_up};
}

export function euler_fixed(a, b, xs, y0, f) {
    let n = xs.length;
    let h = (b - a) / n;
    let k1 = (x, y) => { return h * f(x, y) };
    let k2 = (x, y) => { return h * f(x + h, y + k1(x, y)) };
    let e = (x, y) => { return y + (k1(x, y) + k2(x, y)) / 2 };

    let ys = [y0];
    for (let i = 1; i < n + 1; i++) {
        ys.push(e(xs[i - 1], ys[i - 1]));
    }

    return {name: 'Исправленный метод Эйлера', ys: ys};
}

export function runge_kutta(a, b, xs, y0, f) {
    let n = xs.length;
    let h = (b - a) / n;
    let k1 = (x, y) => { return f(x, y) };
    let k2 = (x, y) => { return f(x + h / 2, y + h / 2 * k1(x, y)) };
    let k3 = (x, y) => { return f(x + h / 2, y + h / 2 * k2(x, y)) };
    let k4 = (x, y) => { return f(x + h, y + h * k3(x, y)) };
    let rk = (x, y) => { return y + h / 6 * (k1(x, y) + 2 * k2(x, y) + 2 * k3(x, y) + k4(x, y)) };

    let ys = [y0];
    for (let i = 1; i < n + 1; i++) {
        ys.push(rk(xs[i - 1], ys[i - 1]));
    }

    return {name: 'Метод Рунге-Кутта 4-ого порядка', ys: ys};
}
