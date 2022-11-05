const boardDifficulties = [
  { name: 'Easy', size: 9, numberOfBombs: 10 },
  { name: 'Medium', size: 16, numberOfBombs: 40 },
  { name: 'Hard', size: 30, numberOfBombs: 99 }
]

let currentCursor = 'cursor'
let flaggedCount = 0

const $ = (...args) => {
  const elements = document.querySelectorAll(...args)
  return elements.length === 1 ? elements[0] : elements
}

function generateRandomNumber(max) {
  return Math.floor(Math.random() * max)
}

function toggleCursor() {
  currentCursor = currentCursor === 'flag' ? 'cursor' : 'flag'
  $('.flag-cursor').classList.toggle('active')
}

function updateFlaggedCount(numberOfBombs) {
  // update ui
  $('.flagged-count').textContent = numberOfBombs - flaggedCount
}

function checkGameState() {
  const board = $('.board')
  const bombs = $('.bomb')
  const flaggedBombs = $('.bomb.flagged')
  const notRevealedCells = $('.cell:not(.clicked):not(.bomb)')

  // check if all bombs are flagged
  if (bombs.length === flaggedBombs.length && notRevealedCells.length === 0) {
    // show win message
    board.classList.add('game-won')
  }
}

function toggleFlag(e, maxFlagCount) {
  const cell = e.target
  // if cell is already clicked, do nothing
  if (cell.classList.contains('clicked')) {
    return
  }
  // you can unflag your flag even if you have reached the max flag count
  if (!cell.classList.contains('flagged') && flaggedCount >= maxFlagCount) {
    return
  }

  if (cell.classList.toggle('flagged')) {
    flaggedCount++
  } else {
    flaggedCount--
  }
  updateFlaggedCount(maxFlagCount)
}

function getAdjacentCells(row, col, size) {
  const cells = []
  for (let i = row - 1; i <= row + 1; i++) {
    for (let j = col - 1; j <= col + 1; j++) {
      if (i >= 0 && i < size && j >= 0 && j < size) {
        cells.push([i, j])
      }
    }
  }
  return cells
}

function placeBombs(size, numberOfBombs) {
  if (numberOfBombs > size * size) {
    throw new Error('Too many bombs')
  }
  const cells = new Set()
  while (cells.size < numberOfBombs) {
    const randomRow = generateRandomNumber(size)
    const randomColumn = generateRandomNumber(size)
    if (cells.has(`${randomRow},${randomColumn}`)) {
      continue
    }
    const adjacentCells = getAdjacentCells(randomRow, randomColumn, size)
    adjacentCells.forEach(([row, col]) => {
      // plus one to cell value to indicate that it is adjacent to a bomb
      const adjacentCell = $(`[data-row="${row}"][data-col="${col}"]`)
      adjacentCell.dataset.value =
        (parseInt(adjacentCell.dataset.value) || 0) + 1
    })

    const cell = $(`[data-row="${randomRow}"][data-col="${randomColumn}"]`)
    cell.dataset.type = 'bomb'
    cell.classList.add('bomb')
    cells.add(`${randomRow},${randomColumn}`)
  }
}

// Create a board of size x size
function createBoard(size, numberOfBombs) {
  const board = $('.board')
  board.classList.remove('game-over')

  $('.flagged-count').textContent = numberOfBombs
  $('.mine-count').textContent = numberOfBombs

  // empty the board
  board.innerHTML = ''

  // create a cell
  const cell = document.createElement('div')
  cell.className = 'cell'
  cell.style.width = `${100 / size}%`
  cell.dataset.value = '0'

  // add the cells to the board
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const cellClone = cell.cloneNode()
      cellClone.dataset.row = i
      cellClone.dataset.col = j
      cellClone.dataset.type = 'empty'

      cellClone.addEventListener('click', (e) => {
        if (currentCursor === 'flag') {
          toggleFlag(e, numberOfBombs)
          return
        }
        if (cellClone.classList.contains('flagged')) {
          return
        }
        const cell = e.target
        if (cell.dataset.type === 'bomb') {
          cell.classList.add('bombed')
          board.classList.add('game-over')
          playSound('./you-died.mp3')
          return
        }
        playSound('./click.mp3')
        cell.classList.add('clicked')
        checkGameState()
        if (cell.dataset.value === '0') {
          const row = parseInt(cell.dataset.row)
          const col = parseInt(cell.dataset.col)
          const adjacentCells = getAdjacentCells(row, col, size)
          adjacentCells.forEach(([row, col]) => {
            const adjacentCell = $(`[data-row="${row}"][data-col="${col}"]`)
            if (!adjacentCell.classList.contains('clicked')) {
              adjacentCell.click(e)
            }
          })
        }
      })

      //cellClone.innerHTML = i + ',' + j
      board.appendChild(cellClone)
    }
  }

  placeBombs(size, numberOfBombs)
}

function createButtons(boardDifficulties) {
  const buttons = $('.buttons')
  buttons.innerHTML = ''
  const button = document.createElement('button')
  button.className = 'button'
  boardDifficulties.forEach((difficulty) => {
    const buttonClone = button.cloneNode()
    buttonClone.innerHTML = difficulty.name
    buttonClone.addEventListener('click', () => {
      createBoard(difficulty.size, difficulty.numberOfBombs)
    })
    buttons.appendChild(buttonClone)
  })
}

let playing = false
function playSound(url) {
  if (playing) return
  playing = true

  const audioContext = new AudioContext()
  window
    .fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
    .then((audioBuffer) => {
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)

      source.addEventListener('ended', () => {
        playing = false
      })
      source.start()
    })
}

function main() {
  createButtons(boardDifficulties)
  createBoard(9, 10)
}

main()
