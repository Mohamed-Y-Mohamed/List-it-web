"use client";

// The body of every create-or-edit dialog for a list or a collection.
//
// All four of those screens ask the same two questions — what is it called, and
// what colour is it — and all four had their own 150-line copy of the answer.
// They had already drifted: different swatch sizes, different selected states,
// one with a border that ate into the circle and one with a ring outside it.
//
// No icon picker, deliberately. The brief removed decorative list icons from the
// product, and that includes not asking anyone to choose one. The `list_icon`
// column still exists and still receives a value for compatibility — see the
// insert in ListPopup — but it is no longer a question put to the user.

import React from "react";
import { AlertCircle, Check } from "lucide-react";
import { isLightColor } from "@/lib/colors";
import SectionLabel from "./SectionLabel";
import { DANGER, PRIMARY, SUCCESS } from "./tokens";

export default function NameColorForm({
  formId,
  onSubmit,
  nameLabel,
  namePlaceholder,
  name,
  onNameChange,
  maxLength = 50,
  colors,
  colorsLoading,
  selectedColor,
  onSelectColor,
  disabled,
  error,
  successMessage,
  inputRef,
  isDark,
  children,
}: {
  formId: string;
  onSubmit: (event: React.FormEvent) => void;
  nameLabel: string;
  namePlaceholder: string;
  name: string;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  colors: { color_hex: string; color_name: string }[];
  colorsLoading: boolean;
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  disabled?: boolean;
  error?: string | null;
  successMessage?: string | null;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isDark: boolean;
  /** Anything the particular dialog needs that the other three do not. */
  children?: React.ReactNode;
}) {
  const mutedText = isDark ? "text-gray-400" : "text-gray-500";
  const fieldClass = isDark
    ? "border-white/[0.08] bg-white/[0.04] text-gray-100 placeholder:text-gray-600"
    : "border-black/[0.08] bg-white text-gray-900 placeholder:text-gray-400";

  return (
    <>
      {error && (
        <div
          className="mb-3 flex items-start gap-2 rounded-xl px-3 py-2 text-[13px]"
          style={{
            backgroundColor: `color-mix(in srgb, ${DANGER} 14%, transparent)`,
            color: DANGER,
          }}
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]"
          style={{
            backgroundColor: `color-mix(in srgb, ${SUCCESS} 14%, transparent)`,
            color: SUCCESS,
          }}
          role="status"
        >
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form id={formId} onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <SectionLabel isDark={isDark}>
            {nameLabel} <span style={{ color: DANGER }}>*</span>
          </SectionLabel>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={onNameChange}
            maxLength={maxLength}
            disabled={disabled}
            placeholder={namePlaceholder}
            className={`min-h-[48px] w-full rounded-xl border px-3.5 text-[15px] focus:outline-none focus:ring-1 ${fieldClass}`}
            style={{ ["--tw-ring-color" as string]: PRIMARY }}
          />
          <p className={`text-right text-[11px] ${mutedText}`}>
            {name.length}/{maxLength}
          </p>
        </div>

        <div className="space-y-2">
          <SectionLabel isDark={isDark}>Colour</SectionLabel>
          {colorsLoading ? (
            <p className={`text-[13px] ${mutedText}`}>Loading colours...</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {colors.map(({ color_hex, color_name }) => {
                const selected = color_hex === selectedColor;
                return (
                  <button
                    key={color_hex}
                    type="button"
                    onClick={() => onSelectColor(color_hex)}
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={`Select ${color_name}`}
                    title={color_name}
                    // A ring outside the swatch rather than a border inside it:
                    // a border eats 2px of a 36px circle, so the selected colour
                    // reads as a slightly smaller, slightly different colour
                    // than the ones beside it.
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-shadow disabled:opacity-50 ${
                      selected
                        ? isDark
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#131A2B]"
                          : "ring-2 ring-gray-900 ring-offset-2 ring-offset-white"
                        : ""
                    }`}
                    style={{ backgroundColor: color_hex }}
                  >
                    {selected && (
                      <Check
                        className={`h-4 w-4 drop-shadow ${
                          isLightColor(color_hex)
                            ? "text-gray-900"
                            : "text-white"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {children}
      </form>
    </>
  );
}
