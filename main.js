const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const $sprite = document.querySelector('#sprite');
const $bricks = document.querySelector('#bricks');

const sndBrick = document.querySelector('#snd-brick');
const sndPaddle = document.querySelector('#snd-paddle');
const sndLose = document.querySelector('#snd-lose');
const sndWin = document.querySelector('#snd-win');


canvas.width = 448;
canvas.height = 400;

// VARIABLES DEL JUEGO

// VARIABLES DE LA PELOTA
// Tamaño
const ballRadius = 3;

// posición
let x = canvas.width / 2;
let y = canvas.height - 30;

// velocidad
let dx = -3;
let dy = -3;

/* VARIABLES DE LA PALETA */
const PADDLE_SENSITIVITY = 6 // en cuanto mas alto sea el valor mas alto se mueve el paddle

// VARIABLES DE LA PALETA
const paddleHeight = 10;
const paddleWidth = 50;

let paddleX = (canvas.width - paddleWidth) / 2; 
let paddleY = canvas.height - paddleHeight - 10; 

let rightPressed = false;
let leftPressed = false;

//VARIABLE GANAR
let isWinner = false;

let winAlpha = 0;
let winDir = 1;

//VARIABLES DE LOS LADRILLOS 
const brickRowCount = 6;
const brickColumnCount = 13;
const brickWidth = 32;
const brickHeight = 16;
const brickPadding = 0;
const brickOffSetTop = 80;
const brickOffSetLeft = 16;
const bricks = [];

const BRICK_STATUS = {
  ACTIVE: 1,
  DESTROYED: 0
}

for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [] // inicializamos con un array vacio
  for (let r = 0; r < brickRowCount; r++) {
    // calculamos la posicion del ladrillo en la pantalla
    const brickX = c * (brickWidth + brickPadding) + brickOffSetLeft;
    const brickY = r * (brickHeight + brickPadding) + brickOffSetTop;
    //asignar un color aleatorio a cada ladrillo 
    const randomColor = Math.floor(Math.random() * 8);
    // Guardamos la informacion de cada ladrillo
    bricks[c][r] = {
      x: brickX,
      y: brickY,
      status: BRICK_STATUS.ACTIVE,
      color: randomColor
    }
  }
}

function drawBall() {
  ctx.beginPath(); // iniciar el trazado 
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.closePath(); // terminar el trazado
}

function drawPaddle() {
  ctx.drawImage(
    $sprite,// la imagen
    29,// clipX : coordenadas de recorte
    266,// clipY : coordenadas de recorte 
    paddleWidth, //ancho de la parte de la imagen a poner
    paddleHeight, //largo de la parte de la imagen a poner
    paddleX, //posicion X donde se pone el dibujo
    paddleY, //posicion Y donde se pone el dibujo
    paddleWidth, // ancho del dibujo
    paddleHeight, // alto del dibujo
  );
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const currentBrick = bricks[c][r];
      if (currentBrick.status === BRICK_STATUS.DESTROYED) continue;

      const clipX = currentBrick.color * 32;

      ctx.drawImage(
        $bricks,
        clipX,
        0,
        brickWidth,
        brickHeight,
        currentBrick.x,
        currentBrick.y,
        brickWidth,
        brickHeight
      );
    }
  }
}

function drawUI() {
  ctx.fillText(`FPS: ${framesPerSec}`, 5, 10);
}

// function drawScore() {}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const currentBrick = bricks[c][r];
      if (currentBrick.status === BRICK_STATUS.DESTROYED) continue;
      const isBallSameXAsBrick = x > currentBrick.x && x < currentBrick.x + brickWidth;
      const isBallSameYAsBrick = y > currentBrick.y && y < currentBrick.y + brickHeight;

      if (isBallSameXAsBrick && isBallSameYAsBrick) {
        dy = -dy;
        y += dy;
        currentBrick.status = BRICK_STATUS.DESTROYED;
        play(sndBrick);
      
        if (checkWin()) winGame();
      }
    }
  }
}

function ballMovement() {
  // rebotar la pelota en los laterales
  if (
    x + dx > canvas.width - ballRadius || // la pared derecha
    x + dx < ballRadius // la pared izquierda
  ) {
    dx = -dx;
  }

  // rebotar la pelota en la parte de arriba
  if (y + dy < ballRadius) {
    dy = -dy;
  }

  // la pelota toca el paddle
  const isBallSameXAsPaddle = x > paddleX && x < paddleX + paddleWidth;
  const isBallTouchingPaddle = y + dy > paddleY;

  if (isBallSameXAsPaddle && isBallTouchingPaddle) {
    const hitPoint = (x - paddleX) / paddleWidth;
    const angle = (hitPoint - 0.5) * Math.PI / 2;

    dx = Math.sin(angle) * 4;
    dy = -Math.cos(angle) * 4;

    play(sndPaddle);
  }
  
  // la pelota toca el suelo
  else if (y + dy > canvas.height - ballRadius) {
    play(sndLose);
    gameOver = true;
    console.log('Game Over');
    setTimeout(() => {
      document.location.reload();
    }, 3000);
  }

  // mover la pelota
  x += dx;
  y += dy;
}

