import { NextRequest, NextResponse } from "next/server";
import { getProductsPaginated } from "@/lib/catalog";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  cat: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
  lang: z.enum(["fr", "zh"]).default("fr"),
});

function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "参数无效", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { q, cat, page, limit, sort, lang } = parsed.data;

  // 使用通用分页查询
  const { data: products, pagination } = await getProductsPaginated({
    query: q,
    category: cat,
    sortBy: sort,
    page,
    limit,
    lang,
  });

  // 高亮
  const results = products.map((p) => ({
    id: p.id,
    cat: p.cat,
    image: p.image,
    nameFr: p.nameFr,
    nameZh: p.nameZh,
    nameFrHighlighted: highlight(p.nameFr, q),
    nameZhHighlighted: highlight(p.nameZh || "", q),
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    currency: p.currency,
    moq: p.moq,
    boxSpec: p.boxSpec,
  }));

  return NextResponse.json({
    success: true,
    data: results,
    pagination,
    query: { q, cat, sort, lang },
  });
}