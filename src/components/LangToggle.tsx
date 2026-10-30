"use client"

import { useLang } from "@/lib/lang-context";
import { trackLangSwitch } from "@/lib/analytics";

export default function LangToggle() {
  const { lang, toggle } = useLang();
  const handleToggle = () => {
    const from = lang;
    toggle();
    const to = lang === "fr" ? "zh" : "fr";
    trackLangSwitch(from, to);
  };
  return (
    <button
      className="langbtn"
      onClick={handleToggle}
      aria-label="Changer de langue"
    >
      {lang === "fr" ? "FR" : "ZH"}
    </button>
  );
}