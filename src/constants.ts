// Board dimensions (standard split-flap display)
export const ROWS = 6;
export const COLS = 22;
export const TOTAL_BITS = ROWS * COLS; // 132 characters

// Cell data structure for precise control
export interface CellData {
    char: string;
    color?: string; // Color code like '[R]' or undefined for default
}

// Board state as 2D grid
export type BoardState = CellData[][];

// Create empty board
export const createEmptyBoard = (): BoardState => {
    return Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => ({ char: ' ' }))
    );
};

// Convert string to BoardState
export const stringToBoard = (str: string): BoardState => {
    const padded = str.padEnd(TOTAL_BITS, ' ');
    const board = createEmptyBoard();
    for (let i = 0; i < TOTAL_BITS; i++) {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        board[row][col] = { char: padded[i] };
    }
    return board;
};

// Convert BoardState to string (for legacy compatibility)
export const boardToString = (board: BoardState): string => {
    return board.map(row => row.map(cell => cell.char).join('')).join('');
};

// The standard character set for a split-flap display
export const CHARACTER_SET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$()[]+-&;:'\",.?/".split("");

// Color codes are treated as special "characters" in the flap set
// They appear at the end of the set, so flipping to a color cycles through all chars first
export const COLOR_CODES = ['[R]', '[O]', '[Y]', '[G]', '[B]', '[V]', '[W]', '[P]'] as const;

// Combined flap set: characters + colors (colors flip in after all characters)
export const FLAP_SET = [...CHARACTER_SET, ...COLOR_CODES];

// Color palette with UI-friendly properties
export const COLORS = [
    { code: '[R]', name: 'Red', bg: 'bg-red-600', hex: '#dc2626' },
    { code: '[O]', name: 'Orange', bg: 'bg-orange-500', hex: '#f97316' },
    { code: '[Y]', name: 'Yellow', bg: 'bg-yellow-400', hex: '#facc15' },
    { code: '[G]', name: 'Green', bg: 'bg-green-500', hex: '#22c55e' },
    { code: '[B]', name: 'Blue', bg: 'bg-blue-600', hex: '#2563eb' },
    { code: '[V]', name: 'Violet', bg: 'bg-purple-600', hex: '#9333ea' },
    { code: '[W]', name: 'White', bg: 'bg-white', hex: '#ffffff' },
    { code: '[P]', name: 'Pink', bg: 'bg-pink-500', hex: '#ec4899' },
] as const;

export type ColorCode = typeof COLORS[number]['code'];

// Map for quick color lookup (legacy compatibility)
export const COLOR_MAP: Record<string, string> = Object.fromEntries(
    COLORS.map(c => [c.code, c.bg])
);
