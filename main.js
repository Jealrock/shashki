let canvasSize = 800,
    boardSize = 8,
    w = canvasSize/boardSize,
    canvas, ctx;

let board = Array(boardSize).fill(Array(boardSize).fill(0)),
    turn = -1,
    attacks = [],
    lockSel = false,
    selCheck;

board = board.map((row, i) => {
  return row.map((cell, j) => {
    if (i > 2 && i < boardSize - 3) return 0;
    if ((i + j) % 2 != 0) return 0;

    return i > 2 ? 1 : -1;
  })
});

// board = [
//   [-1,  0, -1,  0, -1,  0, -1,  0],
//   [ 0, -1,  0, -1,  0, -1,  0, -1],
//   [-1,  0, -1,  0, -1,  0, -1,  0],
//   [ 0,  0,  0,  0,  0,  0,  0,  0],
//   [ 0,  0,  0,  0,  0,  0,  0,  0],
//   [ 0,  1,  0,  1,  0,  1,  0,  1],
//   [ 1,  0,  1,  0,  1,  0,  1,  0],
//   [ 0,  1,  0,  1,  0,  1,  0,  1]
// ]

function draw() {
  board.forEach((row, i) => {
    row.forEach((cell, j) => {
      ctx.fillStyle = ((i + j) % 2 == 0) ? '#693f24' : '#d1a73d';
      ctx.fillRect(w * j, w * i, w, w);
      if (cell == 0) return;

      ctx.beginPath();
      ctx.fillStyle = (cell % 2 === 1) ? 'black' : 'white';
      ctx.arc((w*j) + (w/2), (w*i) + (w/2), w/2 - 5, 0, (Math.PI/180)*360, false);
      ctx.fill();

      // kings
      if (cell % 3 === 0) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(150, 100, 200, 1)';
        ctx.arc((w*j) + (w/2), (w*i) + (w/2), w/4, 0, (Math.PI/180)*360, false);
        ctx.fill();
      }
    })
  })

  attacks.map(pos => highlightCell(pos.x, pos.y, '#d93425'));

  if (!board.reduce((acc, r) => [...acc, ...r]).find(cell => cell % 2 === turn)) {
    let text = [(turn === -1 ? 'BLACK' : 'WHITE'), 'WINS'].join(" ");
    ctx.fillStyle = "#d93425";
    ctx.font = '132px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline  = 'middle';
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.fillText(text, canvasSize / 2, canvasSize / 2);
    ctx.strokeText(text, canvasSize / 2, canvasSize / 2);
  }

  if (!selCheck) return;
  highlightCell(selCheck.x, selCheck.y, '#50e03d');
  movePositions(selCheck.x, selCheck.y).forEach(pos => highlightCell(pos.x, pos.y, '#cdd925'));
}

function highlightCell(x, y, color) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.strokeRect(w * x, w * y, w, w);
}

function attackPositionsFor(x, y) {
  return [
    { x: x - turn, y: y - turn },
    { x: x + turn, y: y - turn },
    ...(board[y][x] % 3 == 0 ? [{ x: x - turn, y: y + turn }, { x: x + turn, y: y + turn }] : [])
  ].filter(pos => board[pos.y] && board[pos.y][pos.x] % 2 === -turn)
   .reduce((acc, curr) => {
     let nx = curr.x + curr.x - x,
         ny = curr.y + curr.y - y;

     return board[ny] && board[ny][nx] === 0 ? [...acc, { x: nx, y: ny }] : acc
  }, []);
}

function attackPositions() {
  if (selCheck) return attackPositionsFor(selCheck.x, selCheck.y);

  return board.reduce((racc, rcurr, i) => {
    return [
      ...racc,
      ...rcurr.reduce((cacc, ccurr, j) => {
        return ccurr % 2 === turn ? [...cacc, ...attackPositionsFor(j, i)] : cacc;
      }, [])
    ]
  }, []);
}

function movePositions(x, y) {
  if (attacks.length > 0) return [];

  return [
    { x: x - turn, y: y - turn },
    { x: x + turn, y: y - turn },
    ...(board[y][x] % 3 == 0 ? [{ x: x - turn, y: y + turn }, { x: x + turn, y: y + turn }] : [])
  ].filter(pos => board[pos.y] && board[pos.y][pos.x] === 0)
}

function move(x, y) {
  board[y][x] = board[selCheck.y][selCheck.x];
  board[selCheck.y][selCheck.x] = 0;
  if (y === 0 || y === boardSize - 1) board[y][x] = board[y][x] * 3;
}

function nextTurn() {
  selCheck = null;
  turn = turn === 1 ? -1 : 1;
}

function attack(x, y) {
  let diffX = (x - selCheck.x) / 2,
      diffY = (y - selCheck.y) / 2;

  board[selCheck.y + diffY][selCheck.x + diffX] = 0;
  move(x, y);
}

function onClick(e) {
  let x = Math.ceil(e.offsetX / w) - 1,
      y = Math.ceil(e.offsetY / w) - 1;

  if (selCheck && attacks.find(pos => x === pos.x && y === pos.y)) {
    attack(x, y);
    lockSel = false;
    if (attackPositionsFor(x, y).length === 0) {
      nextTurn();
    } else {
      selCheck = { x, y };
      lockSel = true;
    }
  } else if (selCheck && movePositions(selCheck.x, selCheck.y).find(pos => x === pos.x && y === pos.y)) {
    move(x, y);
    nextTurn();
  } else if (!lockSel && board[y][x] % 2 == turn && (attacks.length == 0 || attackPositionsFor(x, y).length != 0)) {
    selCheck = { x, y };
  } else if (!lockSel) {
    selCheck = null;
  }

  attacks = attackPositions();
  draw();
}

window.onload = function() {
  canvas = document.getElementById('board');
  ctx = canvas.getContext('2d');

  attacks = attackPositions();
  draw();

  canvas.addEventListener('click', onClick);
}
