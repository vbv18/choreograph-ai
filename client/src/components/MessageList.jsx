import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { dummyPrompts } from "../lib/data.js";
import MessageBubble from "./MessageBubble.jsx";

export default function MessageList({ onSelectPrompt }) {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages } = useSelector((state) => state.message);
  const messagesEndRef = useRef(null);

  const hasMessages = Array.isArray(messages) && messages.length > 0;

  useEffect(() => {
    if (hasMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, hasMessages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-h-0">
      {!hasMessages || !selectedConversation ? (
        <div className="h-full flex flex-col items-center justify-center gap-6 text-center select-none py-10">
          <div className="flex flex-col items-center gap-2 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/25 mb-1">
              CA
            </div>
            <h2 className="text-[20px] font-semibold text-slate-100 tracking-tight">
              Choreograph AI
            </h2>
            <p className="text-[14px] font-medium text-slate-400">
              How can I help you today?
            </p>
            <p className="text-[13px] text-slate-500 max-w-[280px] leading-relaxed">
              Ask me anything — code ideas, agent architectures, or general
              technical questions.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
            {dummyPrompts.map((prompt, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectPrompt?.(prompt)}
                className="text-[12px] font-medium text-slate-300 bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/30 hover:bg-white/[0.07] px-3.5 py-2 rounded-xl transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg?._id || `${msg?.role || "msg"}-${index}`}
              role={msg?.role}
              content={msg?.content}
              images={msg?.images || []}
              artifacts={msg?.artifacts || []}
            />
          ))}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
