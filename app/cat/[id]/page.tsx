import { getCategories } from "@/lib/catalog";
import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import CatView from "@/components/CatView";

export function generateStaticParams() {
  return getCategories().map(c => ({ id: c.id }));
}

export default async function CatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <CatView id={id} />
      <MobileTabBar />
    </>
  );
}
