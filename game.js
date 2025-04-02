let startTime;
let gameStarted = false;
let interval;
let alias = "";
let gameOver = false;

const correctNumber1 = "8007096";
const correctNumber2 = "+50321130281";
const API_URL = "https://script.google.com/macros/s/AKfycbwRN61r5W-9HEmGh2cZzXRtxoh0Z4sXmsF4MPX9DoxOdh0pyiOTRDD_MFi-C6CcOhpt/exec";

function startGame() {
    alias = document.getElementById("alias-input").value;
    if (!alias) {
        alert("Ingresa un nombre para jugar ✨");
        return;
    }

    gameStarted = true;
    gameOver = false;
    document.getElementById("message").textContent = "";
    document.getElementById("phone-number").value = "";
    document.getElementById("phone-number").disabled = false;
    document.getElementById("retry-area").style.display = "none";
    document.getElementById("time").textContent = "Tiempo: 0s";

    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("end-screen").style.display = "none";

    startTime = Date.now();
    interval = setInterval(updateTime, 1000);
}

function updateTime() {
    if (!gameStarted) return;
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("time").textContent = `Tiempo: ${elapsedTime}s`;
}

function checkCharacter() {
    if (!gameStarted || gameOver) return;

    const input = document.getElementById("phone-number").value;
    const message = document.getElementById("message");

    if (input === correctNumber1 || input === correctNumber2) {
        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);
        message.textContent = `¡Correcto! Lo lograste en ${timeTaken} segundos.`;

        saveScore(alias, timeTaken);
        fetchTopTen();
        gameStarted = false;
        clearInterval(interval);

        document.getElementById("game-screen").style.display = "none";
        document.getElementById("end-screen").style.display = "block";
    } else {
        const currentChar = input.charAt(input.length - 1);
        const correctChar = (correctNumber1 + correctNumber2)[input.length - 1];

        if (currentChar === correctChar) {
            message.textContent = "Vas bien!";
            message.className = "correct";
        } else {
            message.textContent = "Te equivocaste, el juego ha terminado.";
            message.className = "incorrect";
            endGame();
        }
    }
}

function endGame() {
    gameOver = true;
    clearInterval(interval);
    document.getElementById("phone-number").disabled = true;
    document.getElementById("retry-area").style.display = "block";
}

function saveScore(alias, time) {
    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ alias: alias, time: time }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.text())
    .then(data => console.log("Guardado:", data))
    .catch(error => console.error("Error al guardar:", error));
}

function fetchTopTen() {
    fetch(API_URL)
    .then(response => response.json())
    .then(data => {
        let topTenList = document.getElementById("top-ten");
        topTenList.innerHTML = "";

        data.sort((a, b) => a.time - b.time);
        data.slice(0, 10).forEach((entry, index) => {
            let li = document.createElement("li");
            li.textContent = `${index + 1}. [${new Date(entry.date).toLocaleDateString()}] ${entry.alias} – ${entry.time}s`;
            topTenList.appendChild(li);
        });
    })
    .catch(error => console.error("Error al obtener Top 10:", error));
}

function startNewGame() {
    gameStarted = false;
    gameOver = false;
    clearInterval(interval);

    document.getElementById("phone-number").value = "";
    document.getElementById("phone-number").disabled = false;
    document.getElementById("message").textContent = "";
    document.getElementById("retry-area").style.display = "none";

    document.getElementById("start-screen").style.display = "block";
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("end-screen").style.display = "none";

    document.getElementById("alias-input").value = "";

    fetchTopTen();
}

// Cargar el Top 10 al iniciar
document.addEventListener("DOMContentLoaded", fetchTopTen);
