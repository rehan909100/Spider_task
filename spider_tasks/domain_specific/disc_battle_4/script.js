
    const ROWS = 6;
    const COLS = 7;
    let board = [];
    let moveHistory = []; // For undo
    let currentPlayer = 'red';
    let blockedCol = null;
    let gameOver = false;

    // timer addition
    let timer = null;
    let timeLeft = 15;
    const TIMER_DURATION = 15;
    const timerDiv = document.getElementById('timer');
// addition done

    const boardDiv = document.getElementById('board');
    const statusDiv = document.getElementById('status');
    const blockSelect = document.getElementById('blockColumn');

// sound constants
let soundEnabled = true;
const moveSound = document.getElementById('moveSound');
const winSound = document.getElementById('winSound');
const drawSound = document.getElementById('drawSound');
const errorSound = document.getElementById('errorSound');

document.getElementById('soundSwitch').onchange = function() {
  soundEnabled = this.checked;
  localStorage.setItem('soundEnabled', soundEnabled ? '1' : '0');
};
// Restore sound preference on load
if (localStorage.getItem('soundEnabled') === '0') {
  document.getElementById('soundSwitch').checked = false;
  soundEnabled = false;
}
function playSound(sound) {
  if (soundEnabled && sound) {
    sound.currentTime = 0;
    sound.play();
  }
}

// --- Leaderboard helpers ---
function getScore(color) {
  return parseInt(localStorage.getItem('lb_' + color)) || 0;
}
function setScore(color, val) {
  localStorage.setItem('lb_' + color, val);
}
function addScore(color) {
  setScore(color, getScore(color) + 1);
}
function updateLeaderboardDisplay() {
  document.getElementById('redScore').textContent = `Red: ${getScore('red')}`;
  document.getElementById('yellowScore').textContent = `Yellow: ${getScore('yellow')}`;
  document.getElementById('drawScore').textContent = `Draws: ${getScore('draw')}`;
}
function showLeaderboard() {
  updateLeaderboardDisplay();
  document.getElementById('leaderboard').style.display = 'block';
}
function hideLeaderboard() {
  document.getElementById('leaderboard').style.display = 'none';
}
// --- End leaderboard helpers ---

// timer function
function startTimer() {
  clearInterval(timer);
  timeLeft = TIMER_DURATION;
  updateTimerDisplay();
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timer);
      gameOver = true;
      const winner = currentPlayer === 'red' ? 'yellow' : 'red';
      statusDiv.textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins by timeout!`;
      timerDiv.textContent = '';
      addScore(winner);
      showLeaderboard();
    }
  }, 1000);
}



function updateTimerDisplay() {
  timerDiv.textContent = `Time left: ${timeLeft}s`;
}


function blockColumn() {
  blockedCol = parseInt(blockSelect.value);
  renderBoard();
  statusDiv.textContent = `${currentPlayer === 'red' ? 'Red' : 'Yellow'}'s turn. Click a column to drop a disc.`;

}



function createBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  boardDiv.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = document.createElement('div');
          cell.className = 'cell';
          cell.dataset.row = r;
          cell.dataset.col = c;
          boardDiv.appendChild(cell);
        }
      }
      renderBlockOptions();
      // startTimer();
    }

    function renderBoard() {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = boardDiv.children[r * COLS + c];
          cell.className = 'cell';
          if (board[r][c]) cell.classList.add(board[r][c]);
          if (c == blockedCol) cell.classList.add('blocked');
        }
      }
    }

    function renderBlockOptions() {
      blockSelect.innerHTML = '';
      for (let c = 0; c < COLS; c++) {
        const colFull = board[0][c] !== null;
        if (!colFull) {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = `Column ${c + 1}`;
          blockSelect.appendChild(opt);
        }
      }
    }


