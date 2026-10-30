"use client"
import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { trackColorblindSwitch } from "@/lib/analytics";

type ColorBlindMode = "none" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

const MODES: Array<{ value: ColorBlindMode; labelKey: string }> = [
  { value: "none", labelKey: "colorblindNone" },
  { value: "protanopia", labelKey: "colorblindProtanopia" },
  { value: "deuteranopia", labelKey: "colorblindDeuteranopia" },
  { value: "tritanopia", labelKey: "colorblindTritanopia" },
  { value: "achromatopsia", labelKey: "colorblindAchromatopsia" },
];

const STORAGE_KEY = "boxgoods-colorblind-mode";

export default function ColorBlindToggle() {
  const { lang: _lang, tr } = useLang();
  const [mode, setMode] = useState<ColorBlindMode>("none");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as ColorBlindMode | null;
    if (saved && MODES.some(m => m.value === saved)) {
      setMode(saved);
      document.documentElement.setAttribute("data-colorblind", saved);
    }
  }, []);

  const handleChange = (newMode: ColorBlindMode) => {
    setMode(newMode);
    setOpen(false);
    if (newMode === "none") {
      localStorage.removeItem(STORAGE_KEY);
      document.documentElement.removeAttribute("data-colorblind");
    } else {
      localStorage.setItem(STORAGE_KEY, newMode);
      document.documentElement.setAttribute("data-colorblind", newMode);
    }
    trackColorblindSwitch(newMode);
    // 通知其他标签页
    window.dispatchEvent(new CustomEvent("colorblind-change", { detail: newMode }));
  };

  useEffect(() => {
    const handler = (e: CustomEvent<ColorBlindMode>) => {
      setMode(e.detail);
      if (e.detail === "none") {
        document.documentElement.removeAttribute("data-colorblind");
      } else {
        document.documentElement.setAttribute("data-colorblind", e.detail);
      }
    };
    window.addEventListener("colorblind-change", handler as EventListener);
    return () => window.removeEventListener("colorblind-change", handler as EventListener);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative" onClick={() => setOpen(!open)}>
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-line)]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={tr("colorblindLabel") || "色盲模式"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-brand)]">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span className="text-xs font-medium text-[var(--color-ink)] hidden sm:block">
          {MODES.find(m => m.value === mode)?.labelKey ? tr(MODES.find(m => m.value === mode)!.labelKey) : tr("colorblindNone")}
        </span>
        <svg className="w-4 h-4 text-[var(--color-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[var(--color-line)] rounded-xl shadow-lg z-50 py-2">
            {MODES.map(({ value, labelKey }) => (
              <button
                key={value}
                onClick={() => handleChange(value)}
                className={`w-full px-3 py-2 text-left text-sm ${mode === value ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold" : "text-[var(--color-ink)] hover:bg-[var(--color-bg)]"}`}
                role="option"
                aria-selected={mode === value}
              >
                {tr(labelKey)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}