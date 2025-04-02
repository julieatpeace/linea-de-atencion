let startTime;
let gameStarted = false;
let interval;
let alias = "";
let gameOver = false;

const correctNumber1 = "8007096";
const correctNumber2 = "+50321130281";
const BIN_ID = "67ed9dfe8960c979a57d2ba4";
const API_KEY = "$2a$10$xmGRNNh1Jm3GiKe8TM/qruZdauws0JKajj/fbhm/jcEHQ8GQGau5q";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

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

async function saveScore(alias, time) {
    try {
        // Obtener los datos actuales
        let response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "X-Master-Key": API_KEY,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Error obteniendo datos");

        let data = await response.json();

        // Agregar nuevo puntaje
        data.record.scores.push({ alias, time, date: new Date().toISOString() });

        // Guardar de nuevo en JSONBin
        await fetch(API_URL, {
            method: "PUT",
            headers: {
                "X-Master-Key": API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data.record)
        });

        console.log("Puntaje guardado correctamente");

        // Mostrar el nuevo Top 10
        fetchTopTen();

    } catch (error) {
        console.error("Error al guardar:", error);
    }
}

async function fetchTopTen() {
    try {
        let response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "X-Master-Key": API_KEY,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Error obteniendo datos");

        let data = await response.json();

        // Ordenar por menor tiempo y obtener los 10 mejores
        let topTen = data.record.scores.sort((a, b) => a.time - b.time).slice(0, 10);

        let topTenList = document.getElementById("top-ten");
        topTenList.innerHTML = "";

        topTen.forEach((entry, index) => {
            let li = document.createElement("li");
            li.textContent = `${index + 1}. [${new Date(entry.date).toLocaleDateString()}] ${entry.alias} – ${entry.time}s`;
            topTenList.appendChild(li);
        });

    } catch (error) {
        console.error("Error al obtener Top 10:", error);
    }
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
