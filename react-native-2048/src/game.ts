export const GRID_SIZE = 4;
export const WIN_TILE = 2048;
export const BOARD_SIZE = GRID_SIZE;

export type Direction = "up" | "down" | "left" | "right";
export type Grid = number[][];
export type Board = Grid;

export type GameState = {
  board: Board;
  score: number;
  won: boolean;
  gameOver: boolean;
};

export type MoveResult = {
  grid: Grid;
  moved: boolean;
  scoreGained: number;
  hasWon: boolean;
};

const cloneGrid = (grid: Grid): Grid => grid.map((row) => [...row]);

const emptyGrid = (): Grid =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

const getEmptyCells = (grid: Grid): Array<[number, number]> => {
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] === 0) {
        cells.push([row, col]);
      }
    }
  }
  return cells;
};

const processLine = (line: number[]) => {
  const compact = line.filter((value) => value !== 0);
  const merged: number[] = [];
  let scoreGained = 0;
  let hasWon = false;

  for (let i = 0; i < compact.length; i += 1) {
    if (compact[i] === compact[i + 1]) {
      const combined = compact[i] * 2;
      merged.push(combined);
      scoreGained += combined;
      hasWon = hasWon || combined >= WIN_TILE;
      i += 1;
    } else {
      merged.push(compact[i]);
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.push(0);
  }

  const moved = merged.some((value, index) => value !== line[index]);

  return {
    line: merged,
    moved,
    scoreGained,
    hasWon,
  };
};

export const addRandomTile = (grid: Grid): Grid => {
  const nextGrid = cloneGrid(grid);
  const emptyCells = getEmptyCells(nextGrid);

  if (emptyCells.length === 0) {
    return nextGrid;
  }

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  nextGrid[row][col] = Math.random() < 0.9 ? 2 : 4;

  return nextGrid;
};

export const createInitialGrid = (): Grid => {
  let grid = emptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
};

export const moveGrid = (grid: Grid, direction: Direction): MoveResult => {
  const nextGrid = emptyGrid();
  let moved = false;
  let scoreGained = 0;
  let hasWon = false;

  if (direction === "left" || direction === "right") {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      const sourceLine =
        direction === "left" ? [...grid[row]] : [...grid[row]].reverse();
      const result = processLine(sourceLine);
      const finalLine =
        direction === "left" ? result.line : [...result.line].reverse();

      nextGrid[row] = finalLine;
      moved = moved || result.moved;
      scoreGained += result.scoreGained;
      hasWon = hasWon || result.hasWon;
    }
  } else {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const sourceLine = [];
      for (let row = 0; row < GRID_SIZE; row += 1) {
        sourceLine.push(grid[row][col]);
      }

      if (direction === "down") {
        sourceLine.reverse();
      }

      const result = processLine(sourceLine);
      const finalLine =
        direction === "up" ? result.line : [...result.line].reverse();

      for (let row = 0; row < GRID_SIZE; row += 1) {
        nextGrid[row][col] = finalLine[row];
      }

      moved = moved || result.moved;
      scoreGained += result.scoreGained;
      hasWon = hasWon || result.hasWon;
    }
  }

  return {
    grid: nextGrid,
    moved,
    scoreGained,
    hasWon,
  };
};

export const hasAvailableMove = (grid: Grid): boolean => {
  if (getEmptyCells(grid).length > 0) {
    return true;
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const value = grid[row][col];
      if (row + 1 < GRID_SIZE && grid[row + 1][col] === value) {
        return true;
      }
      if (col + 1 < GRID_SIZE && grid[row][col + 1] === value) {
        return true;
      }
    }
  }

  return false;
};

export const getBestTile = (board: Board): number => {
  let best = 0;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row][col] > best) {
        best = board[row][col];
      }
    }
  }
  return best;
};

export const createInitialGame = (): GameState => {
  const board = createInitialGrid();
  return {
    board,
    score: 0,
    won: false,
    gameOver: false,
  };
};

export const makeMove = (game: GameState, direction: Direction): GameState => {
  if (game.gameOver) {
    return game;
  }

  const result = moveGrid(game.board, direction);
  if (!result.moved) {
    return game;
  }

  const boardWithNewTile = addRandomTile(result.grid);
  const won = game.won || result.hasWon || getBestTile(boardWithNewTile) >= WIN_TILE;

  return {
    board: boardWithNewTile,
    score: game.score + result.scoreGained,
    won,
    gameOver: !hasAvailableMove(boardWithNewTile),
  };
};
