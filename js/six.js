google.charts.load('current', {'packages':['corechart']});

function energy(m, l, os, vs) {
    let es = [];
    let g = 9.8;
    for (let i = 0; i < os.length; i++) {
        es.push(m * g * l * (1 - Math.cos(os[i])) + 0.5 * m * vs[i] * vs[i]);
    }
    return es;
}

function _solve(a, b, n, o0, w0, l, f, m) {
    let h = (b - a) / (n - 1);

    let ts = [a]; // время
    let os = [o0]; // углы отклонения
    let ws = [w0]; // уловые скорости
    let vs = [l * w0]; // линейные скорости
    let as = [l * f(o0, vs[0], a)]; // линейные ускорения

    for (let i = 1; i < n; i++) {
        ts.push(a + i * h);
        ws.push(ws[i - 1] + h * f(os[i - 1], vs[i - 1], ts[i]));
        os.push(os[i - 1] + h * ws[i]);
        vs.push(l * ws[i]);
        as.push(l * f(os[i], vs[i], ts[i]));
    }

    let es = energy(m, l, os, vs);

    return {
        ws: ws,
        os: os,
        vs: vs,
        as: as,
        ts: ts,
        es: es
    };
}

// a - начальное время
// b - конечное время
// n - кол-во точек
// m - масса
// r - радиус шара
// l - длина стержня
// w0 - начальная угловая скорость
// o0 - начальный угол отклонения
// wind_a - амплитуда ветра
// wind_w - период ветра
// wind_c - сила ветра
// d_env - плотность среды
// c - вязкость
// fc1_enabled - сопр-е жидкости
// fc2_enabled - сопр-е газа
function solve(a, b, n, m, r, l, w0, o0, wind_a, wind_w, wind_c, d_env, c, fc1_enabled, fc2_enabled, fa_enabled) {
    let g = 9.8;

    let vol = 4 / 3 * Math.PI * Math.pow(r, 3);
    let d = m / vol;

    let k1 = 6 * Math.PI * c * d_env * r;
    let s = Math.PI * Math.pow(r, 2);
    let k2 = 0.5 * 0.2 * d_env * s;

    let fa = d_env * g;

    let u = function(t) {
        return wind_c + wind_a * Math.cos(wind_w * t);
    };

    let f = function(theta, v, t) {
        return -(g / l) * Math.sin(theta) - u(t) - k1 * v * fc1_enabled - k2 * Math.abs(v) * v * fc2_enabled + fa * fa_enabled;
    };

    return _solve(a, b, n, o0, w0, l, f, m);
}

function getDataTable(vals, type) {
    let data = new google.visualization.DataTable();

    data.addColumn('number', 'Время');
    data.addColumn('number', 'Угол');
    data.addColumn('number', 'Угловая скорость');
    data.addColumn('number', 'Энергия');

    for (let i = 0; i < vals.ts.length; i++) {
        data.addRow([vals.ts[i], vals.os[i], vals.ws[i], vals.es[i]]);
    }

    // if (type === 'corner') {
    //     data.addColumn('number', 'Угол');
    // }
    // else if (type === 'cornerSpeed') {
    //     data.addColumn('number', 'Угловая скорость');
    // }
    // else if (type === 'energy') {
    //     data.addColumn('number', 'Энергия');
    // }
    //
    // for (let i = 0; i < vals.xs.length; i++) {
    //
    //     if (type === 'coordX') {
    //         data.addRow([vals.ts[i], vals.xs[i]]);
    //     }
    //     else if (type === 'speed') {
    //         data.addRow([vals.ts[i], vals.vs[i]]);
    //     }
    //     else if (type === 'energy') {
    //         data.addRow([vals.ts[i], vals.es[i]]);
    //     }
    // }


    return data;
}

function drawChart(vals, type) {
    let data = getDataTable(vals, type);

    let options = {
        title: 'График',
        curveType: 'line',
        legend: { position: 'bottom' },
        explorer: {
            actions: ['dragToZoom', 'rightClickToReset'],
            axis: 'horizontal',
            keepInBounds: true,
            maxZoomIn: 1000.0
        },
        pointSize: 1
    };

    let chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
    chart.draw(data, options);
}

function clearElement(elem) {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
}

