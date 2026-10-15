import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import HomeView from "@/components/HomeView";

export default function Home() {
  return (
    <>
      <Header isHome />
      <HomeView />
      <MobileTabBar />
    </>
  );
}