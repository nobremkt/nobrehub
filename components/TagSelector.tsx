
import React, { useState, useRef, useEffect } from 'react';
import { Tag as TagIcon, X, Check, ChevronDown, Plus } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
}

const AVAILABLE_TAGS = [
  "Urgente", "VIP", "Follow-up", "Negociação", "Lead Frio", "High Potential", "Empresa", "Parceria"
];

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="relative space-y-2" ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex flex-wrap items-center gap-2 bg-white border transition-all duration-300 px-6 py-4 rounded-3xl min-h-[64px] cursor-pointer shadow-sm ${
          isOpen ? 'border-rose-600 ring-4 ring-rose-600/5' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <TagIcon className="text-slate-300 flex-shrink-0" size={18} />
        
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 flex-1">
            {selectedTags.map(tag => (
              <span 
                key={tag} 
                className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-black text-rose-600 uppercase tracking-tight"
                onClick={(e) => { e.stopPropagation(); toggleTag(tag); }}
              >
                {tag}
                <X size={12} className="hover:text-rose-900 transition-colors" />
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-300 text-sm flex-1">Selecionar marcadores...</span>
        )}
        
        <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-600' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-64 overflow-y-auto no-scrollbar py-3 px-2 grid grid-cols-1 gap-1">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`w-full flex items-center justify-between px-6 py-4 text-sm transition-all text-left rounded-2xl group ${
                  selectedTags.includes(tag) 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`tracking-tight ${selectedTags.includes(tag) ? 'font-black' : 'font-bold'}`}>
                  {tag}
                </span>
                {selectedTags.includes(tag) ? <Check size={16} className="text-white" /> : <Plus size={16} className="text-slate-200" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector;