function appendElement(parent, child_type, text, options) {
    let elem = document.createElement(child_type);
    elem.textContent = text;

    for (let key of Object.keys(options)) {
        elem[key] = options[key];
    }

    parent.appendChild(elem);
}

function fillTable(vals) {
    let table_head = document.getElementById('table-head');
    let table_err_temp = document.getElementById('table-err_temp');

    clearElement(table_head);

    appendElement(table_head, 'th', 'Шаг', {});
    appendElement(table_head, 'th', 'Время', {});
    appendElement(table_head, 'th', 'Угол', {});
    appendElement(table_head, 'th', 'Угловая скорость', {});
    appendElement(table_head, 'th', 'Энергия', {});

    let table_body = document.getElementById('table-body');
    clearElement(table_body);

    for (let i = 0; i < vals.ts.length; i++) {
        let tr_el = document.createElement('tr');
        appendElement(tr_el, 'th', i, {});
        appendElement(tr_el, 'th', parseFloat(vals.ts[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.os[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.ws[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.es[i]).toFixed(3), {});

        table_body.appendChild(tr_el);
    }
}

// a - начальное время
// b - конечное время
// n - кол-во точек
// m - масса
// r - радиус шара
// l - длина стержня
// w0 - начальная угловая скорость
// o0 - начальный угол отклонения
// wind_a - амплитуда ветра
// wind_w - период ветра
// wind_c - сила ветра
// d_env - плотность среды
// c - вязкость
// fc1_enabled - сопр-е жидкости
// fc2_enabled - сопр-е газа
//function solve(a, b, n, m, r, l, w0, o0, wind_a, wind_w, wind_c, d_env, c, fc1_enabled, fc2_enabled, fa_enabled)

function getVals() {
    let mass = parseFloat(document.getElementById('mass').value); // масса
    let radius = parseFloat(document.getElementById('radius').value); // радиус
    let length = parseFloat(document.getElementById('length').value); // длина стержня
    let startSpeed = parseFloat(document.getElementById('startSpeed').value); // начальная скор
    let startCorner = parseFloat(document.getElementById('startCorner').value); // начальный угол
    let avs = parseFloat(document.getElementById('avs').value); // амплитуда ветра силы
    let chv = parseFloat(document.getElementById('chv').value); // частота действия ветра
    let wind = parseFloat(document.getElementById('wind').value); // постоянный ветер
    let imp = parseFloat(document.getElementById('imp').value); // импульс
    let plSr = parseFloat(document.getElementById('plSr').value); // плотность среды
    let vSr = parseFloat(document.getElementById('vSr').value); // вязкость среды


    let arPowerCheck = document.getElementById('arPower').checked; // сила архимеда
    let gasPowerCheck = document.getElementById('gasPower').checked; // сила газа
    let waterPowerCheck = document.getElementById('waterPower').checked; // сила воды

    return solve(0,1,100,mass,radius, length, startSpeed, startCorner, avs, chv, wind, plSr, vSr, waterPowerCheck, gasPowerCheck, arPowerCheck)

}

var isRedrawChart = false;
var isRedrawGraph = false;
var typeChart = 'corner';

document.getElementById('apply').onclick = function() {
    if (document.getElementById('radio_chart').checked) {
        isRedrawChart = true;
        isRedrawGraph = false;
        all_none();
        document.getElementById('chart-card').style.display = 'block';

        drawChart(getVals(), typeChart);
    }
    else if (document.getElementById('radio_table').checked){
        isRedrawChart = false;
        isRedrawGraph = false;
        all_none();
        document.getElementById('table-card').style.display = 'block';

        fillTable(getVals());
    }
    else if (document.getElementById('radio_animation').checked) {
        isRedrawChart = false;
        isRedrawGraph = true;
        all_none();
        document.getElementById('animation-card').style.display = 'block';

        start_animation();
    }
};

function all_none() {
    document.getElementById('chart-card').style.display = 'none';
    document.getElementById('table-card').style.display = 'none';
    document.getElementById('animation-card').style.display = 'none';
}

window.onload = function () {
    all_none();

    $('select').material_select();
};

window.onresize = () => {
    if (isRedrawChart) { drawChart(getVals(), typeChart) }
    if (isRedrawGraph) { start_animation() }
};
