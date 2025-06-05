// Meter code
const meterCanvas = document.getElementById('meterCanvas');
const meterCtx = meterCanvas.getContext('2d');

function drawMeter(mercuryPercent = 0, mercuryWidth = 4, color = '#e63946') {
  meterCtx.clearRect(0, 0, meterCanvas.width, meterCanvas.height);

  const centerX = meterCanvas.width / 2;
  const barTopY = 100;
  const barHeight = 350;

  // Draw base
  meterCtx.fillStyle = '#333';
  meterCtx.fillRect(centerX - 40, 450, 80, 30);

  // Draw yellow bar
  meterCtx.fillStyle = '#f4b731';
  meterCtx.fillRect(centerX - 40, barTopY, 80, barHeight);

  // Central thin pipe for mercury to expand
  meterCtx.fillStyle = '#222';
  meterCtx.fillRect(centerX - 2, barTopY, 4, barHeight);

  // Top black circle
  meterCtx.beginPath();
  meterCtx.arc(centerX, barTopY, 50, 0, 2 * Math.PI);
  meterCtx.fillStyle = '#222';
  meterCtx.fill();

  // Green circle with 100
  meterCtx.beginPath();
  meterCtx.arc(centerX, barTopY, 25, 0, 2 * Math.PI);
  meterCtx.fillStyle = '#4bc0a7';
  meterCtx.fill();
  meterCtx.fillStyle = 'black';
  meterCtx.font = 'bold 16px Arial';
  meterCtx.textAlign = 'center';
  meterCtx.fillText('100', centerX, barTopY + 6);

  // Score labels (10 to 90) alternate inside bar
  meterCtx.fillStyle = '#804c00';
  meterCtx.font = 'bold 16px Arial';
  let toggleSide = false;
  for (let i = 10; i <= 90; i += 10) {
    const y = 450 - (i / 100 * barHeight);
    meterCtx.textAlign = toggleSide ? 'right' : 'left';
    const offset = toggleSide ? -10 : 10;
    meterCtx.fillText(i.toString(), centerX + offset, y + 5);
    toggleSide = !toggleSide;
  }

  // Mercury fill (animated)
  const mercuryHeight = barHeight * mercuryPercent;
  meterCtx.save();
  meterCtx.fillStyle = color;
  meterCtx.shadowColor = color;
  meterCtx.shadowBlur = 10;
  meterCtx.fillRect(centerX - mercuryWidth / 2, barTopY + barHeight - mercuryHeight, mercuryWidth, mercuryHeight);
  meterCtx.restore();
}

// Animate mercury rising and expanding
function animateMercury(targetPercent, color = '#e63946') {
  let currentPercent = 0;
  let currentWidth = 4;
  const maxWidth = 4;
  const growFrames = 15;
  const riseFrames = 30;
  let frame = 0;

  function animate() {
    frame++;
    // Expand width first
    if (frame <= growFrames) {
      currentWidth = 4 + (maxWidth - 4) * (frame / growFrames);
    } else {
      currentWidth = maxWidth;
    }
    // Then rise mercury
    if (frame <= riseFrames) {
      currentPercent = targetPercent * (frame / riseFrames);
    } else {
      currentPercent = targetPercent;
    }
    drawMeter(currentPercent, currentWidth, color);

    if (frame < Math.max(growFrames, riseFrames)) {
      requestAnimationFrame(animate);
    } else {
      drawMeter(targetPercent, maxWidth, color);
    }
  }
  animate();
}

// Initial draw
drawMeter(0, 4);

// Game code
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const restartBtn = document.getElementById('restartBtn');

// Two player elements
const playerInfo = document.getElementById('playerInfo');
const scoreP1 = document.getElementById('scoreP1');
const scoreP2 = document.getElementById('scoreP2');
const winnerDisplay = document.getElementById('winnerDisplay');

let angle = 0;
let direction = 1;
let swinging = true;
let animationId;
let speed = 4; // initial speed
let hammerAnim = false;
let hammerAngle = -45; // resting angle
let hammerAnimFrame = 0;

// Two player state
let currentPlayer = 1;
let scores = [0, 0]; // [player1, player2]
let gameState = 'playing'; // 'playing', 'waiting', 'done'

function setTheme() {
  if (currentPlayer === 1) {
    document.body.classList.add('red-theme');
    document.body.classList.remove('blue-theme');
  } else {
    document.body.classList.add('blue-theme');
    document.body.classList.remove('red-theme');
  }
}

function updatePlayerInfo() {
  playerInfo.textContent = `Player ${currentPlayer}'s Turn`;
  setTheme();
}

function updateScoreBoard() {
  scoreP1.textContent = `Player 1: ${scores[0]}`;
  scoreP2.textContent = `Player 2: ${scores[1]}`;
}

