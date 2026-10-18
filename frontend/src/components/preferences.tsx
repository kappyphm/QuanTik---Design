"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { SessionEvents } from "./account/session";
const defaults = ["FPT", "HPG", "MBB"];
const Context = createContext<{
  watchlist: string[];
  toggleWatch: (symbol: string) => void;
  theme: string;
  toggleTheme: () => void;
}>({
  watchlist: defaults,
  toggleWatch: () => {},
  theme: "dark",
  toggleTheme: () => {},
});
export function Preferences({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>(defaults);
  const [theme, setTheme] = useState("dark");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("quantik.design.watchlist") ?? "null",
      );
      if (
        Array.isArray(saved) &&
        saved.every((item) => typeof item === "string")
      )
        setWatchlist(saved);
      if (localStorage.getItem("quantik.design.theme") === "light")
        setTheme("light");
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        "quantik.design.watchlist",
        JSON.stringify(watchlist),
      );
      localStorage.setItem("quantik.design.theme", theme);
    } catch {}
  }, [watchlist, theme, loaded]);
  return (
    <Context.Provider
      value={{
        watchlist,
        toggleWatch: (symbol) =>
          setWatchlist((items) =>
            items.includes(symbol)
              ? items.filter((item) => item !== symbol)
              : [...items, symbol],
          ),
        theme,
        toggleTheme: () =>
          setTheme((value) => (value === "dark" ? "light" : "dark")),
      }}
    >
      <SessionEvents/>{children}
    </Context.Provider>
  );
}
export const usePreferences = () => useContext(Context);
