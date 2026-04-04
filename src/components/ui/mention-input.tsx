"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { User } from "@/types";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}

export function MentionInput({
  value,
  onChange,
  users,
  placeholder,
  className,
  onSubmit,
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [dropdownIndex, setDropdownIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  useEffect(() => {
    setDropdownIndex(0);
  }, [mentionFilter]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    onChange(newValue);

    // Check if we're in a mention context
    const cursorPos = e.target.selectionStart ?? newValue.length;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex >= 0) {
      const textBetween = textBeforeCursor.slice(lastAtIndex + 1);
      // Show dropdown if @ is at start or preceded by a space, and no space after @
      if (
        (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === " ") &&
        !textBetween.includes(" ")
      ) {
        setMentionFilter(textBetween);
        setShowDropdown(true);
        return;
      }
    }
    setShowDropdown(false);
  }

  function insertMention(user: User) {
    const cursorPos = inputRef.current?.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const before = value.slice(0, lastAtIndex);
    const after = value.slice(cursorPos);
    const firstName = user.name.split(" ")[0];
    const newValue = `${before}@${firstName} ${after}`;
    onChange(newValue);
    setShowDropdown(false);

    // Refocus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showDropdown && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setDropdownIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setDropdownIndex((prev) =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredUsers[dropdownIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        return;
      }
    }

    if (e.key === "Enter" && !showDropdown && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {showDropdown && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 bottom-full mb-1 w-56 bg-white border border-[#d3cfc6] rounded-lg shadow-lg z-50 py-1 max-h-40 overflow-y-auto"
        >
          {filteredUsers.slice(0, 8).map((user, i) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(user);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                i === dropdownIndex
                  ? "bg-[#ff7c11]/10 text-[#ff7c11]"
                  : "text-[#383c48] hover:bg-[#f2f0ea]"
              }`}
            >
              {user.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
