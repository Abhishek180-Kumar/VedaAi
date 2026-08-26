"use client";

import { X } from "lucide-react";
import { useState } from "react";
import {
  LayoutGrid,
  School,
  ClipboardList,
  FileText,
  Clock,
  Settings,
  Sparkles
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Home" },
  { icon: School, label: "My Classroom" },
  { icon: FileText, label: "Assignments" },
  { icon: ClipboardList, label: "Exams" },
  { icon: Clock, label: "My Library" }
];

interface MobileDrawerProps {
  open: boolean;
  activeLabel: string;
  onNavigate: (label: string) => void;
  onClose: () => void;
}

export default function MobileDrawer({ open, activeLabel, onNavigate, onClose }: MobileDrawerProps) {
  return (
    <>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-card transform transition-transform md:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2 font-bold text-lg">
                <span className="grid place-items-center w-7 h-7 rounded-md bg-veda-ink text-white text-sm">
                  V
                </span>
                VedaAI
              </div>
              <button aria-label="Close menu" onClick={onClose} className="text-veda-sub hover:text-veda-ink">
                <X size={20} />
              </button>
            </div>

            <div className="px-3">
              <button className="w-full flex items-center gap-2 justify-center bg-veda-ink text-white rounded-full py-2.5 text-sm font-medium">
                <Sparkles size={16} className="text-veda-orange" />
                {"AI Teacher's Toolkit"}
              </button>
            </div>

            <nav className="flex-1 mt-6 px-3 space-y-1">
              {NAV_ITEMS.map(({ icon: Icon, label }) => {
                const active = activeLabel === label;
                return (
                  <button
                    key={label}
                    onClick={() => {
                      onNavigate(label);
                      onClose();
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left ${
                      active
                        ? "bg-veda-orangeSoft text-veda-orange font-semibold"
                        : "text-veda-sub hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="px-3 pb-4 space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-veda-sub hover:bg-gray-50">
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                <span className="grid place-items-center w-8 h-8 rounded-full bg-veda-greenSoft text-veda-green text-xs font-bold">
                  DP
                </span>
                <div className="text-xs leading-tight">
                  <div className="font-semibold">Delhi Public School</div>
                  <div className="text-veda-sub">Bokaro Steel City</div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
