"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";

interface InlineEditProps {
  value: string | null;
  videoId: string;
  field: "topic" | "brand";
  onSave: (videoId: string, field: "topic" | "brand", value: string) => void;
  suggestions?: string[];
}

export function InlineEdit({
  value,
  videoId,
  field,
  onSave,
  suggestions = [],
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) && s !== inputValue
  );

  function handleSave() {
    onSave(videoId, field, inputValue);
    setEditing(false);
    setShowSuggestions(false);
  }

  function handleCancel() {
    setInputValue(value || "");
    setEditing(false);
    setShowSuggestions(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1 text-left"
      >
        <span className={value ? "text-card-foreground" : "text-muted-foreground italic"}>
          {value || "None"}
        </span>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="relative flex items-center gap-1">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowSuggestions(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
        className="h-7 w-28 rounded border border-input bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        onClick={handleSave}
        className="rounded p-0.5 text-emerald-400 hover:bg-accent"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handleCancel}
        className="rounded p-0.5 text-muted-foreground hover:bg-accent"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 top-8 z-50 max-h-32 w-40 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setInputValue(s);
                setShowSuggestions(false);
              }}
              className="w-full rounded px-2 py-1 text-left text-xs text-popover-foreground hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
