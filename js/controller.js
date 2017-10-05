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

    isRedrawChart = true;
}

document.getElementById('apply').onclick = () => {
    let isChart = document.getElementById('radio_chart').checked;

    if (isChart) {
        drawChart();
    } 
    else {
        alert('TODO');
    }  
};

window.onresize = () => { if (isRedrawChart) { drawChart() } };
