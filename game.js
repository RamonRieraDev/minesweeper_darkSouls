let board = [];
let gameConfig = {
    rows: 8,
    cols: 8,
    mines: 10
};
let firstClick = true;
let gameOver = false;
let timer = 0;
let timerInterval;
let clickCount = 0;
let flagsPlaced = 0;
let hintsRemaining = 2; // Número de comodines disponibles
let testMode = false; // Variable para el modo de pruebas

// Establece la dificultad del juego
function setDifficulty(level) {
    switch(level) {
        case 'easy':
            gameConfig = { rows: 8, cols: 8, mines: 10 };
            break;
        case 'medium':
            gameConfig = { rows: 12, cols: 12, mines: 20 };
            break;
        case 'hard':
            gameConfig = { rows: 16, cols: 16, mines: 40 };
            break;
    }
    startNewGame();
}

// Inicia una nueva partida, reiniciando todas las variables
function startNewGame() {
    board = [];
    firstClick = true;
    gameOver = false;
    flagsPlaced = 0;
    clickCount = 0;
    hintsRemaining = 2; // Reinicia los comodines
    clearInterval(timerInterval);
    timer = 0;
    document.getElementById('timer').textContent = 'Tiempo: 0s';
    document.getElementById('clicks').textContent = 'Clicks: 0';
    document.getElementById('flags').textContent = `Banderas: ${flagsPlaced}/${gameConfig.mines}`;
    document.getElementById('hints').textContent = `Comodines: ${hintsRemaining}`;
    document.getElementById('modal').style.display = 'none';
    createBoard();
    renderBoard();
}

// Crea el tablero inicial vacío
function createBoard() {
    for (let i = 0; i < gameConfig.rows; i++) {
        board[i] = [];
        for (let j = 0; j < gameConfig.cols; j++) {
            board[i][j] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
        }
    }
}

// Coloca las minas aleatoriamente, evitando el primer click
function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;
    while (minesPlaced < gameConfig.mines) {
        const row = Math.floor(Math.random() * gameConfig.rows);
        const col = Math.floor(Math.random() * gameConfig.cols);
        
        if (!board[row][col].isMine && 
            (Math.abs(row - firstRow) > 1 || Math.abs(col - firstCol) > 1)) {
            board[row][col].isMine = true;
            minesPlaced++;
        }
    }
    calculateNeighborMines();
}

// Calcula el número de minas adyacentes para cada celda
function calculateNeighborMines() {
    for (let row = 0; row < gameConfig.rows; row++) {
        for (let col = 0; col < gameConfig.cols; col++) {
            if (!board[row][col].isMine) {
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (row + i >= 0 && row + i < gameConfig.rows &&
                            col + j >= 0 && col + j < gameConfig.cols) {
                            if (board[row + i][col + j].isMine) count++;
                        }
                    }
                }
                board[row][col].neighborMines = count;
            }
        }
    }
}

// Renderiza el tablero en el DOM
function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.style.gridTemplateColumns = `repeat(${gameConfig.cols}, 40px)`;
    boardElement.innerHTML = '';

    for (let row = 0; row < gameConfig.rows; row++) {
        for (let col = 0; col < gameConfig.cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (board[row][col].isRevealed || (testMode && board[row][col].isMine)) {
                cell.classList.add('revealed');
                if (board[row][col].isMine) {
                    cell.classList.add('mine');
                    cell.textContent = '';
                } else if (board[row][col].neighborMines > 0) {
                    cell.textContent = board[row][col].neighborMines;
                }
            } else if (board[row][col].isFlagged) {
                cell.classList.add('flagged');
                cell.textContent = '';
            }

            cell.addEventListener('click', handleLeftClick);
            cell.addEventListener('contextmenu', handleRightClick);
            boardElement.appendChild(cell);
        }
    }
}

// Maneja el click izquierdo (revelar celda)
function handleLeftClick(event) {
    if (gameOver) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    if (board[row][col].isFlagged) return;
    
    clickCount++;
    document.getElementById('clicks').textContent = `Clicks: ${clickCount}`;

    if (firstClick) {
        firstClick = false;
        placeMines(row, col);
        startTimer();
    }

    if (board[row][col].isMine) {
        gameOver = true;
        revealAll();
        showModal('¡Perdiste!', `Duraste ${timer} segundos y usaste ${clickCount} clicks.`);
        return;
    }

    revealCell(row, col);
    checkWin();
}
