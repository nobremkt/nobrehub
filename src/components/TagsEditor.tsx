import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

// Predefined tag colors
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    quente: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    frio: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    decisor: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    indicação: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    urgente: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    novo: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    vip: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    'alto-valor': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    'follow-up': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };

export const getTagColor = (tag: string) => {
    const lowerTag = tag.toLowerCase();
    return TAG_COLORS[lowerTag] || DEFAULT_COLOR;
};

interface TagBadgeProps {
    tag: string;
    onRemove?: () => void;
    size?: 'xs' | 'sm' | 'md';
    className?: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ tag, onRemove, size = 'sm', className }) => {
    const colors = getTagColor(tag);
    const sizeClasses = {
        xs: 'text-[9px] px-1.5 py-0.5',
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full font-medium border',
                colors.bg, colors.text, colors.border,
                sizeClasses[size],
                className
            )}
        >
            {tag}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="hover:bg-black/10 rounded-full p-0.5 -mr-0.5"
                >
                    <X size={10} />
                </button>
            )}
        </span>
    );
};

interface TagsEditorProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    availableTags?: string[];
    maxDisplay?: number;
    editable?: boolean;
    size?: 'xs' | 'sm' | 'md';
}

export const TagsEditor: React.FC<TagsEditorProps> = ({
    tags,
    onChange,
    availableTags = [],
    maxDisplay = 3,
    editable = true,
    size = 'sm',
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsAdding(false);
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleAddTag = (tag: string) => {
        const trimmedTag = tag.trim().toLowerCase();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            onChange([...tags, trimmedTag]);
        }
        setNewTag('');
        setIsAdding(false);
        setShowSuggestions(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(newTag);
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setNewTag('');
        }
    };

    const filteredSuggestions = availableTags
        .filter(t => !tags.includes(t))
        .filter(t => t.toLowerCase().includes(newTag.toLowerCase()))
        .slice(0, 5);

    const displayedTags = tags.slice(0, maxDisplay);
    const remainingCount = tags.length - maxDisplay;

    return (
        <div ref={containerRef} className="flex flex-wrap items-center gap-1">
            {displayedTags.map(tag => (
                <TagBadge
                    key={tag}
                    tag={tag}
                    size={size}
                    onRemove={editable ? () => handleRemoveTag(tag) : undefined}
                />
            ))}

            {remainingCount > 0 && (
                <span className="text-[10px] text-slate-400 px-1">
                    +{remainingCount}
                </span>
            )}

            {editable && (
                <div className="relative">
                    {isAdding ? (
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newTag}
                                onChange={(e) => {
                                    setNewTag(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Nova tag..."
                                className="w-20 px-2 py-0.5 text-[10px] border border-violet-300 rounded-full bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                            />

                            {/* Suggestions dropdown */}
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                                    {filteredSuggestions.map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => handleAddTag(suggestion)}
                                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <TagBadge tag={suggestion} size="xs" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors"
                            title="Adicionar tag"
                        >
                            <Plus size={12} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

interface TagsDisplayProps {
    tags: string[];
    maxDisplay?: number;
    size?: 'xs' | 'sm' | 'md';
}

export const TagsDisplay: React.FC<TagsDisplayProps> = ({ tags, maxDisplay = 3, size = 'sm' }) => {
    if (!tags || tags.length === 0) return null;

    const displayedTags = tags.slice(0, maxDisplay);
    const remainingCount = tags.length - maxDisplay;

    return (
        <div className="flex flex-wrap items-center gap-1">
            {displayedTags.map(tag => (
                <TagBadge key={tag} tag={tag} size={size} />
            ))}
            {remainingCount > 0 && (
                <span className="text-[10px] text-slate-400 px-1">
                    +{remainingCount}
                </span>
            )}
        </div>
    );
};

export default TagsEditor;
