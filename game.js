// Variables globales
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
let hintsRemaining = 2;
let testMode = false;
let timeLimit = null;
let currentSize = 'small';
let currentMode = 'normal';

// Crear el tablero
function calculateMines(rows, cols, mode) {
    const totalCells = rows * cols;
    switch(mode) {
        case 'normal':
            return Math.floor(totalCells * 0.15);
        case 'prepare-to-cry':
            return Math.floor(totalCells * 0.5);
        case 'prepare-to-die':
            return totalCells - 2;
        default:
            return Math.floor(totalCells * 0.15);
    }
}

// Seleccionar tamaño
function setSize(size) {
    document.querySelectorAll('.size-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`button[onclick*="setSize('${size}')"]`).classList.add('active');
    currentSize = size;
    updateGameConfig();
}

// Seleccionar modo
function setMode(mode) {
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`button[onclick*="setMode('${mode}')"]`).classList.add('active');
    currentMode = mode;
    timeLimit = mode === 'timed' ? 60 : null;
    updateGameConfig();
}

// Actualizar configuración del juego
function updateGameConfig() {
    let rows, cols;
    switch(currentSize) {
        case 'small':
            rows = cols = 8;
            break;
        case 'medium':
            rows = cols = 12;
            break;
        case 'large':
            rows = cols = 16;
            break;
        default:
            rows = cols = 8;
    }
    
    gameConfig = {
        rows: rows,
        cols: cols,
        mines: calculateMines(rows, cols, currentMode)
    };
    
    startNewGame();
}

// Reiniciar el juego
function startNewGame() {
    board = [];
    firstClick = true;
    gameOver = false;
    flagsPlaced = 0;
    clickCount = 0;
    hintsRemaining = 2;
    clearInterval(timerInterval);
    timer = timeLimit || 0;
    document.getElementById('timer').textContent = timeLimit ? `Tiempo: ${timer}s` : 'Tiempo: 0s';
    document.getElementById('clicks').textContent = 'Clicks: 0';
    document.getElementById('flags').textContent = `Banderas: ${flagsPlaced}/${gameConfig.mines}`;
    document.getElementById('hints').textContent = `Comodines: ${hintsRemaining}`;
    document.getElementById('modal').style.display = 'none';
    // Ya no es necesario: document.getElementById('you-died').classList.remove('active');
    document.getElementById('board').classList.remove('fade-out');
    // Reiniciar la opacidad del video
    document.getElementById('background-video').style.opacity = "0.4";
    createBoard();
    renderBoard();
}



// Crear el tablero
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

// Colocar minas (después del primer clic)
function placeMines(firstRow, firstCol) {
    if (currentMode === 'prepare-to-die') {
        let secondSafeCell;
        do {
            secondSafeCell = {
                row: Math.floor(Math.random() * gameConfig.rows),
                col: Math.floor(Math.random() * gameConfig.cols)
            };
        } while (
            (secondSafeCell.row === firstRow && secondSafeCell.col === firstCol) ||
            (Math.abs(secondSafeCell.row - firstRow) <= 1 && Math.abs(secondSafeCell.col - firstCol) <= 1)
        );

        for (let row = 0; row < gameConfig.rows; row++) {
            for (let col = 0; col < gameConfig.cols; col++) {
                if ((row !== firstRow || col !== firstCol) && 
                    (row !== secondSafeCell.row || col !== secondSafeCell.col)) {
                    board[row][col].isMine = true;
                }
            }
        }
    } else {
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
    }
    calculateNeighborMines();
}

// Calcular las minas vecinas
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

// Renderizar el tablero
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

// Manejar el clic izquierdo (revelar celda)
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
        showDeathAnimation();
        return;
    }

    revealCell(row, col);
    checkWin();
}



// Revelar una celda
function revealCell(row, col) {
    if (row < 0 || row >= gameConfig.rows || col < 0 || col >= gameConfig.cols ||
        board[row][col].isRevealed || board[row][col].isFlagged) {
        return;
    }

    board[row][col].isRevealed = true;

    if (board[row][col].neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                revealCell(row + i, col + j);
            }
        }
    }
    renderBoard();
}

// Revelar todas las celdas 
function revealAll() {
    for (let row = 0; row < gameConfig.rows; row++) {
        for (let col = 0; col < gameConfig.cols; col++) {
            board[row][col].isRevealed = true;
        }
    }
    renderBoard();
}

// Comprobar si se ha ganado
function checkWin() {
    let unrevealedSafeCells = 0;
    let correctFlags = 0;

    for (let row = 0; row < gameConfig.rows; row++) {
        for (let col = 0; col < gameConfig.cols; col++) {
            if (!board[row][col].isRevealed && !board[row][col].isMine) {
                unrevealedSafeCells++;
            }
            if (board[row][col].isFlagged && board[row][col].isMine) {
                correctFlags++;
            }
        }
    }

    if ((unrevealedSafeCells === 0) || (correctFlags === gameConfig.mines && flagsPlaced === gameConfig.mines)) {
        gameOver = true;
        clearInterval(timerInterval);
        // Desvanecer el fondo del tablero
        document.getElementById('board').classList.add('fade-out');
        // Hacer que el video pase a opacidad 1
        document.getElementById('background-video').style.opacity = "1";
        startDiagonalFadeAnimation().then(() => {
            showBonfireLit();
        });
    }
}

