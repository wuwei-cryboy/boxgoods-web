"use client";

import * as XLSX from "xlsx";
import { getCart } from "./cart";
import { useLang } from "@/lib/lang-context";

export function exportCartToXLSX(filename = "quote-request.xlsx") {
  const cart = getCart();
  if (cart.length === 0) return;

  const { lang } = useLang();
  const isZh = lang === "zh";

  const headers = isZh
    ? ["商品ID", "商品名称", "品类", "数量", "参考价格", "货币", "MOQ", "箱规", "备注"]
    : ["Produit ID", "Nom", "Catégorie", "Quantité", "Prix réf.", "Devise", "MOQ", "Conditionnement", "Note"];

  const rows = cart.map((item) => {
    const p = item.product;
    return [
      p.id,
      isZh ? p.nameZh : p.nameFr,
      p.cat,
      item.qty,
      p.priceMin ?? "",
      p.currency || "USD",
      p.moq ?? "",
      p.boxSpec ?? "",
      item.note || "",
    ];
  });

  // 统计行
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalAmount = cart.reduce((s, i) => s + (i.product.priceMin || 0) * i.qty, 0);
  rows.push([
    "",
    isZh ? "合计" : "Total",
    "",
    totalQty,
    totalAmount,
    cart[0]?.product.currency || "USD",
    "",
    "",
    "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // 列宽
  ws["!cols"] = [
    { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 10 },
    { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 30 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isZh ? "询价单" : "Devis");
  XLSX.writeFile(wb, filename);
}

export function generateInquiryText(): string {
  const cart = getCart();
  if (cart.length === 0) return "";

  const { lang } = useLang();
  const isZh = lang === "zh";

  let text = isZh ? "询价单\n\n" : "Demande de devis\n\n";
  text += isZh ? `共 ${cart.length} 个商品，总数量 ${cart.reduce((s, i) => s + i.qty, 0)}\n\n` : `${cart.length} produits, qté totale ${cart.reduce((s, i) => s + i.qty, 0)}\n\n`;

  cart.forEach((item, idx) => {
    const p = item.product;
    text += `${idx + 1}. ${isZh ? p.nameZh : p.nameFr} (${p.id})\n`;
    text += `   Catégorie: ${p.cat}\n`;
    text += `   Quantité: ${item.qty}\n`;
    if (p.priceMin) text += `   Prix réf.: ${p.priceMin} ${p.currency || "USD"}\n`;
    text += `   MOQ: ${p.moq}\n`;
    text += `   Conditionnement: ${p.boxSpec}\n`;
    if (item.note) text += `   Note: ${item.note}\n`;
    text += "\n";
  });

  text += isZh ? "请报价，谢谢。" : "Merci de nous faire un devis.";
  return text;
}

export function copyInquiryToClipboard() {
  const text = generateInquiryText();
  if (text) navigator.clipboard.writeText(text);
}