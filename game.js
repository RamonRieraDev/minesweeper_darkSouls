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