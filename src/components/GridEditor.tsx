import React, { useState, useRef, useEffect } from 'react';
import { ROWS, COLS, CellData, BoardState, COLORS, CHARACTER_SET, createEmptyBoard } from '../constants';

interface GridEditorProps {
    board: BoardState;
    onChange: (board: BoardState) => void;
    theme?: 'dark' | 'light';
    compact?: boolean; // For mobile/remote view
}

const GridEditor: React.FC<GridEditorProps> = ({ board, onChange, theme = 'dark', compact = false }) => {
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus hidden input when cell is selected
    useEffect(() => {
        if (selectedCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [selectedCell]);

    const handleCellClick = (row: number, col: number) => {
        // If a color is selected, apply it directly to the clicked cell
        if (selectedColor) {
            applyColorToCell(row, col, selectedColor);
            // Move to next cell for quick color painting
            if (col < COLS - 1) {
                setSelectedCell({ row, col: col + 1 });
            } else if (row < ROWS - 1) {
                setSelectedCell({ row: row + 1, col: 0 });
            }
        } else {
            // No color selected, just select the cell for text input
            setSelectedCell({ row, col });
        }
    };

    const handleKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedCell) return;

        const char = e.target.value.toUpperCase().slice(-1);
        if (char && CHARACTER_SET.includes(char)) {
            updateCell(selectedCell.row, selectedCell.col, char);
            // Move to next cell
            moveToNextCell();
        }
        e.target.value = '';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!selectedCell) return;

        const { row, col } = selectedCell;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (row > 0) setSelectedCell({ row: row - 1, col });
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (row < ROWS - 1) setSelectedCell({ row: row + 1, col });
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (col > 0) setSelectedCell({ row, col: col - 1 });
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveToNextCell();
                break;
            case 'Backspace':
                e.preventDefault();
                updateCell(row, col, ' ');
                if (col > 0) setSelectedCell({ row, col: col - 1 });
                break;
            case 'Delete':
                e.preventDefault();
                updateCell(row, col, ' ');
                break;
            case 'Enter':
                e.preventDefault();
                if (row < ROWS - 1) setSelectedCell({ row: row + 1, col: 0 });
                break;
            case ' ':
                e.preventDefault();
                updateCell(row, col, ' ');
                moveToNextCell();
                break;
        }
    };

    const moveToNextCell = () => {
        if (!selectedCell) return;
        const { row, col } = selectedCell;
        if (col < COLS - 1) {
            setSelectedCell({ row, col: col + 1 });
        } else if (row < ROWS - 1) {
            setSelectedCell({ row: row + 1, col: 0 });
        }
    };

    const updateCell = (row: number, col: number, char: string) => {
        const newBoard = board.map((r, ri) =>
            r.map((c, ci) =>
                ri === row && ci === col
                    ? { char, color: selectedColor }
                    : c
            )
        );
        onChange(newBoard);
    };

    const applyColorToCell = (row: number, col: number, colorCode: string | undefined) => {
        const newBoard = board.map((r, ri) =>
            r.map((c, ci) =>
                ri === row && ci === col
                    ? { ...c, color: colorCode }
                    : c
            )
        );
        onChange(newBoard);
    };

    const clearBoard = () => {
        onChange(createEmptyBoard());
    };

    const getCellBg = (cell: CellData) => {
        if (cell.color) {
            const color = COLORS.find(c => c.code === cell.color);
            return color ? color.bg : '';
        }
        return theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f0f0f0]';
    };

    const cellSize = compact ? 'w-6 h-8 text-[10px]' : 'w-8 h-10 text-sm';
    const textColor = theme === 'dark' ? 'text-white' : 'text-black';

    return (
        <div className="flex flex-col gap-4">
            {/* Hidden input for keyboard capture */}
            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute -z-10 pointer-events-none"
                onKeyDown={handleKeyDown}
                onChange={handleKeyInput}
                autoCapitalize="characters"
            />

            {/* Grid */}
            <div
                className={`grid gap-[1px] p-2 rounded-lg ${theme === 'dark' ? 'bg-black' : 'bg-gray-300'}`}
                style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
            >
                {board.map((row, ri) =>
                    row.map((cell, ci) => (
                        <button
                            key={`${ri}-${ci}`}
                            onClick={() => handleCellClick(ri, ci)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                // Toggle color on right-click
                                if (selectedColor) {
                                    applyColorToCell(ri, ci, selectedColor);
                                }
                            }}
                            className={`
                                ${cellSize} ${getCellBg(cell)} ${textColor}
                                flex items-center justify-center font-mono font-bold
                                transition-all cursor-pointer
                                ${selectedCell?.row === ri && selectedCell?.col === ci
                                    ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-black scale-110 z-10'
                                    : 'hover:ring-1 hover:ring-white/30'
                                }
                                ${cell.color ? 'text-transparent' : ''}
                            `}
                        >
                            {cell.char}
                        </button>
                    ))
                )}
            </div>

            {/* Color Picker */}
            <div className={`flex items-center gap-2 p-2 rounded-lg ${theme === 'dark' ? 'bg-[#111]' : 'bg-gray-200'}`}>
                <span className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>COLOR:</span>
                <button
                    onClick={() => setSelectedColor(undefined)}
                    className={`w-6 h-6 rounded border-2 ${selectedColor === undefined ? 'border-yellow-400' : 'border-transparent'
                        } ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`}
                    title="No color"
                >
                    <span className="text-[8px]">Ø</span>
                </button>
                {COLORS.map(color => (
                    <button
                        key={color.code}
                        onClick={() => setSelectedColor(color.code)}
                        className={`w-6 h-6 rounded ${color.bg} border-2 transition-transform ${selectedColor === color.code
                            ? 'border-yellow-400 scale-110'
                            : 'border-transparent hover:scale-105'
                            }`}
                        title={color.name}
                    />
                ))}
                <div className="flex-1" />
                <button
                    onClick={clearBoard}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${theme === 'dark'
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/40'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                >
                    CLEAR
                </button>
            </div>

            {/* Quick alignment tools */}
            <div className={`flex gap-2 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                <button
                    onClick={() => {
                        if (!selectedCell) return;
                        setSelectedCell({ row: selectedCell.row, col: 0 });
                    }}
                    className={`px-2 py-1 rounded font-mono ${theme === 'dark' ? 'bg-[#222] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    ⬅ START
                </button>
                <button
                    onClick={() => {
                        if (!selectedCell) return;
                        setSelectedCell({ row: selectedCell.row, col: Math.floor(COLS / 2) });
                    }}
                    className={`px-2 py-1 rounded font-mono ${theme === 'dark' ? 'bg-[#222] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    ↔ CENTER
                </button>
                <button
                    onClick={() => {
                        if (!selectedCell) return;
                        setSelectedCell({ row: selectedCell.row, col: COLS - 1 });
                    }}
                    className={`px-2 py-1 rounded font-mono ${theme === 'dark' ? 'bg-[#222] text-gray-400 hover:bg-[#333]' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    END ➡
                </button>
            </div>
        </div>
    );
};

export default GridEditor;
