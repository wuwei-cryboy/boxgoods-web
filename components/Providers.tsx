"use client";
import { LangProvider } from "@/lib/lang-context";
import { ReactNode } from "react";
export default function Providers({ children }: { children: ReactNode }) {
  return <LangProvider>{children}</LangProvider>;
}