import { useState, useEffect, useRef, useCallback } from "react";
import { checkGrammar, isTechTerm, type LTMatch } from "@/lib/languageTool";

const IGNORED_KEY = "bloom-ignored-words";

function loadIgnored(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(IGNORED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveIgnored(words: Set<string>) {
  localStorage.setItem(IGNORED_KEY, JSON.stringify([...words]));
}

export function useGrammarCheck(text: string, delay = 1500) {
  const [matches, setMatches]   = useState<LTMatch[]>([]);
  const [checking, setChecking] = useState(false);
  const [ignored, setIgnored]   = useState<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load persisted ignored words on mount
  useEffect(() => { setIgnored(loadIgnored()); }, []);

  /** Filter matches: remove tech terms and user-ignored words */
  const filterMatches = useCallback(
    (raw: LTMatch[], currentText: string, ignoredWords: Set<string>): LTMatch[] => {
      return raw.filter((match) => {
        const flagged = currentText.slice(match.offset, match.offset + match.length);
        if (isTechTerm(flagged)) return false;
        if (ignoredWords.has(flagged.toLowerCase())) return false;
        return true;
      });
    },
    []
  );

  useEffect(() => {
    clearTimeout(timer.current);
    if (!text.trim() || text.length < 4) { setMatches([]); return; }

    timer.current = setTimeout(async () => {
      setChecking(true);
      try {
        const raw     = await checkGrammar(text);
        const cleaned = filterMatches(raw, text, ignored);
        setMatches(cleaned);
      } catch {
        setMatches([]);
      } finally {
        setChecking(false);
      }
    }, delay);

    return () => clearTimeout(timer.current);
  }, [text, delay, ignored, filterMatches]);

  /** Permanently ignore a word — saved to localStorage */
  function ignoreWord(word: string) {
    setIgnored((prev) => {
      const next = new Set(prev);
      next.add(word.toLowerCase());
      saveIgnored(next);
      return next;
    });
    // Remove from current matches immediately
    setMatches((prev) =>
      prev.filter((m) => {
        const flagged = text.slice(m.offset, m.offset + m.length);
        return flagged.toLowerCase() !== word.toLowerCase();
      })
    );
  }

  /** Apply a single fix and return the corrected string */
  function applyFix(match: LTMatch, replacement: string, current: string): string {
    return current.slice(0, match.offset) + replacement + current.slice(match.offset + match.length);
  }

  /** Apply all first-suggestion fixes right-to-left so offsets stay valid */
  function applyAllFixes(current: string): string {
    const sorted = [...matches]
      .filter((m) => m.replacements.length > 0)
      .sort((a, b) => b.offset - a.offset);
    let result = current;
    for (const match of sorted) {
      result = applyFix(match, match.replacements[0].value, result);
    }
    return result;
  }

  return { matches, checking, applyFix, applyAllFixes, ignoreWord };
}
