// lib/lang.ts
import type { Lang } from "./catalog";
import { t as translate } from "./catalog";
import { cookies, headers } from "next/headers";
import { 
  DEFAULT_LANG, 
  LANG_COOKIE_NAME, 
  LANG_COOKIE_MAX_AGE,
  parseAcceptLanguage,
  isSupportedLang 
} from "./i18n/config";

/** 从 Cookie 读取语言（Server Component 可用） */
export async function getLocale(): Promise<Lang> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LANG_COOKIE_NAME)?.value;
  if (cookieLocale && isSupportedLang(cookieLocale)) {
    return cookieLocale;
  }

  // 次选：从 Accept-Language 头自动检测
  const headersList = await headers();
  const acceptLang = headersList.get("accept-language");
  const detected = parseAcceptLanguage(acceptLang);
  if (detected) return detected;

  return DEFAULT_LANG;
}

/** Server Component 专用的翻译函数 */
export async function getTranslation(key: string): Promise<string> {
  const lang = await getLocale();
  return translate(lang, key);
}

/** 获取语言切换用的 Cookie 设置 */
export function getLocaleCookieOptions() {
  return {
    name: LANG_COOKIE_NAME,
    value: "",
    maxAge: LANG_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
  };
}

/** 导出支持的语言列表供组件使用 */
export { SUPPORTED_LANGS, DEFAULT_LANG } from "./i18n/config";