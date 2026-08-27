"use client";

import { Sparkles } from "lucide-react";
import type { ProcessingStage } from "@/types/assessment";

export default function ProcessingScreen({ stage }: { stage: ProcessingStage }) {
  void stage; // kept for prop compatibility; Figma design shows one static loading state

  return (
    <div className="flex-1 flex items-center justify-center bg-white rounded-xl3 m-2 md:m-4">
      <div className="text-center px-6">
        <div className="mx-auto mb-4 w-16 h-16 grid place-items-center">
          <Sparkles size={48} className="text-veda-orange animate-pulse" />
        </div>
        <h2 className="text-xl font-bold">Extracting…</h2>
        <p className="text-sm text-veda-sub mt-1">This may take a while</p>
      </div>
    </div>
  );
}
