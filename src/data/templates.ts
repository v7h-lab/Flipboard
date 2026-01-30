import { BoardState, createEmptyBoard, ROWS, COLS, stringToBoard } from '../constants';

export interface Template {
    id: string;
    name: string;
    category: 'greetings' | 'patterns' | 'icons' | 'time' | 'custom';
    board: BoardState;
    isLive?: boolean; // For templates that update dynamically
}

// Helper to create a template from a string
const t = (id: string, name: string, category: Template['category'], text: string): Template => ({
    id,
    name,
    category,
    board: stringToBoard(text.toUpperCase()),
});

// Helper to create pattern templates with colors
const colorPattern = (id: string, name: string, pattern: string[], category: Template['category'] = 'patterns'): Template => {
    const board = createEmptyBoard();
    for (let row = 0; row < ROWS && row < pattern.length; row++) {
        for (let col = 0; col < COLS && col < pattern[row].length; col++) {
            const char = pattern[row][col];
            if (char === 'R') board[row][col] = { char: ' ', color: '[R]' };
            else if (char === 'O') board[row][col] = { char: ' ', color: '[O]' };
            else if (char === 'Y') board[row][col] = { char: ' ', color: '[Y]' };
            else if (char === 'G') board[row][col] = { char: ' ', color: '[G]' };
            else if (char === 'B') board[row][col] = { char: ' ', color: '[B]' };
            else if (char === 'V') board[row][col] = { char: ' ', color: '[V]' };
            else if (char === 'W') board[row][col] = { char: ' ', color: '[W]' };
            else if (char === 'P') board[row][col] = { char: ' ', color: '[P]' };
            else board[row][col] = { char: char !== ' ' ? char : ' ' };
        }
    }
    return { id, name, category, board };
};

