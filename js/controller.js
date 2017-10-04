import { euler, euler_up, euler_fixed, runge_kutta } from "./methods.js";

function f(x, y) {
    return x * x / 10;
}

function genXS(a, b, n) {
    let h = (b - a) / (n - 1);
    let xs = [];

    for (let i = 0; i < n; i++) {
        xs.push(a + h * i);
    }

    return xs;
}

google.charts.load('current', {'packages':['corechart']});
var isRedrawChart = false;

function drawChart() {
    var data = google.visualization.arrayToDataTable([
      ['X', 'Эйлера', 'Модифицированный Эйлера', 'Рунге-Кутты 4-го порядка'],
      [0, 0, 1.5, -1.5],
      [5, 20, 21.5, 18.5],
      [10, 10, 11.5, 8.5],
      [20, 0, 1.5, -1.5]
    ]);

    var options = {
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

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
    chart.draw(data, options);

    isRedrawChart = true;
}

document.getElementById('apply').onclick = () => {
    drawChart();   
};

window.onresize = () => { if (isRedrawChart) { drawChart() } };
