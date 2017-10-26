var env_temp, cooling_coef;

function analytical(xs, coffee_temp, env_temp, cooling_coef) {
    var c = coffee_temp - env_temp;
    var T  = function(t) { return c / Math.pow(Math.E, cooling_coef * t) + env_temp };

    var Ts = [];
    for (var i = 0; i < xs.length + 1; i++) {
        Ts.push(T(xs[i]));
    }

    return {name: 'Аналитическое решение', ys: Ts};
}

function euler(a, b, xs, y0, f) {
    var n = xs.length;
    var h = (b - a) / n;
    var e = function(y_prev, x_prev) { return y_prev + h * f(x_prev, y_prev) };

    var ys = [y0];
    for (var i = 1; i < n + 1; i++) {
        ys.push(e(ys[i - 1], xs[i - 1]));
    }

    return {name: 'Метод Эйлера', ys: ys};
}

function euler_up(a, b, xs, y0, f) {
    var n = xs.length;
    var h = (b - a) / n;
    var e = function(y_prev, x_prev, x, y_corrector) { return y_prev + h * (f(x_prev, y_prev) + f(x, y_corrector)) / 2 };

    var ys = euler(a, b, xs, y0, f).ys;
    var ys_up = [y0];

    for (var i = 1; i < n + 1; i++) {
        ys_up.push(e(ys_up[i - 1], xs[i - 1], xs[i], ys[i]));
    }

    return {name: 'Модифицированный метод Эйлера', ys: ys_up};
}

function euler_fixed(a, b, xs, y0, f) {
    var n = xs.length;
    var h = (b - a) / n;
    var k1 = function(x, y) { return h * f(x, y) };
    var k2 = function(x, y) { return h * f(x + h, y + k1(x, y)) };
    var e = function(x, y) { return y + (k1(x, y) + k2(x, y)) / 2 };

    var ys = [y0];
    for (var i = 1; i < n + 1; i++) {
        ys.push(e(xs[i - 1], ys[i - 1]));
    }

    return {name: 'Исправленный метод Эйлера', ys: ys};
}

function runge_kutta(a, b, xs, y0, f) {
    var n = xs.length;
    var h = (b - a) / n;
    var k1 = function(x, y) { return f(x, y) };
    var k2 = function(x, y) { return f(x + h / 2, y + h / 2 * k1(x, y)) };
    var k3 = function(x, y) { return f(x + h / 2, y + h / 2 * k2(x, y)) };
    var k4 = function(x, y) { return f(x + h, y + h * k3(x, y)) };
    var rk = function(x, y) { return y + h / 6 * (k1(x, y) + 2 * k2(x, y) + 2 * k3(x, y) + k4(x, y)) };

    var ys = [y0];
    for (var i = 1; i < n + 1; i++) {
        ys.push(rk(xs[i - 1], ys[i - 1]));
    }

    return {name: 'Метод Рунге-Кутта 4-ого порядка', ys: ys};
}


function f(t, T) {
    return -cooling_coef * (T - env_temp);
}

function genXS(a, b, n) {
    var h = (b - a) / n;
    var xs = [];

    for (var i = 0; i < n + 1; i++) {
        xs.push(a + h * i);
    }

    return xs;
}

google.charts.load('current', {'packages':['corechart']});

var isRedrawChart = false;

document.getElementById('chart-card').style.display = 'none';
document.getElementById('table-card').style.display = 'none';

function getValues() {
    var temp_cof = parseInt(document.getElementById('temp_cof').value);

    var temp_air = parseInt(document.getElementById('temp_air').value);
    env_temp = temp_air;

    var r = parseFloat(document.getElementById('coef_r').value);
    cooling_coef = r;

    var interval = parseInt(document.getElementById('interval').value);
    var n = parseInt(document.getElementById('n_steps').value);

    return {temp_cof, temp_air, r, interval, n};
}

