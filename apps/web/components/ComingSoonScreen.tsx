import { Construction } from "lucide-react";

export default function ComingSoonScreen({ pageName }: { pageName: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <span className="grid place-items-center w-14 h-14 rounded-full bg-veda-orangeSoft text-veda-orange mb-4">
        <Construction size={26} />
      </span>
      <h1 className="text-xl font-bold">{pageName}</h1>
      <p className="text-sm text-veda-sub mt-2 max-w-xs">
        This section is outside the scope of this assignment. The functional
        part of the app is under <span className="font-semibold text-veda-ink">Exams</span> —
        that&apos;s where question extraction and answer mapping happen.
      </p>
    </div>
  );
}
