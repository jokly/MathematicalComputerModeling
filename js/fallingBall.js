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

function getDataTable(vals, type) {
    let data = new google.visualization.DataTable();

    data.addColumn('number', 'X');

    if (type === 'speed') {
        data.addColumn('number', 'Скорость'); 
        data.addColumn('number', 'Аналитическая скорость')
    }
    else if (type === 'coord') {
        data.addColumn('number', 'Координата');  
        data.addColumn('number', 'Аналитическая Координата')
    }
    else if (type === 'acc') {
        data.addColumn('number', 'Ускорение');
    }
    else if (type === 'all') {
        data.addColumn('number', 'Координата'); 
        data.addColumn('number', 'Скорость');  
        data.addColumn('number', 'Ускорение'); 
    }

    for (let i = 0; i < vals.xs.length; i++) {
        if (type === 'speed') {
            data.addRow([vals.xs[i], vals.dys[i], vals.an_solve.dys[i]]); 
        }
        else if (type === 'coord') {
            data.addRow([vals.xs[i], vals.ys[i], vals.an_solve.ys[i]]); 
        }
        else if (type === 'acc') {
            data.addRow([vals.xs[i], vals.as[i]])
        }
        else if (type === 'all') {
            data.addRow([vals.xs[i], vals.ys[i], vals.dys[i], vals.as[i]]);    
        }
    }

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

    let as = [];
    for (let i = 0; i < n; i++) {
        as.push((dys[i + 1] - dys[i]) / (e.xs[i + 1] - e.xs[i]))
    }

    return {xs: e.xs, ys: ys, dys: dys, as: as};
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

function an_solve(xs, height, velocity, mass, k1, k2, fg, d_env, v) {
    let isAr = document.getElementById("arPower").checked;
    let isLin = document.getElementById("disWater").checked;
    let isSq = document.getElementById("disGas").checked;

    let g = fg(0);
    let fy, fv;

    if (isAr && !isLin && !isSq) {
        g = fg(0) * (1 - d_env * v / mass);

        fy = function (t) {
            return height + velocity * t - (g / 2) * t * t;    
        };
        fv = function(t) {
             return velocity - g * t;
        };
    }
    else if (!isAr && isLin && !isSq) {
        let exp = function(t) {
            return Math.exp(-(k1 / mass) * t);
        }

        fy = function(t) {
            return -g * mass / k1 * t - (velocity + g * mass / k1) * (mass / k1) * (exp(t) - 1) + height;
        };
        fv = function(t) {
            return -g * mass / k1 + (velocity + g * mass / k1) * exp(t);
        };
    }
    else if (isAr && isLin && !isSq) {
        g = fg(0) * (1 - d_env * v / mass);

        let exp = function(t) {
            return Math.exp(-(k1 / mass) * t);
        };

        fy = function(t) {
            return -g * mass / k1 * t - (velocity + g * mass / k1) * (mass / k1) * (exp(t) - 1) + height;
        };
        fv = function(t) {
            return -g * mass / k1 + (velocity + g * mass / k1) * exp(t);
        };
    }
    else if (!isAr && !isLin && !isSq) {
        fy = function(t) {
            return height + velocity * t - (g / 2) * t * t;
        };
        fv = function(t) {
            return velocity - g * t;
        }
    }

    let ys = [], dys = [];

    for (let i = 0; i < xs.length; i++) {
        let h = fy(xs[i]);
        let v = fv(xs[i]);

        if (h <= 0) {
            h = 0;
            v = 0;
        }

        ys.push(h);
        dys.push(v);
    }

    return {ys: ys, dys: dys};
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

    let vals = _compute(startTime, finishTime - startTime, pointCount, height, startSpeed, fg, fa, fc1, fc2);
    vals.an_solve = an_solve(vals.xs, height, startSpeed, mass, k1, k2, fg, dens_env, v);
    console.log(vals)
    return vals;
}

window.onload = function () {
    document.getElementById('chart-card').style.display = 'none';
    document.getElementById('table-card').style.display = 'none';

    $('select').material_select();
};

var isRedrawChart = false;
var typeChart = 'speed';

document.getElementById("apply").onclick = function () {
    let vals = getVals();

    let typeChartEl = document.getElementById("typeChart");
    typeChart = typeChartEl.options[typeChartEl.selectedIndex].value;

    if (document.getElementById('radio_chart').checked) {
        isRedrawChart = true;
        document.getElementById('chart-card').style.display = 'block';
        document.getElementById('table-card').style.display = 'none';

        drawChart(vals, typeChart);
    }
    else if (document.getElementById('radio_table').checked){
        isRedrawChart = false;
        document.getElementById('chart-card').style.display = 'none';
        document.getElementById('table-card').style.display = 'block';

        fillTable(vals);
    }

    fillTable(vals)
};

document.getElementById('download_csv').onclick = function() {
    var csvFormattedDataTable = google.visualization.dataTableToCsv(getDataTable(getVals(), true, true));
    var encodedUri = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvFormattedDataTable);

    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "table.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.onresize = () => { if (isRedrawChart) { drawChart(getVals(), typeChart) } };