function getXYs() {
    var vals = getValues();

    var xs = genXS(0, vals.interval, vals.n);
    var yss = [];

    if (document.getElementById('analit').checked) {
        yss.push(analytical(xs, vals.temp_cof, vals.temp_air, vals.r));
    }

    if (document.getElementById('euler').checked) {
        yss.push(euler(0, vals.interval, xs, vals.temp_cof, f));
    }

    if (document.getElementById('euler_up').checked) {
        yss.push(euler_up(0, vals.interval, xs, vals.temp_cof, f));
    }

    if (document.getElementById('euler_fixed').checked) {
        yss.push(euler_fixed(0, vals.interval, xs, vals.temp_cof, f));
    }

    if(document.getElementById('runge_kutta').checked) {
        yss.push(runge_kutta(0, vals.interval, xs, vals.temp_cof, f));
    }

    return { xs, yss }
}

function getDataTable(isErr = false) {
    var xys = getXYs();
    var xs = xys.xs;
    var yss = xys.yss;

    var analit;
    if (isErr) {
        var vals = getValues();
        analit = analytical(xs, vals.temp_cof, vals.temp_air, vals.r).ys;
    }

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'X');
    for (var i = 0; i < yss.length; i++) {
        data.addColumn('number', yss[i].name);
    }

    for (var i = 0; i < xs.length; i++) {
        var str = 'data.addRow([xs[i]';
        for (var j = 0; j < yss.length; j++) {
            var val = isErr ? Math.abs(yss[j].ys[i] - analit[i]) : yss[j].ys[i];
            str += ', ' + val;
        }
        str += ']);';
        eval(str);
    }

    return data;
}

function drawChart(isErr = false) {
    var data = getDataTable(isErr);

    var options = {
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

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
    chart.draw(data, options);
}

function clearElement(elem) {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
}

function appendElement(parent, child_type, text, options) {
    var elem = document.createElement(child_type);
    elem.textContent = text;

    for (var key of Object.keys(options)) {
        elem[key] = options[key];
    }

    parent.appendChild(elem);
}

function fillTable() {
    var vals = getValues();
    var h = vals.interval / vals.n;
    var xys = getXYs();
    var xs = xys.xs;
    var yss = xys.yss;
    var analit = analytical(xs, vals.temp_cof, vals.temp_air, vals.r);

    var table_head = document.getElementById('table-head');
    var table_err_temp = document.getElementById('table-err_temp');

    clearElement(table_head);
    clearElement(table_err_temp);

    appendElement(table_head, 'th', 'Шаг', {rowSpan: '2'});

    appendElement(table_head, 'th', 'Время', {rowSpan: '2'});

    for (var method of yss) {
        appendElement(table_head, 'th', method.name, {colSpan: '2'});
        appendElement(table_err_temp, 'th', 'Температура', {});
        appendElement(table_err_temp, 'th', 'Ошибка', {});
    }

    var table_body = document.getElementById('table-body');
    clearElement(table_body);

    for (var i = 0; i < xs.length; i++) {
        var tr_el = document.createElement('tr');
        appendElement(tr_el, 'th', i, {});
        appendElement(tr_el, 'th', (i * h).toFixed(3), {});

        for (var j = 0; j < yss.length; j++) {
            appendElement(tr_el, 'th', yss[j].ys[i].toFixed(3), {});
            appendElement(tr_el, 'th', Math.abs(yss[j].ys[i] - analit.ys[i]).toFixed(3), {});
        }

        table_body.appendChild(tr_el);
    }
}

document.getElementById('apply').onclick = function() {
    var isChart = document.getElementById('radio_chart').checked;

    if (document.getElementById('radio_chart').checked || document.getElementById('radio_chart_err').checked) {
        isRedrawChart = true;
        document.getElementById('chart-card').style.display = 'block';
        document.getElementById('table-card').style.display = 'none';

        drawChart(document.getElementById('radio_chart_err').checked);
    }
    else if (document.getElementById('radio_table').checked){
        isRedrawChart = false;
        document.getElementById('chart-card').style.display = 'none';
        document.getElementById('table-card').style.display = 'block';

        fillTable();
    }
};

document.getElementById('download_csv').onclick = function() {
    var csvFormattedDataTable = google.visualization.dataTableToCsv(getDataTable());
    var encodedUri = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvFormattedDataTable);

    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "table.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.onresize = function() { if (isRedrawChart) { drawChart(document.getElementById('radio_chart_err').checked) } };
