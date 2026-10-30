
import { ShieldCheck } from "lucide-react";

export default function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} GIC Whistleblower. All rights reserved.
        </p>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Administration Portal</span>
        </div>
      </div>
    </footer>
  );
}
