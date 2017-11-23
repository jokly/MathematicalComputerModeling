google.charts.load('current', {'packages':['corechart']});

function getDataTable(vals, type) {
    let data = new google.visualization.DataTable();

    data.addColumn('number', 'X');

    if (type === 'flyTr') {
        data.addColumn('number', 'Траектория');
    }
    else if (type === 'speedX') {
         data.addColumn('number', 'Скорость по Х');
    }
    else if (type === 'speedY') {
        data.addColumn('number', 'Скорость по Y');
    }
    else if (type === 'coordX') {
        data.addColumn('number', 'Координата по Х');
    }
    else if (type === 'coordY') {
        data.addColumn('number', 'Координата по Y');
    }

    for (let i = 0; i < vals.xs.length; i++) {
        if (type === "flyTr") {
            data.addRow([vals.xs[i], vals.ys[i]]);
        }
        if (type === 'speedX') {
             data.addRow([vals.ts[i], vals.vxs[i]]);
        }
        else if (type === 'speedY') {
            data.addRow([vals.ts[i], vals.vys[i]]);
        }
        else if (type === 'coordX') {
            data.addRow([vals.ts[i], vals.xs[i]])
        }
        else if (type === 'coordY') {
            data.addRow([vals.ts[i], vals.ys[i]]);
        }
    }

    return data;
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
    appendElement(table_head, 'th', 'Координата Y', {});
    appendElement(table_head, 'th', 'Скорость X', {});
    appendElement(table_head, 'th', 'Скорость Y', {});

    let table_body = document.getElementById('table-body');
    clearElement(table_body);

    for (let i = 0; i < vals.xs.length; i++) {
        let tr_el = document.createElement('tr');
        appendElement(tr_el, 'th', i, {});
        appendElement(tr_el, 'th', parseFloat(vals.ts[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.xs[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.ys[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.vxs[i]).toFixed(3), {});
        appendElement(tr_el, 'th', parseFloat(vals.vys[i]).toFixed(3), {});

        table_body.appendChild(tr_el);
    }
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

function _solve(a, b, n, x0, y0, vx0, vy0, fx, fy) {
    let h = (b - a) / (n - 1);

    let vxs = [vx0];
    let vys = [vy0];
    let xs = [x0];
    let ys = [y0];
    let ts = [a];

    for (let i = 1; i < n; i++) {
        vxs.push(vxs[i - 1] + h * fx(xs[i - 1], ys[i - 1], vxs[i - 1], vys[i - 1], i * h));
        vys.push(vys[i - 1] + h * fy(xs[i - 1], ys[i - 1], vxs[i - 1], vys[i - 1], i * h));
        xs.push(xs[i - 1] + h * vxs[i]);
        ys.push(ys[i - 1] + h * vys[i]);

        ts.push(a + h * i);
    }

    for (let i = 1; i < xs.length; i++) {
        if (xs[i] < 0)
            xs = 0;
        if (ys[i] < 0)
            ys[i] = 0;
        if (ts[i] < 0)
            ts[i] = 0;
    }

    return {
        xs: xs,
        ys: ys,
        vxs: vxs,
        vys: vys,
        ts: ts
    };
}

function solve(t, y0, n, v0, alpha, r, d, d_env, wx, enable_fa, enable_fc1, enable_fc2) {
    alpha = Math.PI / 4;
    let x0 = 0;
    let vx0 = v0 * Math.cos(alpha);
    let vy0 = v0 * Math.sin(alpha);

    let v = 4 / 3 * Math.PI * Math.pow(r, 3);
    let m = v * d;

    let fg = function(y) { return 9.81; };
    let fm = function(y) { return -fg(y) * m; };
    let fa = function(y) { return (d_env * v / m) * fg(y) * enable_fa; };

    let k1 = 6 * Math.PI * 0.001 * r * d;
    let fc1 = function(v) { return (-k1 * v) * enable_fc1; };

    let k2 = 0.5 * 0.2 * 0.001 * Math.PI * Math.pow(r, 2);
    let fc2 = function(v) { return (-k2 * Math.abs(v) * v) * enable_fc2; };

    let fx = function(x, y, vx, vy, t) {
        return fc1(vx) + fc2(vx);
    };

    let fy = function(x, y, vx, vy, t) {
        return fm(y) + fa(y) + fc1(vy) + fc2(vy);
    };

    return _solve(0, t, n, x0, y0, vx0 - wx, vy0, fx, fy);
}

window.onload = function () {
    document.getElementById('chart-card').style.display = 'none';
    document.getElementById('table-card').style.display = 'none';

    $('select').material_select();
};

function getVals() {
    let height = parseFloat(document.getElementById("height").value);
    let startSpeed = parseFloat(document.getElementById("startSpeed").value);
    let angle = parseFloat(document.getElementById("angle").value);
    let startTime = 0;
    let finishTime = parseFloat(document.getElementById("finishTime").value);
    let pointCount = parseFloat(document.getElementById("pointCount").value);
    let g = parseFloat(document.getElementById("gravity").value);
    let radius = parseFloat(document.getElementById("radius").value);
    let mass = parseFloat(document.getElementById("mass").value);

    let dens_env = parseFloat(document.getElementById("dens").value); // плотность среды
    let dens_v = parseFloat(document.getElementById("dens_v").value); // вязкость среды
    let dens_speed = parseFloat(document.getElementById("dens_speed").value); // скорость среды

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

    let v = 4 / 3 * Math.PI * Math.pow(radius, 3); // объем шара
    let ballDens = mass / v; // плотность

    return solve(finishTime, height, pointCount, startSpeed, angle, radius, ballDens, dens_env, dens_speed, fa_checked, fc1_checked, fc2_checked);
}

var isRedrawChart = false;
var typeChart = 'flyTr';

document.getElementById("apply").onclick = function () {
    let typeChartEl = document.getElementById("typeChart");
    typeChart = typeChartEl.options[typeChartEl.selectedIndex].value;

    if (document.getElementById('radio_chart').checked) {
        isRedrawChart = true;
        document.getElementById('chart-card').style.display = 'block';
        document.getElementById('table-card').style.display = 'none';

        drawChart(getVals(), typeChart);
    }
    else if (document.getElementById('radio_table').checked){
        isRedrawChart = false;
        document.getElementById('chart-card').style.display = 'none';
        document.getElementById('table-card').style.display = 'block';

        fillTable(getVals());
    }
};

window.onresize = () => { if (isRedrawChart) { drawChart(getVals(), typeChart) } };