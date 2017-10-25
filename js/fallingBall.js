google.charts.load('current', {'packages':['corechart']});

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


function fillTable(data) {
    let vals = data;

    let table_head = document.getElementById('table-head');
    let table_err_temp = document.getElementById('table-err_temp');

    clearElement(table_head);

    appendElement(table_head, 'th', 'Шаг', {});
    appendElement(table_head, 'th', 'Время', {});
    appendElement(table_head, 'th', 'Высота', {});
    appendElement(table_head, 'th', 'Скорость', {});

    let table_body = document.getElementById('table-body');
    clearElement(table_body);

    for (let i = 0; i < vals.xs.length; i++) {
        let tr_el = document.createElement('tr');
        appendElement(tr_el, 'th', i, {});
        appendElement(tr_el, 'th', parseFloat(vals.xs[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.ys[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.dys[i]).toFixed(3), {});

        table_body.appendChild(tr_el);
    }
}

function drawChart(vals, isSpeed, isErr = false) {
    let data = new google.visualization.DataTable();

    data.addColumn('number', 'X');

    if (isSpeed) {
        data.addColumn('number', 'Скорость'); 
    }
    else {
        data.addColumn('number', 'Координата');  
    }

    for (let i = 0; i < vals.xs.length; i++) {
        if (isSpeed) {
            data.addRow([vals.xs[i], vals.dys[i]]); 
        }
        else {
            data.addRow([vals.xs[i], vals.ys[i]]); 
        }
    }

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

function euler(a, b, n, y0, dy0, f) {
    let h = (b - a) / (n - 1);

    let xs = [];
    for (let i = 0; i < n; i++) {
        xs.push(a + i * h);
    }

    let ys = [y0];
    let dys = [dy0];
    for (let i = 1; i < n; i++) {
        dys.push(dys[i - 1] + h * f(xs[i - 1], ys[i - 1], dys[i - 1]));
        ys.push(ys[i - 1] + h * dys[i - 1]);
    }

    return {xs: xs, ys: ys, dys: dys};
}

function euler_up(a, b, n, y0, dy0, f) {
    let h = (b - a) / (n - 1);
    let e = euler(a, b, n, y0, dy0, f);

    let ys = [y0];
    let dys = [dy0];
    for (let i = 1; i < n; i++) {
        let dy = e.dys[i - 1] + h * (f(e.xs[i - 1], ys[i - 1], dys[i - 1]) + f(e.xs[i - 1], e.ys[i - 1], e.dys[i - 1])) / 2.0;
        let y = e.ys[i - 1] + h * dys[i - 1];

        if (y <= 0) {
            y = 0;
            dy = 0;
        }

        dys.push(dy);
        ys.push(y);
    }

    return {xs: e.xs, ys: ys, dys: dys};
}

function _compute(start_time, time_span, n, height, velocity, fg, fa, fc1, fc2) {
    let f = function (x, y, dy) { return -fg(y) + fa(y) + fc1(dy) + fc2(dy); };
    return euler_up(start_time, time_span, n, height, velocity, f);
}

function compute(start_time, time_span, n, height, velocity, d_env, d, g, r, k1, k2) {
    let m = 4 / 3 * Math.PI * Math.pow(r, 3) * d;
    let fg = function (y) { return g(y); };
    let fa = function (y) { return d_env / d * g(y); };
    let fc2 = function (dy) { return k2() / m * Math.pow(dy, 2); };
    let fc1 = function (dy) { return k1() / m * dy; };
    return _compute(time_span, n, height, velocity, fg, fa, fc1, fc2);
}

function getVals() {
    let height = parseFloat(document.getElementById("height").value);
    let startSpeed = parseFloat(document.getElementById("startSpeed").value);
    let startTime = 0;
    let finishTime = parseFloat(document.getElementById("finishTime").value);
    let pointCount = parseFloat(document.getElementById("pointCount").value);
    let g = parseFloat(document.getElementById("gravity").value);
    let radius = parseFloat(document.getElementById("radius").value);
    let mass = parseFloat(document.getElementById("mass").value);
    let dens_env = parseFloat(document.getElementById("dens").value);
    let vias = parseFloat(document.getElementById("vias").value);

    let fa_checked = 0, fc1_checked = 0, fc2_checked = 0;

    if(document.getElementById("arPower").checked) {
        fa_checked = 1;
    }

    if(document.getElementById("disWater").checked) {
        fc1_checked = 1;
    }

    if(document.getElementById("disGas").checked) {
        fc2_checked = 1;
    }

    let v = 4 / 3 * Math.PI * Math.pow(radius, 3);
    let dens = v / mass;
    let k1 = dens / dens_env;
    let k2 = 2;

    let fg = function(y) { return g; };
    let fa = function(y) { return fa_checked * dens_env / dens * g; };
    let fc1 = function(dy) { return fc1_checked * k1 / mass * dy; };
    let fc2 = function(dy) { return fc2_checked * k2 / mass * Math.pow(dy, 2); };

    return _compute(startTime, finishTime - startTime, pointCount, height, startSpeed, fg, fa, fc1, fc2);
}

window.onload = function () {
    document.getElementById('chart-card').style.display = 'none';
    document.getElementById('table-card').style.display = 'none';

    $('select').material_select();
};

var isRedrawChart = false;
var isSpeed = false;

document.getElementById("apply").onclick = function () {
    let vals = getVals();

    let typeChart = document.getElementById("typeChart");
    isSpeed = typeChart.options[typeChart.selectedIndex].value;

    if (document.getElementById('radio_chart').checked) {
        isRedrawChart = true;
        document.getElementById('chart-card').style.display = 'block';
        document.getElementById('table-card').style.display = 'none';

        drawChart(vals, isSpeed);
    }
    else if (document.getElementById('radio_table').checked){
        isRedrawChart = false;
        document.getElementById('chart-card').style.display = 'none';
        document.getElementById('table-card').style.display = 'block';

        fillTable(vals);
    }

    fillTable(vals)
};

window.onresize = () => { if (isRedrawChart) { drawChart(getVals(), isSpeed) } };