import React, { useState } from 'react';
import { Template, PRESET_TEMPLATES, templateService, generateClockBoard } from '../data/templates';
import { BoardState, COLS, COLORS } from '../constants';

interface TemplateLibraryProps {
    onSelect: (board: BoardState) => void;
    onSelectLive?: (generator: () => BoardState) => void; // For live templates
    onSaveCustom?: (name: string, board: BoardState) => void;
    currentBoard?: BoardState;
    theme?: 'dark' | 'light';
}

const CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'greetings', name: 'Greetings' },
    { id: 'patterns', name: 'Patterns' },
    { id: 'icons', name: 'Icons' },
    { id: 'time', name: 'Time' },
    { id: 'custom', name: 'My Templates' },
] as const;

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
    onSelect,
    onSelectLive,
    onSaveCustom,
    currentBoard,
    theme = 'dark'
}) => {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [customTemplates, setCustomTemplates] = useState<Template[]>(templateService.getCustomTemplates());
    const [saveName, setSaveName] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);

    const allTemplates = [...PRESET_TEMPLATES, ...customTemplates];
    const filteredTemplates = activeCategory === 'all'
        ? allTemplates
        : allTemplates.filter(t => t.category === activeCategory);

    const handleSave = () => {
        if (!saveName.trim() || !currentBoard) return;
        const newTemplate = templateService.saveCustomTemplate(saveName, currentBoard);
        setCustomTemplates([...customTemplates, newTemplate]);
        setSaveName('');
        setShowSaveModal(false);
    };

    const handleDelete = (id: string) => {
        templateService.deleteCustomTemplate(id);
        setCustomTemplates(customTemplates.filter(t => t.id !== id));
    };

    const getCellColor = (colorCode?: string) => {
        if (!colorCode) return theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f0f0f0]';
        const color = COLORS.find(c => c.code === colorCode);
        return color ? color.bg : (theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f0f0f0]');
    };

    // Mini preview renderer
    const renderPreview = (board: BoardState) => (
        <div
            className="grid gap-[1px] p-1 rounded bg-black"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
            {board.map((row, ri) =>
                row.map((cell, ci) => (
                    <div
                        key={`${ri}-${ci}`}
                        className={`w-2 h-2 ${getCellColor(cell.color)} flex items-center justify-center`}
                    >
                        <span className="text-[4px] text-white/80 font-mono">
                            {cell.char !== ' ' && !cell.color ? cell.char : ''}
                        </span>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-all ${activeCategory === cat.id
                            ? 'bg-yellow-500 text-black font-bold'
                            : theme === 'dark'
                                ? 'bg-[#222] text-gray-400 hover:bg-[#333]'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                    >
                        {cat.name}
                        {cat.id === 'custom' && customTemplates.length > 0 && ` (${customTemplates.length})`}
                    </button>
                ))}
            </div>

            {/* Save current as template */}
            {currentBoard && onSaveCustom && (
                <button
                    onClick={() => setShowSaveModal(true)}
                    className={`w-full py-2 rounded text-xs font-mono font-bold transition-colors ${theme === 'dark'
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/40 border border-green-600/30'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                        }`}
                >
                    + SAVE CURRENT AS TEMPLATE
                </button>
            )}

            {/* Template grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {filteredTemplates.map(template => (
                    <button
                        key={template.id}
                        onClick={() => {
                            if (template.isLive && onSelectLive) {
                                // For live templates, pass the generator function
                                if (template.id === 'live-clock') {
                                    onSelectLive(generateClockBoard);
                                }
                            } else {
                                onSelect(template.board);
                            }
                        }}
                        className={`p-2 rounded-lg transition-all hover:scale-105 relative ${theme === 'dark'
                            ? 'bg-[#111] border border-[#333] hover:border-yellow-500/50'
                            : 'bg-white border border-gray-300 hover:border-yellow-500'
                            }`}
                    >
                        {template.isLive && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded animate-pulse">
                                LIVE
                            </div>
                        )}
                        {renderPreview(template.isLive ? generateClockBoard() : template.board)}
                        <div className="flex items-center justify-between mt-2">
                            <span className={`text-[10px] font-mono truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                {template.name}
                            </span>
                            {template.category === 'custom' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(template.id);
                                    }}
                                    className="text-red-500 hover:text-red-400 text-[10px]"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    <p className="text-sm font-mono">No templates in this category</p>
                </div>
            )}

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className={`p-6 rounded-xl max-w-sm w-full ${theme === 'dark' ? 'bg-[#1a1a1a] border border-[#333]' : 'bg-white border border-gray-300'
                        }`}>
                        <h3 className={`text-lg font-bold font-mono mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'
                            }`}>
                            Save Template
                        </h3>
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="Template name..."
                            className={`w-full p-3 rounded-lg border font-mono text-sm mb-4 ${theme === 'dark'
                                ? 'bg-black border-[#333] text-white'
                                : 'bg-gray-50 border-gray-300 text-black'
                                }`}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className={`flex-1 py-2 rounded font-mono text-sm ${theme === 'dark'
                                    ? 'bg-[#222] text-gray-400 hover:bg-[#333]'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!saveName.trim()}
                                className="flex-1 py-2 rounded font-mono text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50"
                            >
                                SAVE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateLibrary;
