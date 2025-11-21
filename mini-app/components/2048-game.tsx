"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function getRandomTile() {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function emptyCells(grid: number[][]) {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) cells.push({ r, c });
    }
  }
  return cells;
}

const getTileClass = (val: number) => {
  if (val === 0) return "bg-gray-200";
  if (val <= 4) return "bg-blue-400 text-white";
  if (val <= 8) return "bg-green-400 text-white";
  if (val <= 16) return "bg-yellow-400 text-white";
  return "bg-red-400 text-white";
};

export function Game2048() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: SIZE }, () => Array(SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  useEffect(() => {
    initGame();
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case "ArrowUp":
          move("up");
          break;
        case "ArrowDown":
          move("down");
          break;
        case "ArrowLeft":
          move("left");
          break;
        case "ArrowRight":
          move("right");
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameOver]);

  const initGame = () => {
    const newGrid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWin(false);
  };

  const addRandomTile = (g: number[][]) => {
    const cells = emptyCells(g);
    if (cells.length === 0) return;
    const { r, c } = cells[Math.floor(Math.random() * cells.length)];
    g[r][c] = getRandomTile();
  };

  const compress = (row: number[]) => {
    const newRow = row.filter((v) => v !== 0);
    const missing = SIZE - newRow.length;
    return [...newRow, ...Array(missing).fill(0)];
  };

  const merge = (row: number[]) => {
    let scoreDelta = 0;
    for (let i = 0; i < SIZE - 1; i++) {
      if (row[i] !== 0 && row[i] === row[i + 1]) {
        row[i] *= 2;
        row[i + 1] = 0;
        scoreDelta += row[i];
      }
    }
    return { row, scoreDelta };
  };

  const move = (dir: "up" | "down" | "left" | "right") => {
    let rotated = false;
    let newGrid = grid.map((row) => [...row]);

    const rotate = (g: number[][]) => {
      const res = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          res[c][SIZE - 1 - r] = g[r][c];
        }
      }
      return res;
    };

    const reverse = (g: number[][]) => g.map((row) => row.slice().reverse());

    // Normalize to left move
    if (dir === "up") {
      newGrid = rotate(newGrid);
      rotated = true;
    } else if (dir === "right") {
      newGrid = reverse(newGrid);
      rotated = true;
    } else if (dir === "down") {
      newGrid = rotate(rotate(newGrid));
      rotated = true;
    }

    let moved = false;
    let scoreDelta = 0;

    newGrid = newGrid.map((row) => {
      const compressed = compress(row);
      const { row: mergedRow, scoreDelta: delta } = merge(compressed);
      scoreDelta += delta;
      const final = compress(mergedRow);
      if (!moved && !arraysEqual(row, final)) moved = true;
      return final;
    });

    if (!moved) return;

    if (rotated) {
      if (dir === "up") newGrid = rotate(newGrid);
      else if (dir === "right") newGrid = reverse(newGrid);
      else if (dir === "down") newGrid = rotate(rotate(newGrid));
    }

    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore((s) => s + scoreDelta);

    if (newGrid.some((row) => row.includes(2048))) setWin(true);
    if (!emptyCells(newGrid).length && !canMove(newGrid)) setGameOver(true);
  };

  const arraysEqual = (a: number[], b: number[]) => a.every((v, i) => v === b[i]);

  const canMove = (g: number[][]) => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
        if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((val, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-center h-16 w-16 rounded-md text-xl font-bold ${getTileClass(val)}`}
          >
            {val || ""}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg">Score: {score}</span>
        {win && <span className="text-green-600 font-semibold">You won!</span>}
        {gameOver && <span className="text-red-600 font-semibold">Game Over</span>}
        <div className="flex gap-2">
          <Button onClick={() => move("up")}>↑</Button>
          <Button onClick={() => move("down")}>↓</Button>
          <Button onClick={() => move("left")}>←</Button>
          <Button onClick={() => move("right")}>→</Button>
        </div>
        {(gameOver || win) && (
          <Share text={`I scored ${score} in 2048! ${url}`} />
        )}
      </div>
    </div>
  );
}
