let startTime;
let gameStarted = false;
let interval;
let alias = "";
let gameOver = false;
let mistakes = 0; // 👉 Nuevo: contador de errores
let lastTimeTaken = null;

const correctNumber1 = "8007096";
const correctNumber2 = "+50321130281";
const BIN_ID = "67f343158561e97a50fa0a04";
const API_KEY = "$2a$10$xmGRNNh1Jm3GiKe8TM/qruZdauws0JKajj/fbhm/jcEHQ8GQGau5q";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0; // rewind to start
        sound.play().catch((e) => {
            console.warn(`Could not play sound: ${id}`, e);
        });
    }
}

function startGame() {
    document.getElementById("time").style.display = "block";
    alias = document.getElementById("alias-input").value;
    if (!alias) {
        alert("Ingresa un nombre para jugar ✨");
        return;
    }

    const music = document.getElementById("background-music");
    music.volume = 0.3; // Podés ajustar volumen
    music.play().catch((e) => {
        console.warn("Autoplay bloqueado hasta que haya interacción del usuario", e);
    });

    gameStarted = true;
    gameOver = false;
    mistakes = 0; // 👉 Reinicia errores
    document.getElementById("message").textContent = "";
    document.getElementById("phone-number").value = "";
    document.getElementById("phone-number").disabled = false;
    document.getElementById("retry-area").style.display = "none";
    document.getElementById("time").textContent = "Tiempo: 0s";
    updateHearts(); // 👉 Muestra 3 corazones

    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("end-screen").style.display = "none";

    document.getElementById("game-character").src = "img/placeholder.gif";

    setTimeout(() => {
        document.getElementById("phone-number").focus();
    
        // 👉 Desplaza el contenido hacia arriba en móviles
        window.scrollTo(0, document.getElementById("game-screen").offsetTop);
    }, 100);

    startTime = Date.now();
    interval = setInterval(updateTime, 1000);

    attemptsLeft = 3;
    document.querySelector("#hearts img").src = "img/Hearts3.gif";
}

function updateHearts() {
    const heartsImg = document.querySelector("#hearts img");
    heartsImg.src = `img/Hearts${3 - mistakes}.gif`;
}

function updateTime() {
    if (!gameStarted) return;
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("time").textContent = `Tiempo: ${elapsedTime}s`;
}

let attemptsLeft = 3; // Número de vidas

function checkCharacter() {
    if (!gameStarted || gameOver) return;

    const inputEl = document.getElementById("phone-number");
    const input = inputEl.value;
    const message = document.getElementById("message");
    const messageVictory = document.getElementById("messageVictory");
    const fullCorrect = correctNumber1 + correctNumber2;

    // Validación completa
    if (input === correctNumber1 || input === correctNumber2) {
        playSound("sound-win"); // 🎉 play win sound
        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);
        messageVictory.textContent = "¡Correcto!";
        messageVictory.setAttribute("data-time", `Lo lograste en ${timeTaken} segundos.`);
    
        gameStarted = false;
        clearInterval(interval);
    
        showScreen("loading-screen"); // ✅ Mostrar loading inmediatamente
    
        // ✅ Guardar score y luego mostrar end-screen
        saveScore(alias, timeTaken).then(() => {
            showScreen("end-screen");
        });
    
        return;
    }

    const currentLength = input.length;
    const expectedChar = fullCorrect[currentLength - 1];
    const actualChar = input.charAt(currentLength - 1);

    if (actualChar === expectedChar) {
        playSound("sound-pop"); // 👈 Play pop sound
        animateCharacter("correct");
        message.textContent = "¡Vas bien!";
        message.className = "correct";
    } else {
        playSound("sound-error"); // 👉 play error sound
        animateCharacter("wrong");
        // ❌ Quitar el carácter incorrecto y reducir intentos
        inputEl.value = input.slice(0, -1);
        attemptsLeft--;

        if (navigator.vibrate) {
            navigator.vibrate(200); // vibra por 200 ms
        }
        
        message.textContent = attemptsLeft > 0 ? "Oops, te has equivocado..." : "Perdiste";
        message.className = "incorrect";

        updateHearts();

        if (attemptsLeft === 0) {
            gameOver = true;
            clearInterval(interval);
            document.getElementById("time").style.display = "none";

            if (navigator.vibrate) {
                navigator.vibrate([300, 100, 300, 100, 500]);
            }
        
            endGame(); // 👉 Mostramos mensaje y botón de reintentar
        
        }
    }
}



function endGame() {
    gameOver = true;
    clearInterval(interval);
    document.getElementById("phone-number").disabled = true;
    document.getElementById("retry-area").style.display = "block";

    // 👉 Muestra imagen de 0 corazones
    document.querySelector("#hearts img").src = "img/Hearts0.gif";

    playSound("sound-gameover"); // 🎵 game over
    const character = document.getElementById("game-character");
    character.src = "img/lose.gif";

    // 👉 Muestra mensaje de "Perdiste"
    const message = document.getElementById("message");
    message.textContent = "¡Perdiste! 😢";
    message.className = "game-over"; // 👉 Clase para poder personalizar estilo
}

async function saveScore(alias, time) {
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

        // Guardar el puntaje recién ingresado
        lastTimeTaken = time;

        data.record.scores.push({ alias, time, date: new Date().toISOString() });

        await fetch(API_URL, {
            method: "PUT",
            headers: {
                "X-Master-Key": API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data.record)
        });

        await fetchTopTen(); // ✅ Asegura que los datos estén actualizados

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
            li.textContent = `[${new Date(entry.date).toLocaleDateString()}] ${entry.alias} – ${entry.time}s`;

            // 🔥 Resalta el puntaje recién agregado
            if (entry.alias === alias && entry.time === lastTimeTaken) {
                li.classList.add("highlight-score");
            }

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


function updateHearts() {
    const heartImg = document.querySelector("#hearts img");

    if (attemptsLeft === 2) {
        heartImg.src = "img/Hearts2.gif";
    } else if (attemptsLeft === 1) {
        heartImg.src = "img/Hearts1.gif";
    } else if (attemptsLeft <= 0) {
        heartImg.src = "img/Hearts0.gif";
    }
}

function showScreen(screenId) {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("end-screen").style.display = "none";
    document.getElementById("loading-screen").style.display = "none";
    document.getElementById(screenId).style.display = "block";
  }
  
function showLoadingThen(screenIdToShow, delay = 0) {
  showScreen("loading-screen");  // Mostrar pantalla de carga
  setTimeout(() => {
    showScreen(screenIdToShow);  // Mostrar la pantalla final después del delay
  }, delay);  // Reduce el tiempo de espera aquí, por ejemplo 400ms
}

document.getElementById("alias-input").addEventListener("input", () => {
    playSound("sound-pop");
});

function animateCharacter(reaction) {
    const character = document.getElementById("game-character");
    const baseImage = "img/placeholder.gif";

    if (reaction === "correct") {
        character.src = "img/right.gif";
    } else if (reaction === "wrong") {
        character.src = "img/wrong.gif";
    }

    // Luego de un momento, volver a imagen base SOLO si no se ha perdido
    setTimeout(() => {
        if (!gameOver) {
            character.src = baseImage;
        }
    }, 300);
}

document.getElementById("alias-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        startGame();
    }
});