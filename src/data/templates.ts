import { BoardState, createEmptyBoard, ROWS, COLS, stringToBoard } from '../constants';

export interface Template {
    id: string;
    name: string;
    category: 'greetings' | 'patterns' | 'icons' | 'time' | 'custom';
    board: BoardState;
}

// Helper to create a template from a string
const t = (id: string, name: string, category: Template['category'], text: string): Template => ({
    id,
    name,
    category,
    board: stringToBoard(text.toUpperCase()),
});

// Helper to create pattern templates with colors
const colorPattern = (id: string, name: string, pattern: string[]): Template => {
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
            else board[row][col] = { char: ' ' };
        }
    }
    return { id, name, category: 'patterns', board };
};

export const PRESET_TEMPLATES: Template[] = [
    // Greetings
    t('hello', 'Hello', 'greetings',
        '                      ' +
        '        HELLO         ' +
        '                      ' +
        '      WELCOME TO      ' +
        '    FLIPBOARD         ' +
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
        '         :)           ' +
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

    // Icons
    colorPattern('heart', 'Heart', [
        '  RR    RR            ',
        ' RRRR  RRRR           ',
        ' RRRRRRRRRR           ',
        '  RRRRRRRR            ',
        '    RRRR              ',
        '      RR              ',
    ]),

    // Time templates (placeholders)
    t('time-display', 'Time Display', 'time',
        '                      ' +
        '       12:00          ' +
        '                      ' +
        '     WEDNESDAY        ' +
        '    JANUARY 29        ' +
        '                      '),
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
