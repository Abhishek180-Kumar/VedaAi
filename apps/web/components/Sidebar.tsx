"use client";

import {
  LayoutGrid,
  School,
  ClipboardList,
  FileText,
  Clock,
  Settings,
  Sparkles,
  PanelLeft,
  Shield
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Home" },
  { icon: School, label: "My Classroom" },
  { icon: FileText, label: "Assignments" },
  { icon: ClipboardList, label: "Exams" },
  { icon: Clock, label: "My Library" }
];

interface SidebarProps {
  activeLabel: string;
  onNavigate: (label: string) => void;
}

export default function Sidebar({ activeLabel, onNavigate }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 bg-white rounded-xl2 shadow-card m-[11px] ml-[10px] mb-[11px] transition-all ${
        expanded ? "w-[248px]" : "w-16"
      }`}
      style={{ height: "calc(100vh - 22px)" }}
    >
      <div className="flex items-center justify-between px-4 py-4">
        {expanded ? (
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="grid place-items-center w-7 h-7 rounded-md bg-veda-ink text-white text-sm">
              V
            </span>
            VedaAI
          </div>
        ) : (
          <span className="grid place-items-center w-7 h-7 rounded-md bg-veda-ink text-white text-sm mx-auto">
            V
          </span>
        )}
        {expanded && (
          <button
            aria-label="Collapse sidebar"
            onClick={() => setExpanded(false)}
            className="text-veda-sub hover:text-veda-ink"
          >
            <PanelLeft size={18} />
          </button>
        )}
      </div>

      {!expanded && (
        <button
          aria-label="Expand sidebar"
          onClick={() => setExpanded(true)}
          className="mx-auto mb-2 text-veda-sub hover:text-veda-ink"
        >
          <PanelLeft size={18} />
        </button>
      )}

      <div className="px-3">
        <button className="w-full flex items-center gap-2 justify-center bg-veda-ink text-white border-2 border-veda-orange rounded-full py-2.5 text-sm font-medium">
          <Sparkles size={16} className="text-veda-orange" />
          {expanded && "AI Teacher's Toolkit"}
        </button>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label }) => {
          const active = activeLabel === label;
          return (
            <button
              key={label}
              onClick={() => onNavigate(label)}
              aria-current={active ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left ${
                active
                  ? "bg-veda-orangeSoft text-veda-orange font-semibold"
                  : "text-veda-sub hover:bg-gray-50"
              }`}
            >
              <Icon size={18} />
              {expanded && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-2">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-veda-sub hover:bg-gray-50">
          <Settings size={18} />
          {expanded && <span>Settings</span>}
        </button>
        {expanded && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-veda-greenSoft text-veda-green">
              <Shield size={16} />
            </span>
            <div className="text-xs leading-tight">
              <div className="font-semibold">Delhi Public School</div>
              <div className="text-veda-sub">Bokaro Steel City</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
