import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-dvh w-full flex items-center justify-center bg-[#0d0f14] text-white p-4">
      <div className="w-full max-w-md bg-[#13151c] border border-white/[0.08] rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Subtle background glow accents */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 shadow-inner">
          <AlertCircle size={28} />
        </div>

        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full mb-3">
          404 Not Found
        </span>

        <h1 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">
          Page Not Found
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
          The page or link you are trying to access doesn&apos;t exist or has
          been moved.
        </p>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-linear-to-br from-indigo-500 to-violet-700 hover:from-indigo-600 hover:to-violet-800 transition-all shadow-md shadow-indigo-700/25 cursor-pointer"
          >
            <Home size={16} />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