// Animación de desvanecimiento diagonal de las celdas
async function startDiagonalFadeAnimation() {
    const cells = document.querySelectorAll('.cell');
    const rows = gameConfig.rows;
    const cols = gameConfig.cols;
    
    const cellsArray = Array.from(cells).map((cell, index) => ({
        element: cell,
        row: Math.floor(index / cols),
        col: index % cols
    }));

    const maxSum = (rows - 1) + (cols - 1);
    
    for (let sum = 0; sum <= maxSum; sum++) {
        const cellsInDiagonal = cellsArray.filter(cell => cell.row + cell.col === sum);
        
        await Promise.all(cellsInDiagonal.map(cell => {
            return new Promise(resolve => {
                cell.element.style.transition = 'all 0.3s ease-out';
                cell.element.style.transform = 'scale(0)';
                cell.element.style.opacity = '0';
                setTimeout(resolve, 100);
            });
        }));
    }

    return new Promise(resolve => setTimeout(resolve, 200));
}

// Animación de muerte al perder (YOU DIED)
function showDeathAnimation() {
    // Crear el elemento "you died" dinámicamente
    const youDied = document.createElement('div');
    youDied.className = 'you-died active'; // 'active' activa la animación
    const youDiedText = document.createElement('div');
    youDiedText.className = 'you-died-text';
    youDiedText.textContent = 'YOU DIED';
    youDied.appendChild(youDiedText);
    document.body.appendChild(youDied);
    
    setTimeout(() => {
        showModal('¡Perdiste!', `Te ha comido un mimic. Duraste ${timer} segundos y usaste ${clickCount} clicks.`);
        // Remover la clase 'active' para iniciar la transición de salida
        youDied.classList.remove('active');
        // Después de un tiempo, eliminar el elemento del DOM
        setTimeout(() => {
            youDied.remove();
        }, 1000); // Ajusta este tiempo según la duración de tu animación en CSS
    }, 4000);
}

// Función para mostrar la animación de BONFIRE LIT
function showBonfireLit() {
    const bonfireLit = document.createElement('div');
    bonfireLit.className = 'bonfire-lit';
    bonfireLit.innerHTML = `
        <div class="bonfire-lit-text">BONFIRE LIT</div>
        <div class="bonfire-flames"></div>
    `;
    document.body.appendChild(bonfireLit);

    setTimeout(() => {
        bonfireLit.remove();
        showModal('¡Victoria!', `Enhorabuena, has avivado la primera llama en ${timer} segundos y ${clickCount} clicks.`);
    }, 5000);
}

// Manejar el clic derecho (colocar banderas)
function handleRightClick(event) {
    event.preventDefault();
    if (gameOver || firstClick) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (!board[row][col].isRevealed) {
        if (!board[row][col].isFlagged && flagsPlaced < gameConfig.mines) {
            board[row][col].isFlagged = true;
            flagsPlaced++;
        } else if (board[row][col].isFlagged) {
            board[row][col].isFlagged = false;
            flagsPlaced--;
        }
        document.getElementById('flags').textContent = `Banderas: ${flagsPlaced}/${gameConfig.mines}`;
        renderBoard();
        checkWin();
    }
}


// Iniciar el temporizador
function startTimer() {
    timerInterval = setInterval(() => {
        if (timeLimit) {
            timer--;
            if (timer <= 0) {
                gameOver = true;
                revealAll();
                showDeathAnimation();
                return;
            }
        } else {
            timer++;
        }
        document.getElementById('timer').textContent = `Tiempo: ${timer}s`;
    }, 1000);
}

// Mostrar el modal 
function showModal(title, text) {
    clearInterval(timerInterval);
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    modal.style.display = 'flex';
}

// Usar un comodín
function useHint() {
    if (gameOver || firstClick || hintsRemaining <= 0) return;

    let mineFound = false;
    for (let row = 0; row < gameConfig.rows && !mineFound; row++) {
        for (let col = 0; col < gameConfig.cols && !mineFound; col++) {
            if (board[row][col].isMine && !board[row][col].isRevealed && !board[row][col].isFlagged) {
                board[row][col].isFlagged = true;
                flagsPlaced++;
                mineFound = true;
                hintsRemaining--;
                document.getElementById('hints').textContent = `Comodines: ${hintsRemaining}`;
                document.getElementById('flags').textContent = `Banderas: ${flagsPlaced}/${gameConfig.mines}`;
                renderBoard();
                checkWin();
            }
        }
    }
}

// Alternar el modo pruebas (mostrar todas las minas)
function toggleTestMode() {
    testMode = !testMode;
    document.getElementById('test-button').classList.toggle('active');
    renderBoard();
}

// Inicializar el juego después del reinicio
window.onload = () => {
    setSize('small');
    setMode('normal');
};
