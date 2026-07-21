"use client";

import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import VisionBoard from "@/components/VisionBoard";

export default function VisionPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#141414" }}>
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto">
        <VisionBoard />
      </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
