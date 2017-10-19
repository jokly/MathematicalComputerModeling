window.onload  =
    function () {
    document.getElementById("apply").onclick = function () {
        alert("kek");
        if(document.getElementById("arPower").value == "") {
            alert("В архимеде ничего нет")
        }
    };

        let height = document.getElementById("height").value;
        let startSpeed = document.getElementById("startSpeed").value;
        let startTime = document.getElementById("startTime").value;
        let finishTime = document.getElementById("finishTime").value;
        let timeStepsCount = document.getElementById("timeStepsCount").value;
        let step = document.getElementById("step").value;
};
