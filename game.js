// --- DOM Elements ---
const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const settingsDiv = document.getElementById('settings');
const winnerDiv = document.getElementById('winner');
const player1NameInput = document.getElementById('player1Name');
const player2NameInput = document.getElementById('player2Name');
const startBtn = document.getElementById('startBtn');

// --- Game Constants ---
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 16;
const WIN_SCORE = 5;

// --- Game State ---
let player1 = {
  x: 0,
  y: canvas.height / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  color: "#00eaff",
  score: 0,
  name: "Player 1",
};
let player2 = {
  x: canvas.width - PADDLE_WIDTH,
  y: canvas.height / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  color: "#fdc900",
  score: 0,
  name: "Player 2",
};
let ball = {
  x: canvas.width / 2 - BALL_SIZE / 2,
  y: canvas.height / 2 - BALL_SIZE / 2,
  size: BALL_SIZE,
  speed: 6,
  dx: 6,
  dy: 3,
  color: "#fff",
};
let isRunning = false;
let upPressed = false;
let downPressed = false;

// --- Storage Functions ---
function saveScores() {
  localStorage.setItem('pong-scores', JSON.stringify({
    player1: { name: player1.name, score: player1.score },
    player2: { name: player2.name, score: player2.score }
  }));
}

function loadScores() {
  let data = localStorage.getItem('pong-scores');
  if (data) {
    try {
      let obj = JSON.parse(data);
      if (obj.player1) {
        player1.name = obj.player1.name || "Player 1";
        player1.score = obj.player1.score || 0;
      }
      if (obj.player2) {
        player2.name = obj.player2.name || "Player 2";
        player2.score = obj.player2.score || 0;
      }
    } catch (e) {}
  }
  player1NameInput.value = player1.name;
  player2NameInput.value = player2.name;
}

// --- Drawing Functions ---
function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawBall(x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawNet() {
  ctx.strokeStyle = "#aaa";
  ctx.setLineDash([6, 12]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawScores() {
  ctx.fillStyle = '#fff';
  ctx.font = '32px Arial Black, Arial, sans-serif';
  ctx.textAlign = 'center';
  // Player names
  ctx.fillText(player1.name, canvas.width / 4, 40);
  ctx.fillText(player2.name, 3 * canvas.width / 4, 40);
  // Scores
  ctx.font = 'bold 44px Arial Black, Arial, sans-serif';
  ctx.fillText(player1.score, canvas.width / 4, 75);
  ctx.fillText(player2.score, 3 * canvas.width / 4, 75);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawNet();
  drawScores();
  drawRect(player1.x, player1.y, player1.width, player1.height, player1.color);
  drawRect(player2.x, player2.y, player2.width, player2.height, player2.color);
  drawBall(ball.x, ball.y, ball.size, ball.color);
}

// --- Player 1 Mouse Control ---
canvas.addEventListener('mousemove', function(evt) {
  if (!isRunning) return;
  const rect = canvas.getBoundingClientRect();
  let mouseY = evt.clientY - rect.top;
  player1.y = mouseY - player1.height / 2;
  if (player1.y < 0) player1.y = 0;
  if (player1.y + player1.height > canvas.height) player1.y = canvas.height - player1.height;
});

// --- Player 2 Keyboard Control (Arrow keys) ---
window.addEventListener('keydown', function(e) {
  if (!isRunning) return;
  if (e.key === 'ArrowUp') upPressed = true;
  if (e.key === 'ArrowDown') downPressed = true;
});
window.addEventListener('keyup', function(e) {
  if (e.key === 'ArrowUp') upPressed = false;
  if (e.key === 'ArrowDown') downPressed = false;
});

function movePlayer2() {
  if (upPressed) {
    player2.y -= 7;
  }
  if (downPressed) {
    player2.y += 7;
  }
  // Clamp
  if (player2.y < 0) player2.y = 0;
  if (player2.y + player2.height > canvas.height) player2.y = canvas.height - player2.height;
}

// --- Ball Movement and Collision ---
function resetBall(direction = 1) {
  ball.x = canvas.width / 2 - ball.size / 2;
  ball.y = canvas.height / 2 - ball.size / 2;
  // Alternate serve direction
  ball.dx = ball.speed * direction;
  ball.dy = (Math.random() - 0.5) * ball.speed;
}

function updateBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Top and bottom collision
  if (ball.y <= 0 || ball.y + ball.size >= canvas.height) {
    ball.dy = -ball.dy;
    if (ball.y <= 0) ball.y = 0;
    if (ball.y + ball.size >= canvas.height) ball.y = canvas.height - ball.size;
  }

  // Player 1 paddle
  if (
    ball.x <= player1.x + player1.width &&
    ball.y + ball.size >= player1.y &&
    ball.y <= player1.y + player1.height
  ) {
    ball.dx = Math.abs(ball.dx);
    let collidePoint = (ball.y + ball.size/2) - (player1.y + player1.height/2);
    collidePoint = collidePoint / (player1.height/2);
    let angleRad = collidePoint * (Math.PI/4);
    let speed = ball.speed;
    ball.dx = speed * Math.cos(angleRad);
    ball.dy = speed * Math.sin(angleRad);
  }

  // Player 2 paddle
  if (
    ball.x + ball.size >= player2.x &&
    ball.y + ball.size >= player2.y &&
    ball.y <= player2.y + player2.height
  ) {
    ball.dx = -Math.abs(ball.dx);
    let collidePoint = (ball.y + ball.size/2) - (player2.y + player2.height/2);
    collidePoint = collidePoint / (player2.height/2);
    let angleRad = collidePoint * (Math.PI/4);
    let speed = ball.speed;
    ball.dx = -speed * Math.cos(angleRad);
    ball.dy = speed * Math.sin(angleRad);
  }

  // Left or right wall
  if (ball.x < 0) {
    player2.score++;
    saveScores();
    if (player2.score >= WIN_SCORE) {
      endGame(player2.name);
      return;
    }
    resetBall(-1);
  }
  if (ball.x + ball.size > canvas.width) {
    player1.score++;
    saveScores();
    if (player1.score >= WIN_SCORE) {
      endGame(player1.name);
      return;
    }
    resetBall(1);
  }
}

// --- Game Loop ---
function gameLoop() {
  if (!isRunning) return;
  movePlayer2();
  updateBall();
  render();
  requestAnimationFrame(gameLoop);
}

// --- Game Control ---
function startGame() {
  player1.score = 0;
  player2.score = 0;
  player1.name = player1NameInput.value.trim() || "Player 1";
  player2.name = player2NameInput.value.trim() || "Player 2";
  saveScores();
  settingsDiv.style.display = 'none';
  winnerDiv.style.display = 'none';
  isRunning = true;
  resetBall(Math.random() > 0.5 ? 1 : -1);
  render();
  setTimeout(() => gameLoop(), 300);
}

function endGame(winnerName) {
  isRunning = false;
  winnerDiv.textContent = `${winnerName} wins! 🎉`;
  winnerDiv.style.display = 'inline-block';
  settingsDiv.style.display = '';
}

// --- Start Button ---
startBtn.onclick = startGame;

// --- Enter Key to Start ---
player1NameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
player2NameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });

// --- Initialize ---
function init() {
  loadScores();
  render();
  settingsDiv.style.display = '';
  winnerDiv.style.display = 'none';
  isRunning = false;
}
init();