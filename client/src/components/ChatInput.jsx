import {
  Mic,
  Paperclip,
  Send,
  LoaderCircle,
  AlertCircle,
  Code2,
  MessageSquare,
  Zap,
  FileText,
  Presentation,
  ImageIcon,
  Search,
  Eye,
  X,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import sendMessage from "../features/sendMessage.js";
import createConversation from "../features/createConversation.js";
import editConversation from "../features/editConversation.js";
import { useDispatch, useSelector } from "react-redux";
import {
  addConversation,
  setConversationTitle,
  setSelectedConversation,
} from "../redux/conversationSlice.js";
import { addMessage, setArtifacts } from "../redux/messageSlice.js";
import { updateCredits } from "../redux/userSlice.js";

// ChatIput Component
export default function ChatInput({ initialPrompt, onResetPrompt }) {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dispatch = useDispatch();
  const { selectedConversation } = useSelector((state) => state.conversation);
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const lastConsumedPrompt = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    if (!initialPrompt) {
      lastConsumedPrompt.current = null;
      return;
    }

    if (lastConsumedPrompt.current === initialPrompt) return;

    lastConsumedPrompt.current = initialPrompt;

    setValue(initialPrompt);
    onResetPrompt?.();
  }, [initialPrompt, onResetPrompt]);

  async function handleSendMessage() {
    const prompt = value.trim();

    if (!prompt || isLoading) return;

    setIsLoading(true);
    setErrorMessage("");
    setValue("");

    try {
      let currentConv = selectedConversation;

      if (!currentConv?._id) {
        const newConv = await createConversation();
        if (newConv && newConv._id) {
          dispatch(addConversation(newConv));
          dispatch(setSelectedConversation(newConv));
          currentConv = newConv;
        } else {
          throw new Error("Unable to create a new conversation");
        }
      }

      if (currentConv && currentConv.title === "New Chat") {
        const truncatedTitle =
          prompt.length > 20 ? prompt.slice(0, 20) + "..." : prompt;
        await editConversation(currentConv._id, truncatedTitle);
        dispatch(
          setConversationTitle({
            conversationId: currentConv._id,
            newTitle: truncatedTitle,
          }),
        );
      }

      dispatch(
        addMessage({
          role: "user",
          content: prompt,
        }),
      );

      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("conversationId", currentConv?._id);
      formData.append("agent", selectedAgent.toLowerCase().trim());
      for (const file of selectedFiles) {
        formData.append("files", file);
      }
      setSelectedFiles([]);
      if (fileRef.current) fileRef.current.value = "";

      const data = await sendMessage(formData);

      if (data) {
        if (data.credits) {
          dispatch(updateCredits(data.credits));
        }

        const receivedArtifacts = Array.isArray(data?.artifacts)
          ? data.artifacts
          : Array.isArray(data?.artifact)
            ? data.artifact
            : data?.artifact
              ? [data.artifact]
              : [];

        dispatch(
          addMessage({
            role: "assistant",
            content: data.answer,
            images: data.images || [],
            artifacts: receivedArtifacts,
          }),
        );

        if (receivedArtifacts.length > 0) {
          dispatch(setArtifacts(receivedArtifacts));
        }
      }
    } catch (error) {
      console.error("[Chat-Input-Error]", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      setValue(prompt);
      setErrorMessage(
        error?.response?.data?.message ||
        "Unable to send message. Please ensure backend services are running.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const agents = [
    {
      id: "auto",
      icon: Zap,
      label: "Auto",
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat",
    },
    {
      id: "coding",
      icon: Code2,
      label: "Coding",
    },
    {
      id: "image",
      icon: ImageIcon,
      label: "Image",
    },
    {
      id: "pdf",
      icon: FileText,
      label: "PDF",
    },
    {
      id: "ppt",
      icon: Presentation,
      label: "PPT",
    },
    {
      id: "search",
      icon: Search,
      label: "Search",
    },
    {
      id: "vision",
      icon: Eye,
      label: "Vision",
    },
    {
      id: "pdfRAG",
      icon: FileText,
      label: "PDF RAG",
    },
  ];

  return (
    <div className="w-full overflow-hidden px-3 md:px-6 py-4 border-t border-white/[0.06] bg-[#0d0f14] shrink-0">
      {errorMessage && (
        <div className="max-w-4xl mx-auto mb-2.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={14} className="shrink-0 text-rose-400" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] focus-within:border-white/[0.14] focus-within:bg-white/[0.04] rounded-2xl px-4 pt-3.5 pb-3 transition-colors">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 py-2">
            {selectedFiles.map((file, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-white/[0.08] text-xs text-slate-300"
              >
                {
                  file.type === "application/pdf" ? (
                    <FileText size={14} />
                  ) : file.type.startsWith("image/") ? (
                    <ImageIcon size={14} />
                  ) : (
                    <FileText size={14} />
                  )
                }

                <span className="max-w-[160px] truncate">
                  {file.name}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))
                  }
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex w-full gap-2 pr-2 flex-wrap">
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.id;
            const Icon = agent.icon;

            return (
              <div
                key={agent.id}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer
                ${isActive
                    ? "bg-linear-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_1px_8px_rgba(99,102,241,.35)]"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07]"
                  }
              `}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <Icon
                  size={14}
                  className={`${isActive ? "text-white" : "text-slate-500"}`}
                />
                {agent.label}
              </div>
            );
          })}
        </div>

        <textarea
          aria-label="Message prompt"
          placeholder="Ask me anything..."
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          className="w-full bg-transparent pt-4 outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Paper-Clip Button */}
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              hidden
              ref={fileRef}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setSelectedFiles((prev) => [...prev, ...files]);
              }}
            />
            <button
              type="button"
              title="Attach file"
              aria-label="Attach file"
              disabled={isLoading}
              onClick={() => fileRef.current.click()}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 cursor-pointer"
            >
              <Paperclip size={15} />
            </button>
            {/* MicroPhone Button */}
            <button
              type="button"
              title="Voice input"
              aria-label="Voice input"
              disabled={isLoading}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 cursor-pointer"
            >
              <Mic size={15} />
            </button>
          </div>

          <button
            type="button"
            title={isLoading ? "Sending message..." : "Send message"}
            aria-label={isLoading ? "Sending message" : "Send message"}
            disabled={!value.trim() || isLoading}
            onClick={handleSendMessage}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border-none transition-all duration-150 ${value.trim() && !isLoading
              ? "bg-linear-to-br from-indigo-500 to-violet-700 hover:opacity-90 text-white cursor-pointer"
              : "bg-white/[0.05] text-slate-600 cursor-not-allowed"
              }`}
          >
            {isLoading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
