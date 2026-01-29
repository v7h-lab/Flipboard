export const ROWS = 6;
export const COLS = 22;
export const TOTAL_BITS = ROWS * COLS;

// The standard character set for a split-flap display
// We include a space at the start (index 0)
// Vestaboard standard characters typically include letters, numbers, and some symbols/colors
export const CHARACTER_SET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$()[]+-&;:'\",.?/".split("");

// Map for color codes often used in digital board messages
export const COLOR_MAP: Record<string, string> = {
    "[R]": "bg-red-600",
    "[O]": "bg-orange-500",
    "[Y]": "bg-yellow-400",
    "[G]": "bg-green-500",
    "[B]": "bg-blue-600",
    "[V]": "bg-purple-600",
    "[W]": "bg-white",
    "[P]": "bg-pink-500" // Adding pink for variety
};
