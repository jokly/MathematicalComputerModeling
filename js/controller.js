import { analytical, euler, euler_up, euler_fixed, runge_kutta } from "./methods.js";

var env_temp, cooling_coef;

function f(t, T) {
    return -cooling_coef * (T - env_temp);
}

function genXS(a, b, n) {
    let h = (b - a) / n;
    let xs = [];

    for (let i = 0; i < n; i++) {
        xs.push(a + h * i);
    }

    return xs;
}

google.charts.load('current', {'packages':['corechart']});

var isRedrawChart = false;

document.getElementById('chart-card').style.display = 'none';
document.getElementById('table-card').style.display = 'none';

function getValues() {
    let temp_cof = parseInt(document.getElementById('temp_cof').value);

    let temp_air = parseInt(document.getElementById('temp_air').value);
    env_temp = temp_air;

    let r = parseFloat(document.getElementById('coef_r').value);
    cooling_coef = r;

    let interval = parseInt(document.getElementById('interval').value);
    let n = parseInt(document.getElementById('n_steps').value);

    return {temp_cof, temp_air, r, interval, n};
}

function getXYs() {
    let vals = getValues();

    let xs = genXS(0, vals.interval, vals.n);
    let yss = [];

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

function drawChart() {
    let xys = getXYs();
    let xs = xys.xs;
    let yss = xys.yss;

    let data = new google.visualization.DataTable();
    data.addColumn('number', 'X');
    for (let i = 0; i < yss.length; i++) {
        data.addColumn('number', yss[i].name);
    }

    for (let i = 0; i < xs.length; i++) {
        let str = 'data.addRow([xs[i]';
        for (let j = 0; j < yss.length; j++) {
            let val = yss[j].ys[i];
            str += ', ' + val;
        }
        str += ']);';
        eval(str);
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
        }
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

function fillTable() {
    let vals = getValues();
    let h = vals.interval / vals.n;
    let xys = getXYs();
    let xs = xys.xs;
    let yss = xys.yss;
    let analit = analytical(xs, vals.temp_cof, vals.temp_air, vals.r);

    let table_head = document.getElementById('table-head');
    let table_err_temp = document.getElementById('table-err_temp');

    clearElement(table_head);
    clearElement(table_err_temp);

    appendElement(table_head, 'th', 'Шаг', {rowSpan: '2'});

    appendElement(table_head, 'th', 'Время', {rowSpan: '2'});
   
    for (let method of yss) {
        appendElement(table_head, 'th', method.name, {colSpan: '2'});
        appendElement(table_err_temp, 'th', 'Температура', {});
        appendElement(table_err_temp, 'th', 'Ошибка', {});
    }

    let table_body = document.getElementById('table-body');
    clearElement(table_body);

    for (let i = 0; i < xs.length; i++) {
        let tr_el = document.createElement('tr');
        appendElement(tr_el, 'th', i, {});
        appendElement(tr_el, 'th', i * h, {});

        for (let j = 0; j < yss.length; j++) {
            appendElement(tr_el, 'th', yss[j].ys[i].toFixed(3), {});
            appendElement(tr_el, 'th', Math.abs(yss[j].ys[i] - analit.ys[i]).toFixed(3), {});
        }

        table_body.appendChild(tr_el);
    }
}

document.getElementById('apply').onclick = () => {
    let isChart = document.getElementById('radio_chart').checked;

    if (isChart) {
        isRedrawChart = true;
        document.getElementById('chart-card').style.display = 'block';
        document.getElementById('table-card').style.display = 'none';

        drawChart();
    } 
    else {
        isRedrawChart = false;    
        document.getElementById('chart-card').style.display = 'none';
        document.getElementById('table-card').style.display = 'block';

        fillTable();
    }  
};

window.onresize = () => { if (isRedrawChart) { drawChart() } };