function declareWinner() {
  if (scores[0] > scores[1]) {
    winnerDisplay.textContent = "Player 1 Wins! 🏆";
  } else if (scores[1] > scores[0]) {
    winnerDisplay.textContent = "Player 2 Wins! 🏆";
  } else {
    winnerDisplay.textContent = "It's a Tie!";
  }
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Arc center at bottom middle
  const centerX = canvas.width / 2;
  const centerY = canvas.height - 10;
  const arcRadius = 90;

  // Draw arc background
  ctx.beginPath();
  ctx.arc(centerX, centerY, arcRadius, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw needle
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((-90 + angle) * Math.PI / 180);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -arcRadius);
  ctx.stroke();
  ctx.restore();

  // Draw needle tip
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((-90 + angle) * Math.PI / 180);
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(-5, -arcRadius + 10);
  ctx.lineTo(5, -arcRadius + 10);
  ctx.lineTo(0, -arcRadius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw angle readings (0 to 180 every 30 degrees)
  ctx.save();
  ctx.fillStyle = '#7f7f7f';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let a = 0; a <= 180; a += 30) {
    let rad = (Math.PI + (a * Math.PI / 180));
    let r = arcRadius - 20;
    let x = centerX + r * Math.cos(rad);
    let y = centerY + r * Math.sin(rad);
    ctx.fillText(a.toString(), x, y);
  }
  ctx.restore();

  // Draw hammer
  ctx.save();
  ctx.translate(centerX - 60, centerY - 80);
  let ha = hammerAnim ? hammerAngle : -45;
  ctx.rotate(ha * Math.PI / 180);
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(20, -10, 40, 8); // handle
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.roundRect(55, -20, 20, 28, 4); // head
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#000";
  ctx.stroke();
  ctx.restore();
}

function animate() {
  if (swinging) {
    angle += direction * speed;
    if (angle >= 180 || angle <= 0) {
      direction *= -1;
      angle = Math.max(0, Math.min(180, angle));
    }
    drawGame();
    animationId = requestAnimationFrame(animate);
  }
}

function variableSpeedLoop() {
  if (swinging) {
    speed = 4 + Math.abs(Math.cos((angle - 90) * Math.PI / 180)) * 8;
    requestAnimationFrame(variableSpeedLoop);
  }
}

function hammerAnimation() {
  hammerAnim = true;
  hammerAngle = -45;
  hammerAnimFrame = 0;
  function anim() {
    if (hammerAnimFrame < 7) {
      hammerAngle += 6; // swing down
      hammerAnimFrame++;
      drawGame();
      requestAnimationFrame(anim);
    } else {
      hammerAnim = false;
      drawGame();
    }
  }
  anim();
}

function stopNeedle() {
  if (!swinging || gameState !== 'playing') return;
  swinging = false;
  cancelAnimationFrame(animationId);
  hammerAnimation();
  let score = getScore(angle);
  scores[currentPlayer - 1] = score;
  updateScoreBoard();

  // Update meter mercury and color
  let mercuryColor = currentPlayer === 1 ? '#e63946' : '#2a6cf0';
  animateMercury(score / 100, mercuryColor);

  setTimeout(() => {
    scoreDisplay.textContent = `Player ${currentPlayer} Score: ${score}`;
    restartBtn.style.display = 'inline-block';
    gameState = 'waiting';
  }, 400);
}

function restartGame() {
  if (gameState === 'done') {
    // Reset for new match
    scores = [0, 0];
    currentPlayer = 1;
    winnerDisplay.textContent = '';
    updateScoreBoard();
  }
  angle = 0;
  direction = 1;
  swinging = true;
  scoreDisplay.textContent = '';
  restartBtn.style.display = 'none';
  hammerAnim = false;
  hammerAngle = -45;
  drawGame();
  let mercuryColor = currentPlayer === 1 ? '#e63946' : '#2a6cf0';
  drawMeter(0, 4, mercuryColor);
  updatePlayerInfo();
  animate();
  variableSpeedLoop();
  gameState = 'playing';
}

function nextPlayer() {
  if (currentPlayer === 1) {
    currentPlayer = 2;
    restartGame();
  } else {
    gameState = 'done';
    declareWinner();
    playerInfo.textContent = "Game Over";
    restartBtn.style.display = 'inline-block';
  }
}

function getScore(angle) {
  let diff = Math.abs(angle - 90);
  let score = Math.max(0, 100 - Math.round((diff / 90) * 100));
  return score;
}

// Event listeners for two-player flow
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (swinging && gameState === 'playing') {
      stopNeedle();
    } else if (gameState === 'waiting') {
      nextPlayer();
    } else if (gameState === 'done') {
      restartGame();
    }
  }
});
restartBtn.addEventListener('click', () => {
  if (gameState === 'waiting') {
    nextPlayer();
  } else {
    restartGame();
  }
});

// Initial draw and setup
drawGame();
restartGame();
updateScoreBoard();
updatePlayerInfo();
winnerDisplay.textContent = '';