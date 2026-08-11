export function centerArtworkGrid(grid: number[][]): number[][] {
  const height = grid.length;
  if (height === 0) return grid;
  const width = grid[0].length;
  if (width === 0) return grid;

  let minRow = height;
  let maxRow = -1;
  let minCol = width;
  let maxCol = -1;
  let hasNonZero = false;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] !== 0) {
        hasNonZero = true;
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
  }

  if (!hasNonZero) return grid;

  const bboxHeight = maxRow - minRow + 1;
  const bboxWidth = maxCol - minCol + 1;

  const targetStartRow = Math.floor((height - bboxHeight) / 2);
  const targetStartCol = Math.floor((width - bboxWidth) / 2);

  const offsetY = targetStartRow - minRow;
  const offsetX = targetStartCol - minCol;

  if (offsetX === 0 && offsetY === 0) return grid;

  const newGrid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const val = grid[r][c];
      if (val !== 0) {
        const newR = r + offsetY;
        const newC = c + offsetX;
        if (newR >= 0 && newR < height && newC >= 0 && newC < width) {
          newGrid[newR][newC] = val;
        }
      }
    }
  }

  return newGrid;
}

export function rescaleGrid(grid: number[][], targetSize: number): number[][] {
  const height = grid.length;
  if (height === 0) return grid;
  const width = grid[0].length;
  if (width === 0) return grid;

  if (height === targetSize && width === targetSize) return centerArtworkGrid(grid);

  const newGrid: number[][] = Array.from({ length: targetSize }, () => Array(targetSize).fill(0));

  for (let r = 0; r < targetSize; r++) {
    const origR = Math.min(height - 1, Math.floor((r / targetSize) * height));
    for (let c = 0; c < targetSize; c++) {
      const origC = Math.min(width - 1, Math.floor((c / targetSize) * width));
      newGrid[r][c] = grid[origR][origC];
    }
  }

  return centerArtworkGrid(newGrid);
}

