import React, { useState, useEffect, useRef, useId } from "react";
import { Search, X, Loader2, Check } from "lucide-react";
import { fetchQuickSearch } from "@/api/projects.ts";
import type { QuickSearchResult } from "@/types/project.ts";

interface IntelligenceProjectSelectorProps {
  selectedProjectCode: string | null;
  onSelectProject: (projectCode: string) => void;
  onClear: () => void;
}

export const IntelligenceProjectSelector: React.FC<IntelligenceProjectSelectorProps> = ({
  selectedProjectCode,
  onSelectProject,
  onClear,
}) => {
  const [inputValue, setInputValue] = useState(selectedProjectCode || "");
  const [suggestions, setSuggestions] = useState<QuickSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Sync external selected project code to input
  useEffect(() => {
    setInputValue(selectedProjectCode || "");
  }, [selectedProjectCode]);

  // Debounced search
  useEffect(() => {
    const query = inputValue.trim();
    if (!query || query === selectedProjectCode) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await fetchQuickSearch(query, 8);
        if (isMounted) {
          setSuggestions(results);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }
      } catch {
        if (isMounted) {
          setSuggestions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [inputValue, selectedProjectCode]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (projectCode: string) => {
    const trimmed = projectCode.trim();
    if (!trimmed) return;
    setInputValue(trimmed);
    setIsOpen(false);
    setSuggestions([]);
    onSelectProject(trimmed);
  };

  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
    onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex].project_code);
      } else if (inputValue.trim()) {
        handleSelect(inputValue.trim());
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="terminal-selector-container">
      <div className="terminal-selector-label-strip">
        <label htmlFor="terminal-project-search" className="terminal-selector-label">
          SELECT PROJECT FOR RISK EVALUATION
        </label>
        <span className="terminal-selector-hint">SEARCH BY CANONICAL CODE OR NAME</span>
      </div>

      <div className="terminal-selector-input-wrap">
        <span className="terminal-selector-search-icon" aria-hidden="true">
          {isLoading ? <Loader2 size={16} className="terminal-spin" /> : <Search size={16} />}
        </span>

        <input
          ref={inputRef}
          id="terminal-project-search"
          type="text"
          className="terminal-selector-input monospace"
          placeholder="ENTER PROJECT CODE (e.g. 617936, N10000001) OR NAME..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined
          }
          autoComplete="off"
        />

        <div className="terminal-selector-actions">
          {inputValue && (
            <button
              type="button"
              className="terminal-selector-btn-clear"
              onClick={handleClear}
              aria-label="Clear project selection"
              title="Clear selection"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="button"
            className="terminal-selector-btn-submit"
            onClick={() => {
              if (inputValue.trim()) {
                handleSelect(inputValue.trim());
              }
            }}
            disabled={!inputValue.trim()}
            aria-label="Load project intelligence"
          >
            LOAD RECORD →
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown Listbox */}
      {isOpen && (
        <div
          id={listboxId}
          className="terminal-selector-dropdown"
          role="listbox"
          aria-label="Project suggestions"
        >
          {suggestions.length > 0 ? (
            suggestions.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected = item.project_code === selectedProjectCode;
              return (
                <div
                  key={item.project_code}
                  id={`${listboxId}-opt-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`terminal-selector-option ${isHighlighted ? "highlighted" : ""} ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => handleSelect(item.project_code)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div className="terminal-option-code-lockup">
                    <span className="terminal-option-code monospace">{item.project_code}</span>
                    {isSelected && <Check size={14} className="terminal-option-check" />}
                  </div>

                  <div className="terminal-option-content">
                    <span className="terminal-option-name">{item.project_name}</span>
                    <div className="terminal-option-meta">
                      {item.agency && <span className="terminal-option-agency">{item.agency}</span>}
                      <span className="terminal-option-cycle">CYCLE: {item.latest_report_month}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="terminal-selector-no-results">
              {isLoading ? "Searching PAIMANA infrastructure registry..." : "No matching projects found."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
