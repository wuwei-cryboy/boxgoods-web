"use client";
import { useEffect } from "react";

export default function A11yAudit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    // 动态导入 axe-core，避免生产环境打包
    import("axe-core").then((module) => {
      const axe = module.default || module;
      // 10秒后开始审计，给页面留出渲染时间
      const timer = setTimeout(() => {
        axe.run(document, {}, (results) => {
          if (results.violations.length > 0) {
            console.group("♿ Accessibility Violations");
            results.violations.forEach((violation) => {
              console.warn(`[${violation.impact}] ${violation.id}: ${violation.description}`);
              console.log("Nodes:", violation.nodes.map(n => n.target).join(", "));
              console.log("Help:", violation.helpUrl);
            });
            console.groupEnd();
          } else {
            console.log("♿ No accessibility violations found ✓");
          }
        });
      }, 10000);

      return () => clearTimeout(timer);
    }).catch(() => {
      // axe-core 未安装时静默忽略
    });
  }, []);

  return null;
}