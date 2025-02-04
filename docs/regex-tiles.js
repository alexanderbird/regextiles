window.addEventListener('DOMContentLoaded', main);
const level = Number(window.localStorage.getItem('level') || 0)
const columnHeightForGameOver = 15;
const { tilesPerTick, tickTime, numberOfStartingTiles, letters, colors } = getGameConfiguration();

const ENTER_KEY_CODE = 13;

function main() {
  document.body.style.setProperty('--tick-time', `${tickTime}s`);
  document.querySelector('.data__current-level').textContent = level;
  document.querySelector('.data__next-level').textContent = level + 1;
  document.querySelector('body').classList.add(`level-${level}`);
  Array.from(document.querySelectorAll('.play-next-level')).forEach(x => x.addEventListener('click', playNextLevel));
  Array.from(document.querySelectorAll('.play-this-level-again')).forEach(x => x.addEventListener('click', () => window.location.reload()));
  Array.from(document.querySelectorAll('.play-first-level')).forEach(x => x.addEventListener('click', playFirstLevel));
  initializeUpNextSections();
  let interval = startGameLoop();
  addTiles(numberOfStartingTiles);
  document.querySelector('.input input').addEventListener('keyup', event => {
    if (event.keyCode === ENTER_KEY_CODE) {
      clearInterval(interval);
      interval = startGameLoop();
      const timerPercentage = getTimerPercentage();
      onTick({ timerPercentage });
    }
    onInputChange();
  });
}

function startGameLoop() {
  const interval = setInterval(() => {
    onTick({ timerPercentage: 100 });
    if (isGameOver()) {
      clearInterval(interval);
    }
  }, tickTime * 1000);
  return interval;
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

function onTick({ timerPercentage }) {
  const { matchedColors, matchedTiles } = getMatchedTiles();
  if (matchedColors.length === 1) {
    matchedTiles.forEach(({ column, tile }) => column.removeChild(tile));
    document.querySelector('.input input').value = '';
    onInputChange();
  }

  if (isGameOver()) {
    return;
  }

  resetAnimation(document.querySelector('.timer__slider'));
  Array.from(document.querySelectorAll('.up-next__group')).forEach(resetAnimation);
  const tilesToAdd = 
    tilesPerTick.p25
    + (timerPercentage >= 25 ? tilesPerTick.p50 : 0)
    + (timerPercentage >= 50 ? tilesPerTick.p75 : 0)
    + (timerPercentage >= 75 ? tilesPerTick.p100 : 0);
  addTiles(tilesToAdd);
  isGameOver();
}

function addTiles(count) {
  const columns = Array.from(document.querySelectorAll('.board__column'));
  for (let i = 0; i < count; i++) {
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

function isGameOver() {
  const gameElement = document.querySelector('.game');
  const gameIsWon = !document.querySelector('.board .tile');
  if (gameIsWon) {
    gameElement.classList.add('game--win');
    gameElement.classList.add('game--over');
    return true;
  }

  const gameIsLost = !!document.querySelector(`.board .board__column .tile:nth-child(${columnHeightForGameOver})`);
  if (gameIsLost) {
    gameElement.classList.add('game--lose');
    gameElement.classList.add('game--over');
    return true;
  }

  return false;
}

function isGameLost() {
}

function getGameConfiguration() {
  const COLOR_1 = { id: 1, background: '#1D2B53', foreground: '#FAEF5D' };
  const COLOR_2 = { id: 2, background: '#FF6500', foreground: '#173B45' };
  const COLOR_3 = { id: 3, background: '#EA047E', foreground: '#181C14' };
  const colorsSplit25To75 = [COLOR_1, COLOR_1, COLOR_1, COLOR_2];
  const colorsSplit30To70 = [COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_2, COLOR_2, COLOR_2];
  const colorsSplit30To60To10 = [COLOR_3, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_1, COLOR_2, COLOR_2, COLOR_2];
  const baseConfigLevels1To3 = {
    tickTime: 20,
    numberOfStartingTiles: 18,
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  }
  if (level === 0) {
    return { ...baseConfigLevels1To3, tilesPerTick: { p25: 1, p50: 1, p75: 0, p100: 0 }, colors: [COLOR_1] };
  }
  if (level === 1) {
    return { ...baseConfigLevels1To3, tilesPerTick: { p25: 1, p50: 1, p75: 0, p100: 0 }, colors: [COLOR_1, COLOR_2] };
  }
  if (level === 2) { 
    return { ...baseConfigLevels1To3, tilesPerTick: { p25: 2, p50: 0, p75: 1, p100: 0 }, colors: colorsSplit25To75 };
  }
  if (level === 3) {
    return { ...baseConfigLevels1To3, numberOfStartingTiles: 24, tilesPerTick: { p25: 2, p50: 0, p75: 1, p100: 0 }, colors: colorsSplit25To75 };
  }
  const baseConfigLevels4To6 = {
    tilesPerTick: { p25: 2, p50: 1, p75: 1, p100: 1 },
    tickTime: 18,
    numberOfStartingTiles: 30,
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
    '+^$.\\'
  ].join('').split('');
  if (level === 6) {
    return { ...baseConfigLevels4To6, letters: advancedLetters };
  }
  const baseConfigLevels7AndUp = {
    tilesPerTick: { p25: 2, p50: 2, p75: 1, p100: 1 },
    tickTime: Math.max(10, 23 - level),
    numberOfStartingTiles: 5 + (level * 3),
    letters: advancedLetters,
  }
  if (level === 7 || level === 8) {
    return { ...baseConfigLevels7AndUp, colors: colorsSplit30To70 }
  }
  return { ...baseConfigLevels7AndUp, colors: colorsSplit30To60To10 }
}

function getTimerPercentage() {
  const timer = document.querySelector('.timer').offsetWidth;
  const timerSlider = document.querySelector('.timer__slider').offsetWidth;
  return Math.round(100 * timerSlider / timer);
}

function resetAnimation(element) {
  element.style.animation = 'none';
  element.offsetHeight;
  element.style.animation = null; 
}

function initializeUpNextSections() {
  initializeUpNextSection('p25', tilesPerTick.p25);
  initializeUpNextSection('p50', tilesPerTick.p50);
  initializeUpNextSection('p75', tilesPerTick.p75);
  initializeUpNextSection('p100', tilesPerTick.p100);
}

function initializeUpNextSection(name, count) {
  const container = document.querySelector(`.up-next__group--${name}`);
  for (let i = 0; i < count; i++) {
    const shadow = document.createElement('div');
    shadow.classList.add('tile');
    shadow.classList.add('tile--shadow');
    container.appendChild(shadow);
  }
}
