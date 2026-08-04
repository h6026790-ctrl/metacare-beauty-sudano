// Client-only personalisation state (recently viewed, recent searches,
// notification read state). Stored in localStorage — no backend changes.
import { useCallback, useEffect, useState } from "react";

const KEYS = {
  viewed: "mc.recentlyViewed",
  searches: "mc.recentSearches",
  readNotifs: "mc.readNotifications",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Hydration-safe list stored in localStorage. */
function useLocalList<T>(key: string, limit: number) {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => { setItems(read<T[]>(key, [])); }, [key]);

  const push = useCallback((value: T, isSame: (a: T, b: T) => boolean) => {
    setItems((prev) => {
      const next = [value, ...prev.filter((p) => !isSame(p, value))].slice(0, limit);
      write(key, next);
      return next;
    });
  }, [key, limit]);

  const remove = useCallback((isMatch: (a: T) => boolean) => {
    setItems((prev) => {
      const next = prev.filter((p) => !isMatch(p));
      write(key, next);
      return next;
    });
  }, [key]);

  const clear = useCallback(() => { setItems([]); write(key, []); }, [key]);

  return { items, push, remove, clear };
}

export type ViewedProduct = { slug: string; at: number };

export function useRecentlyViewed() {
  const { items, push, clear } = useLocalList<ViewedProduct>(KEYS.viewed, 12);
  const record = useCallback((slug: string) => {
    if (!slug) return;
    push({ slug, at: Date.now() }, (a, b) => a.slug === b.slug);
  }, [push]);
  return { viewed: items, record, clear };
}

export function useRecentSearches() {
  const { items, push, remove, clear } = useLocalList<string>(KEYS.searches, 8);
  const record = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    push(clean, (a, b) => a.toLowerCase() === b.toLowerCase());
  }, [push]);
  return { searches: items, record, remove, clear };
}

export function useReadNotifications() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { setIds(read<string[]>(KEYS.readNotifs, [])); }, []);

  const markRead = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id].slice(-200);
      write(KEYS.readNotifs, next);
      return next;
    });
  }, []);

  const markAllRead = useCallback((allIds: string[]) => {
    setIds((prev) => {
      const next = Array.from(new Set([...prev, ...allIds])).slice(-200);
      write(KEYS.readNotifs, next);
      return next;
    });
  }, []);

  return { readIds: ids, markRead, markAllRead };
}
