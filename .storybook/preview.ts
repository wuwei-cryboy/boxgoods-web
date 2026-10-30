import type { Preview } from "@storybook/react";
import React from "react";
import { ThemeProvider } from "next-themes";
import { LangProvider } from "@/lib/lang-context";

// 全局样式（复用项目的 CSS 变量）
import "@/app/globals.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#f5f6f4" },
        { name: "dark", value: "#1c1f1d" },
        { name: "brand", value: "#0F5132" },
      ],
    },
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
        ],
      },
    },
    // 视觉回归：配置截图选项
    chromatic: {
      disableSnapshot: false,
      viewports: [375, 768, 1280],
      diffThreshold: 0.2,
    },
  },
  globalTypes: {
    // 主题切换
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: ["light", "dark", "system"],
        showName: true,
        dynamicTitle: true,
      },
    },
    // 语言切换
    locale: {
      name: "Locale",
      description: "UI language",
      defaultValue: "fr",
      toolbar: {
        icon: "globe",
        items: [
          { value: "fr", title: "Français" },
          { value: "zh", title: "中文" },
        ],
        showName: true,
      },
    },
    // 色盲模式
    colorblind: {
      name: "Colorblind",
      description: "Colorblind simulation mode",
      defaultValue: "none",
      toolbar: {
        icon: "eye",
        items: [
          { value: "none", title: "Normal" },
          { value: "protanopia", title: "Protanopia (Red-blind)" },
          { value: "deuteranopia", title: "Deuteranopia (Green-blind)" },
          { value: "tritanopia", title: "Tritanopia (Blue-blind)" },
          { value: "achromatopsia", title: "Achromatopsia (Monochrome)" },
        ],
        showName: true,
      },
    },
  },
  decorators: [
    // 主题装饰器
    (Story, context) => {
      const theme = context.globals.theme || "light";
      return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={theme === "system"}>
          <div className={theme === "dark" ? "dark" : theme === "light" ? "" : theme} style={{ minHeight: "100vh" }}>
            <Story {...context} />
          </div>
        </ThemeProvider>
      );
    },
    // 语言装饰器
    (Story, context) => {
      const locale = context.globals.locale || "fr";
      return (
        <LangProvider initialLang={locale as "fr" | "zh"}>
          <Story {...context} />
        </LangProvider>
      );
    },
    // 色盲模式装饰器（通过 CSS filter 模拟）
    (Story, context) => {
      const mode = context.globals.colorblind || "none";
      const filters: Record<string, string> = {
        none: "none",
        protanopia: "url(#protanopia)",
        deuteranopia: "url(#deuteranopia)",
        tritanopia: "url(#tritanopia)",
        achromatopsia: "grayscale(1)",
      };
      return (
        <div style={{ filter: filters[mode] || "none" }}>
          {/* SVG 滤镜定义 */}
          <svg style={{ position: "absolute", width: 0, height: 0 }}>
            <defs>
              <filter id="protanopia">
                <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0" />
              </filter>
              <filter id="deuteranopia">
                <feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0" />
              </filter>
              <filter id="tritanopia">
                <feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0" />
              </filter>
            </defs>
          </svg>
          <Story {...context} />
        </div>
      );
    },
  ],
};

export default preview;