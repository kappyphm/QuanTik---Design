"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ChartCandlestick,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { stocks } from "@/lib/mock-data";
import { usePreferences } from "./preferences";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/screener", label: "Lọc cổ phiếu", icon: SlidersHorizontal },
  { href: "/analysis", label: "Phân tích Quant", icon: Sparkles },
  { href: "/charts", label: "Biểu đồ", icon: ChartCandlestick },
];
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = usePreferences();
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const current =
    navigation.find((item) => item.href === pathname)?.label ?? "QuanTik";
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      if (
        event.key === "/" &&
        !(
          event.target instanceof HTMLElement &&
          (event.target.matches("input,textarea,select") ||
            event.target.isContentEditable)
        )
      ) {
        event.preventDefault();
        search.current?.focus();
      }
      if (event.key === "Escape") {
        setQuery("");
        setMobile(false);
        if (mobileButton.current?.getAttribute("aria-expanded") === "true") mobileButton.current.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const links = sidebar.current?.querySelectorAll<HTMLAnchorElement>("a");
    links?.[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !links?.length) return;
      if (event.shiftKey && document.activeElement === links[0]) {
        event.preventDefault();
        links[links.length - 1].focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === links[links.length - 1]
      ) {
        event.preventDefault();
        links[0].focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [mobile]);
  const open = (symbol: string) => {
    setQuery("");
    setError("");
    router.push(`/analysis?symbol=${encodeURIComponent(symbol)}`);
  };
  return (
    <div className="terminal" data-theme={theme}>
      <a className="skip-link" href="#workspace">
        Đến nội dung
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          onClick={() => {
            setMobile(false);
            mobileButton.current?.focus();
          }}
          aria-label="Đóng menu"
        />
      )}
      <aside
        className={`terminal-sidebar ${mobile ? "is-open" : ""}`}
        id="terminal-navigation"
        ref={sidebar}
      >
        <Link
          className="terminal-brand"
          href="/"
          aria-label="QuanTik — Trang chủ"
        >
          <img src="/quantik-logo.jpg" width="38" height="38" alt="" />
          <span>
            Quan<span>Tik</span>
          </span>
        </Link>
        <nav aria-label="Điều hướng chính">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setMobile(false)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {pathname === href && (
                <ChevronRight size={16} className="nav-chevron" />
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Link href="/">
            Trang chủ <ArrowUpRight size={17} />
          </Link>
          <span>© 2026 QuanTik</span>
        </div>
      </aside>
      <div className="terminal-workspace">
        <header className="terminal-topbar">
          <div className="topbar-location">
            <button
              ref={mobileButton}
              className="icon-button mobile-menu"
              onClick={() => setMobile((value) => !value)}
              aria-label={mobile ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobile}
              aria-controls="terminal-navigation"
            >
              {mobile ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span>
              QuanTik <ChevronRight size={15} /> <b>{current}</b>
            </span>
          </div>
          <form
            className="global-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const stock = stocks.find(
                (s) => s.symbol === query.trim().toUpperCase(),
              );
              if (stock) open(stock.symbol);
              else setError("Mã này chưa có trong bộ dữ liệu mẫu.");
            }}
          >
            <Search size={18} />
            <label className="sr-only" htmlFor="global-search">
              Tra cứu mã cổ phiếu
            </label>
            <input
              id="global-search"
              ref={search}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value.toUpperCase());
                setError("");
              }}
              placeholder="Tìm mã cổ phiếu"
              autoComplete="off"
            />
            <kbd>/</kbd>
            {query && (
              <div className="search-results">
                {stocks
                  .filter((s) =>
                    `${s.symbol} ${s.name}`.toUpperCase().includes(query),
                  )
                  .slice(0, 5)
                  .map((stock) => (
                    <button
                      type="button"
                      key={stock.symbol}
                      onClick={() => open(stock.symbol)}
                    >
                      <b>{stock.symbol}</b>
                      <span>{stock.name}</span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                {!stocks.some((s) =>
                  `${s.symbol} ${s.name}`.toUpperCase().includes(query),
                ) && <p>Chưa có mã phù hợp trong bản mẫu.</p>}
              </div>
            )}
          </form>
          <div className="topbar-actions">
            <span className="mock-badge">Dữ liệu minh họa</span>
            <button
              className="icon-button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark" ? "Chuyển chế độ sáng" : "Chuyển chế độ tối"
              }
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        <main className="workspace-content" id="workspace">
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
