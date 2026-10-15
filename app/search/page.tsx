import { Suspense } from "react";
import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import SearchView from "@/components/SearchView";

export default function Search() {
  return (
    <>
      <Header />
      <Suspense>
        <SearchView />
      </Suspense>
      <MobileTabBar />
    </>
  );
}