// Pixel-art digits (4 cols x 6 rows each) for artsy clock
// 1 = white block, 0 = black/empty
const PIXEL_DIGITS: { [key: string]: number[][] } = {
    '0': [
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
    ],
    '1': [
        [0, 0, 0, 1],
        [0, 0, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
    ],
    '2': [
        [1, 1, 1, 1],
        [0, 0, 0, 1],
        [1, 1, 1, 1],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 1, 1, 1],
    ],
    '3': [
        [1, 1, 1, 1],
        [0, 0, 0, 1],
        [1, 1, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [1, 1, 1, 1],
    ],
    '4': [
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
    ],
    '5': [
        [1, 1, 1, 1],
        [1, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [1, 1, 1, 1],
    ],
    '6': [
        [1, 1, 1, 1],
        [1, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
    ],
    '7': [
        [1, 1, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
    ],
    '8': [
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
    ],
    '9': [
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [1, 1, 1, 1],
    ],
    ':': [
        [0, 0],
        [0, 1],
        [0, 0],
        [0, 0],
        [0, 1],
        [0, 0],
    ],
};

// Generate artsy big-digit clock using full board (HH:MM format)
export const generateArtsyClockBoard = (): BoardState => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const board = createEmptyBoard();

    // Layout: 22 cols total
    // 1 margin + 4 digit + 1 space + 4 digit + 2 colon + 4 digit + 1 space + 4 digit + 1 margin = 22
    // Positions: H1 at col 1, H2 at col 6, : at col 10, M1 at col 12, M2 at col 17

    const drawDigit = (digit: string, startCol: number) => {
        const pattern = PIXEL_DIGITS[digit];
        if (!pattern) return;

        for (let row = 0; row < ROWS && row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                const boardCol = startCol + col;
                if (boardCol >= 0 && boardCol < COLS && pattern[row][col] === 1) {
                    board[row][boardCol] = { char: ' ', color: '[W]' };
                }
            }
        }
    };

    // Draw HH:MM with equal spacing
    // Layout: 4 digit + 1 space + 4 digit + 2 space + 1 colon + 2 space + 4 digit + 1 space + 4 digit = 22
    drawDigit(hours[0], 0);     // First hour digit at col 0-3
    drawDigit(hours[1], 5);     // Second hour digit at col 5-8
    drawDigit(':', 9);          // Colon at col 9-10 (dot at col 10)
    drawDigit(minutes[0], 13);  // First minute digit at col 13-16 (2 spaces after colon)
    drawDigit(minutes[1], 18);  // Second minute digit at col 18-21

    return board;
};

// Generate simple text clock display with current time
export const generateClockBoard = (): BoardState => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();

    const timeStr = `${hours}:${minutes}`;
    const secStr = `:${seconds}`;
    const dateStr = `${monthName} ${date}`;

    // Center each line
    const centerText = (text: string): string => {
        const padding = Math.floor((COLS - text.length) / 2);
        return ' '.repeat(padding) + text + ' '.repeat(COLS - padding - text.length);
    };

    const row0 = centerText('');
    const row1 = centerText(timeStr);
    const row2 = centerText(secStr);
    const row3 = centerText(dayName);
    const row4 = centerText(dateStr);
    const row5 = centerText(year.toString());

    const fullText = row0 + row1 + row2 + row3 + row4 + row5;
    return stringToBoard(fullText);
};

export const PRESET_TEMPLATES: Template[] = [
    // Greetings
    t('hello', 'Hello', 'greetings',
        '                      ' +
        '        HELLO         ' +
        '                      ' +
        '      WELCOME TO      ' +
        '      FLIPBOARD       ' +
        '                      '),

    t('welcome-home', 'Welcome Home', 'greetings',
        '                      ' +
        '       WELCOME        ' +
        '         HOME         ' +
        '                      ' +
        '                      ' +
        '                      '),

    t('happy-birthday', 'Happy Birthday', 'greetings',
        '                      ' +
        '        HAPPY         ' +
        '       BIRTHDAY       ' +
        '                      ' +
        '          :)          ' +
        '                      '),

    t('good-morning', 'Good Morning', 'greetings',
        '                      ' +
        '         GOOD         ' +
        '        MORNING       ' +
        '                      ' +
        '    HAVE A GREAT DAY  ' +
        '                      '),

    t('love-you', 'Love You', 'greetings',
        '                      ' +
        '          I           ' +
        '         LOVE         ' +
        '          YOU         ' +
        '                      ' +
        '                      '),

    // Patterns
    colorPattern('rainbow', 'Rainbow', [
        'RRRRRRRRRRRRRRRRRRRRRR',
        'OOOOOOOOOOOOOOOOOOOOOO',
        'YYYYYYYYYYYYYYYYYYYYYY',
        'GGGGGGGGGGGGGGGGGGGGGG',
        'BBBBBBBBBBBBBBBBBBBBBB',
        'VVVVVVVVVVVVVVVVVVVVVV',
    ]),

    colorPattern('checkerboard', 'Checkerboard', [
        'BWBWBWBWBWBWBWBWBWBWBW',
        'WBWBWBWBWBWBWBWBWBWBWB',
        'BWBWBWBWBWBWBWBWBWBWBW',
        'WBWBWBWBWBWBWBWBWBWBWB',
        'BWBWBWBWBWBWBWBWBWBWBW',
        'WBWBWBWBWBWBWBWBWBWBWB',
    ]),

    colorPattern('gradient-sunset', 'Sunset Gradient', [
        'YYYYYYYYYYYYYYYYYYYYYY',
        'OOOOOOOOOOOOOOOOOOOOOO',
        'OOOOOOOOOOOOOOOOOOOOOO',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'VVVVVVVVVVVVVVVVVVVVVV',
    ]),

    // Icons - Heart centered (cols 7-14 for 8-wide heart)
    colorPattern('heart', 'Heart', [
        '       RR  RR         ',
        '      RRRRRRRR        ',
        '      RRRRRRRR        ',
        '       RRRRRR         ',
        '        RRRR          ',
        '         RR           ',
    ], 'icons'),

    // Time - Artsy big-digit clock template (HH:MM using full board)
    {
        id: 'live-clock',
        name: 'Big Clock (Live)',
        category: 'time',
        board: generateArtsyClockBoard(),
        isLive: true,
    },
];

// Template service for localStorage
const CUSTOM_TEMPLATES_KEY = 'flipboard_custom_templates';

export const templateService = {
    getCustomTemplates: (): Template[] => {
        try {
            const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    },

    saveCustomTemplate: (name: string, board: BoardState): Template => {
        const templates = templateService.getCustomTemplates();
        const template: Template = {
            id: `custom-${Date.now()}`,
            name,
            category: 'custom',
            board,
        };
        templates.push(template);
        localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
        return template;
    },

    deleteCustomTemplate: (id: string): void => {
        const templates = templateService.getCustomTemplates().filter(t => t.id !== id);
        localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
    },

    getAllTemplates: (): Template[] => {
        return [...PRESET_TEMPLATES, ...templateService.getCustomTemplates()];
    },
};
