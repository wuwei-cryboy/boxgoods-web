import { getProducts } from "@/lib/catalog";
import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import ProductView from "@/components/ProductView";

export function generateStaticParams() {
  return getProducts().map(p => ({ id: p.id }));
}

export default async function Product({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <ProductView id={id} />
      <MobileTabBar />
    </>
  );
}
