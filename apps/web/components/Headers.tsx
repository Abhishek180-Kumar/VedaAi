"use client";

import { ArrowLeft, Bell, Sparkles, HelpCircle, Menu, FileText, User, ChevronDown } from "lucide-react";

export function TopHeader({
  breadcrumb = "Exams",
  onBack,
  showBack = true
}: {
  breadcrumb?: string;
  onBack?: () => void;
  showBack?: boolean;
}) {
  return (
    <header className="hidden md:flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-veda-sub">
        {showBack && (
          <button
            aria-label="Go back"
            onClick={onBack}
            className="text-veda-ink hover:opacity-70 transition-opacity mr-1"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <FileText size={14} className="text-veda-sub" />
        <span className="text-veda-ink font-medium">{breadcrumb}</span>
      </div>
      <div className="flex items-center gap-4">
        <button aria-label="Help" className="text-veda-sub hover:text-veda-ink">
          <HelpCircle size={18} />
        </button>
        <button aria-label="Notifications" className="relative text-veda-sub hover:text-veda-ink">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-veda-orange" />
        </button>
        <Sparkles size={18} className="text-veda-ink" />
        <button className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-full bg-gray-100 text-veda-sub">
            <User size={16} />
          </span>
          <span className="text-sm font-medium">Madhur Rastogi</span>
          <ChevronDown size={14} className="text-veda-sub" />
        </button>
      </div>
    </header>
  );
}

export function MobileHeader({
  onMenuClick,
  onBack,
  showBack = true
}: {
  onMenuClick?: () => void;
  onBack?: () => void;
  showBack?: boolean;
}) {
  return (
    <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white/70 backdrop-blur border-b border-veda-border">
      <div className="flex items-center gap-2">
        {showBack && (
          <button aria-label="Go back" onClick={onBack} className="text-veda-ink">
            <ArrowLeft size={18} />
          </button>
        )}
        <span className="font-bold">VedaAI</span>
      </div>
      <div className="flex items-center gap-3">
        <button aria-label="Notifications" className="relative text-veda-sub">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-veda-orange" />
        </button>
        <span className="grid place-items-center w-7 h-7 rounded-full bg-gray-100 text-veda-sub">
          <User size={14} />
        </span>
        <button aria-label="Menu" onClick={onMenuClick} className="text-veda-ink">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