boardDiv.addEventListener('click', e => {
  if (gameOver) return;
  // Only allow clicks on actual cells
  if (!e.target.classList.contains('cell')) return;
  const col = parseInt(e.target.dataset.col);
  if (isNaN(col)) return; 
  if (col === blockedCol) 
    {
      playSound(errorSound);
      return alert("This column is blocked!");
    }

  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
        // Save move for undo
      moveHistory.push({
        board: board.map(row => row.slice()),
        currentPlayer,
        blockedCol,
        gameOver,
        timeLeft
      });
      playSound(moveSound);
      // End timer for the previous turn
            blockedCol = null;
      board[r][col] = currentPlayer;
      renderBoard();
      clearInterval(timer); // Stop timer for this turn

      if (checkWin(r, col)) {
        playSound(winSound);
        gameOver = true;
        statusDiv.textContent = `${currentPlayer === 'red' ? 'Red' : 'Yellow'} wins!`;
        // timerDiv.textContent = '';
        // Update leaderboard
        addScore(currentPlayer);
        showLeaderboard();
        return;
      }
      if (board.every(row => row.every(cell => cell))) {
        playSound(drawSound);
        statusDiv.textContent = "It's a draw!";
        // timerDiv.textContent = '';
        addScore('draw');
        showLeaderboard();
        return;
      }
      blockedCol = null;
      currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
      renderBlockOptions();
      startTimer(); // Start timer for the next player
      statusDiv.textContent = `${currentPlayer === 'red' ? 'Red' : 'Yellow'}'s turn. Select a column to block.`;
      // timerDiv.textContent = '';
      return;
    }
  }
  playSound(errorSound);
  alert("Column full!");
});




// Undo button logic
document.getElementById('undoBtn').onclick = function() {
  if (moveHistory.length === 0) return;
  const last = moveHistory.pop();
  board = last.board.map(row => row.slice());
  currentPlayer = last.currentPlayer;
  blockedCol = last.blockedCol;
  gameOver = last.gameOver;
  timeLeft = last.timeLeft;
  renderBoard();
  renderBlockOptions();
  updateTimerDisplay();
  statusDiv.textContent = `${currentPlayer === 'red' ? 'Red' : 'Yellow'}'s turn. Select a column to block.`;
  clearInterval(timer);
  if (!gameOver) startTimer();
};
// ...existing code...


document.getElementById('clearLeaderboardBtn').onclick = function() {
  setScore('red', 0);
  setScore('yellow', 0);
  setScore('draw', 0);
  updateLeaderboardDisplay();
  hideLeaderboard();
};



document.getElementById('showLeaderboardBtn').onclick = function() {
  const lb = document.getElementById('leaderboard');
  if (lb.style.display === 'block') {
    hideLeaderboard();
  } else {
    showLeaderboard();
  }
};


// Restart button logic
document.getElementById('restartBtn').onclick = function() {
  clearInterval(timer);
  moveHistory = [];
  currentPlayer = 'red';
  blockedCol = null;
  gameOver = false;
  createBoard();
  renderBoard();
  renderBlockOptions();
  statusDiv.textContent = "Red's turn. Select a column to block.";
  timerDiv.textContent = '';
  hideLeaderboard();
};




    function checkWin(r, c) {
      const color = board[r][c];
      const directions = [[0,1],[1,0],[1,1],[1,-1]];
      for (let [dr, dc] of directions) {
        let count = 1;
        for (let d = 1; d < 4; d++) {
          const nr = r + dr * d, nc = c + dc * d;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== color) break;
          count++;
        }
        for (let d = 1; d < 4; d++) {
          const nr = r - dr * d, nc = c - dc * d;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== color) break;
          count++;
        }
        if (count >= 4) return true;
      }
      return false;
    }

    createBoard();
    renderBoard();
    statusDiv.textContent = "Red's turn. Select a column to block.";
    timerDiv.textContent = '';

    // On page load, show leaderboard if any games played
updateLeaderboardDisplay();
hideLeaderboard();

//  Dark mode toggle functionality
document.getElementById('darkModeSwitch').onchange = function() {
  document.body.classList.toggle('dark-mode', this.checked);
  // Optionally, persist dark mode preference:
  localStorage.setItem('darkMode', this.checked ? '1' : '0');
};
// On page load, restore dark mode if set
if (localStorage.getItem('darkMode') === '1') {
  document.getElementById('darkModeSwitch').checked = true;
  document.body.classList.add('dark-mode');
}