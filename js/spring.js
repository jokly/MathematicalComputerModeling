google.charts.load('current', {'packages':['corechart']});

function _solve(a, b, n, x0, v0, w0, gamma, f) {
    let h = (b - a) / (n - 1);
    let xs = [x0];
    let vs = [v0];
    let ts = [a];
 
    for (let i = 1; i < n; i++) {
        let tmp = -Math.pow(w0, 2) * xs[i - 1] - gamma * vs[i - 1] * f(a + i * h);
        vs.push(vs[i - 1] + tmp * h);
        xs.push(xs[i - 1] + vs[i] * h);
        ts.push(tmp + i * h);
    }

    let tttt = 0;
 
    return {
        xs: xs,
        vs: vs,
        ts: ts
    };
}

// a - начальное время
// b - конечное
// n - кол-во точек
// m - масса
// k - коэф-т упругости
// gamma - коэф-т трения
// v0 - начальная скорость
// x0 - начальное положение
// A - амплитуда внешней силы
// T - период действия внешней силы
// p - импульс
function solve(a, b, n, m, k, gamma, v0, x0, A, T, p) {
    let w0 = Math.sqrt(k / m);
    let f = function(t) { return A * (1 - Math.cos(2 * Math.PI * t / T)) / 2.0 + p; };
    return _solve(a, b, n, x0, v0, w0, gamma, f);
}

function getDataTable(vals, type) {
    let data = new google.visualization.DataTable();

    data.addColumn('number', 'X');

    if (type === 'coordX') {
        data.addColumn('number', 'Координата X');
    }
    else if (type === 'speed') {
         data.addColumn('number', 'Скорость');
    }
    else if (type === 'energy') {
        data.addColumn('number', 'Энергия');
    }

    for (let i = 0; i < vals.xs.length; i++) {
        if (type === 'coordX') {
            data.addRow([vals.ts[i], vals.xs[i]]);
        }
        else if (type === 'speed') {
             data.addRow([vals.ts[i], vals.vs[i]]);
        }
        else if (type === 'energy') {
            data.addRow([vals.ts[i], vals.es[i]]);
        }
    }

    let ttttt = 0;

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
            maxZoomIn: 10.0
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
    appendElement(table_head, 'th', 'Координата X', {});
    appendElement(table_head, 'th', 'Скорость', {});
    appendElement(table_head, 'th', 'Энергия', {});

    let table_body = document.getElementById('table-body');
    clearElement(table_body);

    for (let i = 0; i < vals.xs.length; i++) {
        let tr_el = document.createElement('tr');
        appendElement(tr_el, 'th', i, {});
        appendElement(tr_el, 'th', parseFloat(vals.ts[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.xs[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.vs[i]).toFixed(3), {});
        //appendElement(tr_el, 'th', parseFloat(vals.es[i]).toFixed(3), {});

        table_body.appendChild(tr_el);
    }
}

var n = 10;
var current_i = 0;

function start_animation() {
    var vals = getVals();

    var canv = document.getElementById('canvas');
    var ctx = canv.getContext('2d');

    var width = canv.width;
    var height = canv.height;

    ctx.clearRect(0,0,width,height);

    ctx.beginPath();
    ctx.moveTo(0, height - 30);
    ctx.lineTo(width, height - 30);
    ctx.stroke();

    if (current_i == vals.xs.length)
        current_i = 0;

    ctx.fillStyle="#FF0000";
    ctx.fillRect(vals.xs[current_i], height - 60, 50, 30);
    ctx.stroke();

    var h = vals.xs[current_i] / n;

    ctx.beginPath();
    ctx.moveTo(0, height - 45);
    var isTop = true;
    for (var i = 1; i <= n; i++) {
        if (isTop) {
            ctx.lineTo(i * h, height - 50);
            isTop = false;
        }
        else {
            ctx.lineTo(i * h, height - 40);
            isTop = true;
        }
        ctx.stroke();
    }

    current_i++;
    window.requestAnimationFrame(start_animation)
}

function getInputVals() {
    let startP = parseFloat(document.getElementById('startP').value); // начальное положение

    return {
        start_x: startP
    };
}

function getVals() {
    let mass = parseFloat(document.getElementById('mass').value); // масса
    let ko_u = parseFloat(document.getElementById('ko_u').value); // коэф упругости
    let ko_t = parseFloat(document.getElementById('ko_t').value); // коэф трения
    let startSpeed = parseFloat(document.getElementById('startSpeed').value); // начальная скор
    let startP = parseFloat(document.getElementById('startP').value); // начальное положение
    let avs = parseFloat(document.getElementById('avs').value); // амплитуда внешней силы
    let pd = parseFloat(document.getElementById('pd').value); // период действия внеш силы
    let imp = parseFloat(document.getElementById('imp').value); // импульс

    let vsCheck = document.getElementById('vsCheck').checked; // внеш сила

    let w0 = Math.sqrt(ko_u / mass);

    let gamma = ko_t;
    if (!vsCheck) {
        gamma = 0;
    }

    let x0 = startP;
    let v0 = startSpeed;

    // TODO
    let a = 0;
    let b = 100;
    let n = 100;

    return solve(a, b, n, mass, ko_u, gamma, v0, x0, avs, pd, imp);
}

var isRedrawChart = false;
var isRedrawGraph = false;
var typeChart = 'speedX';

document.getElementById('apply').onclick = function() {
    let typeChartEl = document.getElementById("typeChart");
    typeChart = typeChartEl.options[typeChartEl.selectedIndex].value;

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
