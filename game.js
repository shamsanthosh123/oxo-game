// ─────────────────────────────────────────
//  OXO Game  –  Player vs Player  |  Player vs Computer (Minimax)
// ─────────────────────────────────────────

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],  // rows
  [0,3,6],[1,4,7],[2,5,8],  // cols
  [0,4,8],[2,4,6],           // diagonals
];

// ── State ────────────────────────────────
let board         = Array(9).fill(null);
let currentPlayer = 'X';  // X = human, O = computer (in PvC)
let gameActive    = true;
let mode          = 'pvp'; // 'pvp' | 'pvc'
let scores        = { X: 0, O: 0, Draw: 0 };
let isComputerTurn = false;

// ── DOM refs ─────────────────────────────
const cells          = document.querySelectorAll('.cell');
const statusEl       = document.getElementById('status');
const overlay        = document.getElementById('overlay');
const resultText     = document.getElementById('result-text');
const resultEmoji    = document.getElementById('result-emoji');
const scoreX         = document.getElementById('score-x');
const scoreO         = document.getElementById('score-o');
const scoreDraw      = document.getElementById('score-draw');
const labelX         = document.getElementById('label-x');
const labelO         = document.getElementById('label-o');
const restartBtn     = document.getElementById('restart-btn');
const resetScoresBtn = document.getElementById('reset-scores-btn');
const playAgainBtn   = document.getElementById('play-again-btn');
const difficultyRow  = document.getElementById('difficulty-row');
const difficultyEl   = document.getElementById('difficulty');
const btnPvP         = document.getElementById('btn-pvp');
const btnPvC         = document.getElementById('btn-pvc');

// ── Mode toggle ──────────────────────────
btnPvP.addEventListener('click', () => setMode('pvp'));
btnPvC.addEventListener('click', () => setMode('pvc'));

function setMode(newMode) {
  mode = newMode;
  btnPvP.classList.toggle('active', mode === 'pvp');
  btnPvC.classList.toggle('active', mode === 'pvc');
  difficultyRow.style.display = mode === 'pvc' ? 'flex' : 'none';
  labelX.textContent = mode === 'pvc' ? 'You (X)' : 'Player X';
  labelO.textContent = mode === 'pvc' ? 'Computer' : 'Player O';
  resetGame();
}

// ── Cell click ───────────────────────────
cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const idx = parseInt(cell.dataset.index);
    if (!gameActive || board[idx] || isComputerTurn) return;
    playMove(idx, currentPlayer);

    // After human moves in PvC, let computer play
    if (mode === 'pvc' && gameActive) {
      triggerComputerMove();
    }
  });
});

function playMove(idx, player) {
  board[idx] = player;
  cells[idx].textContent = player;
  cells[idx].classList.add('taken', player.toLowerCase());

  const winCombo = checkWin(board, player);
  if (winCombo) {
    highlightWinner(winCombo, player);
    scores[player]++;
    updateScoreboard();
    const label = mode === 'pvc'
      ? (player === 'X' ? '🎉 You Win!' : '🤖 Computer Wins!')
      : `Player ${player} Wins!`;
    const emoji = player === 'X' ? '🎉' : '🤖';
    setTimeout(() => showResult(label, emoji), 500);
    gameActive = false;
    return;
  }

  if (board.every(Boolean)) {
    scores.Draw++;
    updateScoreboard();
    setTimeout(() => showResult("It's a Draw!", '🤝'), 400);
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateStatus();
}

// ── Computer Move ────────────────────────
function triggerComputerMove() {
  isComputerTurn = true;
  statusEl.innerHTML = `Computer is thinking <span class="spinner"></span>`;

  const delay = 400 + Math.random() * 300;
  setTimeout(() => {
    if (!gameActive) { isComputerTurn = false; return; }
    const idx = getBestMove();
    isComputerTurn = false;
    playMove(idx, 'O');
  }, delay);
}

function getBestMove() {
  const difficulty = difficultyEl.value;

  if (difficulty === 'easy') {
    // Random empty cell
    const empty = board.map((v,i)=>v===null?i:null).filter(v=>v!==null);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === 'medium') {
    // 50% chance of best move, else random
    if (Math.random() < 0.5) return minimaxBest();
    const empty = board.map((v,i)=>v===null?i:null).filter(v=>v!==null);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Hard – full minimax (unbeatable)
  return minimaxBest();
}

function minimaxBest() {
  let bestScore = -Infinity;
  let bestIdx   = null;

  board.forEach((val, idx) => {
    if (val !== null) return;
    board[idx] = 'O';
    const score = minimax(board, 0, false, -Infinity, Infinity);
    board[idx] = null;
    if (score > bestScore) { bestScore = score; bestIdx = idx; }
  });

  return bestIdx;
}

// Minimax with Alpha-Beta pruning
function minimax(b, depth, isMaximising, alpha, beta) {
  if (checkWin(b, 'O')) return 10 - depth;
  if (checkWin(b, 'X')) return depth - 10;
  if (b.every(Boolean))  return 0;

  if (isMaximising) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] !== null) continue;
      b[i] = 'O';
      best = Math.max(best, minimax(b, depth+1, false, alpha, beta));
      b[i] = null;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] !== null) continue;
      b[i] = 'X';
      best = Math.min(best, minimax(b, depth+1, true, alpha, beta));
      b[i] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ── Win check ────────────────────────────
function checkWin(b, player) {
  return WINNING_COMBOS.find(combo => combo.every(i => b[i] === player)) || null;
}

function highlightWinner(combo, player) {
  combo.forEach(i => cells[i].classList.add('winner'));
  const label = mode === 'pvc'
    ? (player === 'X' ? 'You win! 🎉' : 'Computer wins! 🤖')
    : `Player ${player} wins! 🎉`;
  statusEl.textContent = label;
}

// ── Status text ──────────────────────────
function updateStatus() {
  if (mode === 'pvc') {
    statusEl.textContent = currentPlayer === 'X' ? 'Your turn (X)' : 'Computer thinking…';
  } else {
    statusEl.textContent = `Player ${currentPlayer}'s turn`;
  }
}

// ── Result overlay ───────────────────────
function showResult(text, emoji) {
  resultText.textContent  = text;
  resultEmoji.textContent = emoji;
  overlay.classList.add('show');
}

// ── Scoreboard ───────────────────────────
function updateScoreboard() {
  scoreX.textContent    = scores.X;
  scoreO.textContent    = scores.O;
  scoreDraw.textContent = scores.Draw;
}

// ── Reset board ──────────────────────────
function resetGame() {
  board          = Array(9).fill(null);
  currentPlayer  = 'X';
  gameActive     = true;
  isComputerTurn = false;
  overlay.classList.remove('show');

  cells.forEach(cell => {
    cell.textContent = '';
    cell.className   = 'cell';
  });

  updateStatus();
}

// ── Buttons ──────────────────────────────
restartBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);
resetScoresBtn.addEventListener('click', () => {
  scores = { X: 0, O: 0, Draw: 0 };
  updateScoreboard();
  resetGame();
});

// ── Init ─────────────────────────────────
updateStatus();
