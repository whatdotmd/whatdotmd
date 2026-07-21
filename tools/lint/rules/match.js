// Shared helpers for compiling rules-config phrase/pattern lists into
// RegExp and formatting findings. Not part of the build spec's file list
// verbatim, but the natural home for logic every rule module needs —
// kept out of rules/index.js to avoid a circular import (index.js
// registers the rule modules, which would otherwise need to import back
// from it).

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Config "phrases" entries: literal, word-boundary, case-insensitive.
export function compilePhrase(phrase) {
  return new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i')
}

// Config "patterns" entries: explicit regex, case-insensitive.
export function compilePattern(pattern) {
  return new RegExp(pattern, 'i')
}

export function excerpt(text, max = 80) {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}
