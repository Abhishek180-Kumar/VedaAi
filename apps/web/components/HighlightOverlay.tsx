import type { BBox } from "@/types/assessment";
import { forwardRef } from "react";

interface HighlightOverlayProps {
  bbox: BBox;
  label: string;
  active: boolean;
}

const HighlightOverlay = forwardRef<HTMLDivElement, HighlightOverlayProps>(
  ({ bbox, label, active }, ref) => {
    return (
      <div
        ref={ref}
        className={`absolute pointer-events-none border-2 rounded-md ${
          active ? "border-veda-orange bg-veda-orange/10 answer-highlight" : "border-veda-green/70 bg-veda-green/5"
        }`}
        style={{
          left: `${bbox.x * 100}%`,
          top: `${bbox.y * 100}%`,
          width: `${bbox.width * 100}%`,
          height: `${bbox.height * 100}%`
        }}
      >
        <span
          className={`absolute -top-6 left-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
            active ? "bg-veda-orange text-white" : "bg-veda-green text-white"
          }`}
        >
          {label}
        </span>
      </div>
    );
  }
);
HighlightOverlay.displayName = "HighlightOverlay";

export default HighlightOverlay;
