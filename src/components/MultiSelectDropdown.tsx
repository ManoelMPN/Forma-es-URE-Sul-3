import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface MultiSelectDropdownProps {
  id: string;
  label: string;
  placeholder: string;
  options: string[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  isDarkMode: boolean;
  searchPlaceholder?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  id,
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
  isDarkMode,
  searchPlaceholder = 'Pesquisar...',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter((opt) => opt.toLowerCase().includes(term));
  }, [options, searchTerm]);

  // Toggle a single item
  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  // Select all matching search (or all)
  const handleSelectAll = () => {
    onChange([...options]);
  };

  // Clear all selections (resets to all)
  const handleClearAll = () => {
    onChange([]);
    setSearchTerm('');
  };

  // Determine display text on trigger button
  const isAllSelected = selectedValues.length === 0 || selectedValues.length === options.length;
  const hasSelection = selectedValues.length > 0 && !isAllSelected;

  const triggerDisplayText = useMemo(() => {
    if (isAllSelected) {
      return `${placeholder} (${options.length})`;
    }
    if (selectedValues.length === 1) {
      return selectedValues[0];
    }
    return `${selectedValues.length} selecionados`;
  }, [isAllSelected, selectedValues, placeholder, options.length]);

  return (
    <div className="flex flex-col relative" ref={dropdownRef}>
      <label
        htmlFor={`${id}-trigger`}
        className={`text-xs font-bold uppercase tracking-wider mb-2 transition-colors flex items-center justify-between ${
          isDarkMode ? 'text-blue-300' : 'text-[#12285a]'
        }`}
      >
        <span>{label}</span>
        {hasSelection && (
          <span className="text-[11px] font-semibold text-blue-500 lowercase">
            {selectedValues.length} de {options.length}
          </span>
        )}
      </label>

      {/* Main Trigger Button */}
      <button
        id={`${id}-trigger`}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full flex items-center justify-between rounded-xl py-3 px-4 text-sm font-semibold transition shadow-xs cursor-pointer border text-left ${
          isDarkMode
            ? isOpen
              ? 'bg-[#1a2744] border-blue-400 ring-2 ring-blue-900/50 text-white'
              : 'bg-[#17223b] border-slate-700 text-slate-100 hover:border-slate-600'
            : isOpen
            ? 'bg-white border-[#162f65] ring-2 ring-blue-100 text-slate-900'
            : 'bg-white border-slate-300 hover:border-slate-400 text-slate-800'
        }`}
      >
        <span className="truncate pr-2 font-medium">
          {triggerDisplayText}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasSelection && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              title="Limpar filtro"
              className={`p-0.5 rounded-full transition hover:scale-110 ${
                isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-500' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id={`${id}-dropdown`}
          className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border shadow-xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isDarkMode
              ? 'bg-[#11192e] border-slate-700 text-slate-100 shadow-slate-950/60'
              : 'bg-white border-slate-200 text-slate-800 shadow-xl'
          }`}
        >
          {/* Search bar inside dropdown */}
          <div className={`p-3 border-b ${isDarkMode ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-100 bg-slate-50/70'}`}>
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border outline-none transition ${
                  isDarkMode
                    ? 'bg-[#17223b] border-slate-700 text-white placeholder-slate-500 focus:border-blue-400'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#162f65]'
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between mt-2 pt-1 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`font-semibold hover:underline cursor-pointer ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-[#162f65] hover:text-blue-700'
                }`}
              >
                Selecionar Todos
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className={`font-semibold hover:underline cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Limpar Seleção
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-transparent">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nenhuma opção encontrada para "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <div
                    key={option}
                    onClick={() => handleToggleOption(option)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition select-none ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-blue-900/40 text-blue-200 font-semibold'
                          : 'bg-blue-50 text-[#12285a] font-semibold'
                        : isDarkMode
                        ? 'hover:bg-slate-800/80 text-slate-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {/* Custom Checkbox */}
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                        isSelected
                          ? isDarkMode
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-[#162f65] border-[#162f65] text-white'
                          : isDarkMode
                          ? 'border-slate-600 bg-slate-800'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <span className="truncate">{option}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with done button */}
          <div className={`p-2 border-t flex justify-end ${isDarkMode ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-100 bg-slate-50'}`}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-[#162f65] hover:bg-[#12285a] text-white'
              }`}
            >
              Aplicar ({selectedValues.length === 0 ? 'Todos' : selectedValues.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
