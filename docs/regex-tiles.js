window.addEventListener('DOMContentLoaded', main);
const level = Number(window.localStorage.getItem('level') || 1)
const { tilesPerTick, tickTime, numberOfPreGameTicks, letters, colors } = getGameConfiguration();

const ENTER_KEY_CODE = 13;

function main() {
  document.body.style.setProperty('--tick-time', `${tickTime}s`);
  document.querySelector('.data__current-level').textContent = level;
  document.querySelector('.data__next-level').textContent = level + 1;
  Array.from(document.querySelectorAll('.play-next-level')).forEach(x => x.addEventListener('click', playNextLevel));
  Array.from(document.querySelectorAll('.play-first-level')).forEach(x => x.addEventListener('click', playFirstLevel));
  let interval = startGameLoop();
  for (let i = 0; i < numberOfPreGameTicks; i++) {
    onTick({ firstTick: true });
  }
  document.querySelector('.input input').addEventListener('keyup', event => {
    if (event.keyCode === ENTER_KEY_CODE) {
      clearInterval(interval);
      interval = startGameLoop();
      onTick();
    }
    onInputChange();
  });
}

function startGameLoop() {
  return setInterval(() => {
    onTick();
  }, tickTime * 1000);
}


function getMatchedTiles() {
  const columns = Array.from(document.querySelectorAll('.board__column'));
  const regex = parseRegex(document.querySelector('.input input').value);
  if (regex) {
    const bottomRow = columns.map(x => x.querySelector('.tile')?.textContent || ' ').join('');
    let matches = Array.from(bottomRow.matchAll(regex));
    const matchIndices = matches
      .map(x => x.toString().split('').map((_, i) => x.index + i))
      .flat();
    const matchedTiles = matchIndices
      .map(index => ({ column: columns[index], tile: columns[index].querySelector('.tile') }))
      .filter(x => !!x.tile);

    const matchedColors = Array.from(new Set(matchedTiles.map(x => x.tile.dataset.color)));
    return { matchedTiles, matchedColors };
  }
  return { matchedTiles: [], matchedColors: [] };
}

function onTick({ firstTick } = {}) {
  const columns = Array.from(document.querySelectorAll('.board__column'));

  const { matchedColors, matchedTiles } = getMatchedTiles();
  if (matchedColors.length === 1) {
    matchedTiles.forEach(({ column, tile }) => column.removeChild(tile));
    document.querySelector('.input input').value = '';
    onInputChange();
  }

  const gameOver = !firstTick && checkForEndGame();

  if (gameOver) {
    return;
  }
  const timerSlider = document.querySelector('.timer__slider');
  timerSlider.style.animation = 'none';
  timerSlider.offsetHeight;
  timerSlider.style.animation = null; 
  for (let i = 0; i < tilesPerTick; i++) {
    const column = pick(columns);
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.classList.add('tile--new');
    const color = pick(colors);
    tile.dataset.color = color.id;
    tile.style.setProperty('--color-foreground', color.foreground);
    tile.style.setProperty('--color-background', color.background);

    const letter = pick(letters);
    tile.textContent = letter;
    column.appendChild(tile);
    setTimeout(() => {
      tile.classList.remove('tile--new');
    }, 30);
  }
}

function onInputChange() {
  Array.from(document.querySelectorAll('.board__column')).forEach(column => column.classList.remove('board__column--selected'));
  document.querySelector('.game').classList.remove('game--too-many-colors');
  const { matchedTiles, matchedColors } = getMatchedTiles();
  if (matchedColors.length > 1) {
    document.querySelector('.game').classList.add('game--too-many-colors');
  }
  matchedTiles.forEach(({ tile, column }) => {
    column.classList.add('board__column--selected');
  });
}

function pick(list) {
  return list[Math.round(Math.random() * (list.length - 1))];
}

function parseRegex(text) {
  try {
    return new RegExp(text, 'g');
  } catch(ignored) {
    return false;
  }
}

function playNextLevel() {
  window.localStorage.setItem('level', level + 1);
  window.location.reload();
}

function playFirstLevel() {
  window.localStorage.removeItem('level');
  window.location.reload();
}

function checkForEndGame() {
  const gameIsWon = !document.querySelector('.tile');
  if (gameIsWon) {
    document.querySelector('.game').classList.add('game--win');
  }

  return gameIsWon;
}

function getGameConfiguration() {
  const COLOR_1 = { id: 1, foreground: '#FFFEF8', background: '#AF47D2' };
  const COLOR_2 = { id: 2, foreground: '#5D0E41', background: '#FF8F00' };
  const COLOR_3 = { id: 3, foreground: '#EAFAEA', background: '#780C28' };
  const colorsSplit25To75 = [COLOR_1, COLOR_1, COLOR_1, COLOR_2];
  const colorsSplit30To70 = [COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_2, COLOR_2, COLOR_2];
  const colorsSplit30To60To10 = [COLOR_3, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_2, COLOR_2, COLOR_2];
  const baseConfigLevels1To3 = {
    tilesPerTick: 2,
    tickTime: 20,
    numberOfPreGameTicks: 6
  }
  if (level === 1) {
    return { ...baseConfigLevels1To3, letters: 'A'.split(''), colors: [COLOR_1] };
  }
  if (level === 2) {
    return { ...baseConfigLevels1To3, letters: 'A1'.split(''), colors: colorsSplit25To75 };
  }
  if (level === 3) {
    return { ...baseConfigLevels1To3, letters: 'ABC123'.split(''), colors: colorsSplit25To75 };
  }
  const baseConfigLevels4To6 = {
    tilesPerTick: 3,
    tickTime: 18,
    numberOfPreGameTicks: 5,
    colors: colorsSplit25To75
  }
  if (level === 4) {
    return { ...baseConfigLevels4To6, letters: 'abcABC123'.split('') };
  }
  if (level === 5) {
    return { ...baseConfigLevels4To6, letters: [
      'abcABC123'.repeat(2),
      '_-,'
    ].join('').split('') };
  }
  const advancedLetters = [
    'abcABC123'.repeat(4),
    '-_,'.repeat(2),
    '+^$.'
  ].join('').split('');
  if (level === 6) {
    return { ...baseConfigLevels4To6, letters: advancedLetters };
  }
  const baseConfigLevels7AndUp = {
    tilesPerTick: 3,
    tickTime: Math.max(10, 23 - level),
    numberOfPreGameTicks: level,
    letters: advancedLetters,
  }
  if (level === 7 || level === 8) {
    return { ...baseConfigLevels7AndUp, colors: colorsSplit30To70 }
  }
  return { ...baseConfigLevels7AndUp, colors: colorsSplit30To60To10 }
}
