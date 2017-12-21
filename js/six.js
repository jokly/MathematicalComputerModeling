google.charts.load('current', {'packages':['corechart']});

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
        appendElement(tr_el, 'th', parseFloat(vals.es[i]).toFixed(3), {});

        table_body.appendChild(tr_el);
    }
}

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
    let gasPower = document.getElementById('gasPower').checked; // сила газа
    let waterPowerCheck = document.getElementById('waterPower').checked; // сила воды

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