function paddleMovement() {
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += PADDLE_SENSITIVITY; 
  } else if (leftPressed && paddleX > 0) {
    paddleX -= PADDLE_SENSITIVITY;
  }
}

function cleanCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function initEvents () {
  document.addEventListener('keydown', keyDownHandler);
  document.addEventListener('keyup', keyUpHandler);

  // ===== BOTONES MOBILE + DESKTOP =====
  const leftBtn = document.getElementById('left-btn');
  const rightBtn = document.getElementById('right-btn');

  function pressLeft() { leftPressed = true; }
  function releaseLeft() { leftPressed = false; }

  function pressRight() { rightPressed = true; }
  function releaseRight() { rightPressed = false; }

  // mouse
  leftBtn.addEventListener('mousedown', pressLeft);
  leftBtn.addEventListener('mouseup', releaseLeft);
  leftBtn.addEventListener('mouseleave', releaseLeft);

  rightBtn.addEventListener('mousedown', pressRight);
  rightBtn.addEventListener('mouseup', releaseRight);
  rightBtn.addEventListener('mouseleave', releaseRight);

  // touch
  leftBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    pressLeft();
  });

  leftBtn.addEventListener('touchend', releaseLeft);

  rightBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    pressRight();
  });

  rightBtn.addEventListener('touchend', releaseRight);

  // ===== TAP EN PANTALLA (MOBILE) =====
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const screenMiddle = window.innerWidth / 2;

    if (touchX < screenMiddle) {
      leftPressed = true;
      rightPressed = false;
    }

    if (touchX >= screenMiddle) {
      rightPressed = true;
      leftPressed = false
    }
  });

  canvas.addEventListener('touchmove', e => {
    const touchX = e.touches[0].clientX;
    const middle = window.innerWidth / 2;

    leftPressed = touchX < middle;
    rightPressed = touchX >= middle;
  });

  canvas.addEventListener('touchend', () => {
    leftPressed = false;
    rightPressed = false;
  });

  // ===== TECLADO =====
  function keyDownHandler (event) {
    const { key } = event;
    if (key === 'Right' || key === 'ArrowRight' || key.toLowerCase() === 'd') {
      rightPressed = true;
    } else if (key === 'Left' || key === 'ArrowLeft' || key.toLowerCase() === 'a') {
      leftPressed = true;
    }
  }

  function keyUpHandler (event) {
    const { key } = event;
    if (key === 'Right' || key === 'ArrowRight' || key.toLowerCase() === 'd') {
      rightPressed = false;
    } else if (key === 'Left' || key === 'ArrowLeft' || key.toLowerCase() === 'a') {
      leftPressed = false;
    }
  }
}

function play(sound) {
  sound.currentTime = 0;
  sound.play();
}

function checkWin() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === BRICK_STATUS.ACTIVE) {
        return false;
      }
    }
  }
  return true;
}

function winGame() {
  if (isWinner) return;
  isWinner = true;
  play(sndWin);
}

function drawWin() {
  winAlpha += 0.05 * winDir;
  if (winAlpha >= 1 || winAlpha <= 0) winDir *= -1;
  ctx.fillStyle = `rgba(255, 255, 0, ${winAlpha})`;
  ctx.font = '30px';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 YOU WIN 🎉', canvas.width / 2, canvas.height / 2);
}

// a que velocidad de fps queremos que renderice nuestro juego
const fps = 60;

let msPrev = window.performance.now();
let msFPSPrev = window.performance.now() + 1000;
const msPerFrame = 1000 / fps;
let frames = 0;
let framesPerSec = fps;

let gameOver = false;

function draw () {

  if (gameOver || isWinner) return;
    
  window.requestAnimationFrame(draw);

  const msNow = window.performance.now();
  const msPassed = msNow - msPrev;

  if (msPassed < msPerFrame) return;

  const excessTime = msPassed % msPerFrame;
  msPrev = msNow - excessTime;

  frames++;

  if (msFPSPrev < msNow) {
    msFPSPrev = window.performance.now() + 1000;
    framesPerSec = frames;
    frames = 0;
  }
  
  cleanCanvas();

  if (isWinner) {
    drawWin();
    return;
  }

  // DIBUJOS
  drawBall();
  drawPaddle();
  drawBricks();
  drawUI();

  // COLISIONES Y MOVIMIENTOS
  collisionDetection();
  ballMovement();
  paddleMovement();
}
 
draw();
initEvents();

