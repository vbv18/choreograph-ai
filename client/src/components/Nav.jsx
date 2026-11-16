import {
  MessageSquare,
  Code2,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleArtifactOpen } from "../redux/messageSlice.js";

export default function Nav() {
  const dispatch = useDispatch();
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages, artifacts, isArtifactOpen } = useSelector(
    (state) => state.message,
  );

  const hasArtifacts = Array.isArray(artifacts) && artifacts.length > 0;

  return (
    <div className="h-14 flex items-center justify-between pl-12 pr-4 lg:px-6 border-b border-white/[0.06] bg-[#0d0f14] shrink-0 select-none">
      <div className="flex items-center gap-2.5 min-w-0 pl-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
          <MessageSquare size={13} className="text-indigo-400" />
        </div>

        <h1 className="text-[14px] font-semibold text-slate-100 tracking-tight truncate">
          {selectedConversation?.title?.trim() || "New Chat"}
        </h1>

        {selectedConversation && (
          <span className="text-[10px] font-medium text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full shrink-0">
            {messages?.length ?? 0}{" "}
            {messages?.length === 1 ? "Message" : "Messages"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(toggleArtifactOpen())}
          title={isArtifactOpen ? "Close Artifacts" : "Open Artifacts"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${hasArtifacts
            ? isArtifactOpen
              ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
              : "bg-white/[0.04] text-slate-300 hover:text-white border-white/[0.08] hover:border-indigo-500/30"
            : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border-white/[0.06]"
            }`}
        >
          <Code2
            size={13}
            className={hasArtifacts ? "text-indigo-400" : "text-slate-400"}
          />
          <span className="hidden sm:inline">Artifacts</span>
          {hasArtifacts && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              {artifacts.length}
            </span>
          )}
          {isArtifactOpen ? (
            <PanelRightClose size={13} className="text-slate-400 ml-0.5" />
          ) : (
            <PanelRightOpen size={13} className="text-slate-400 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
