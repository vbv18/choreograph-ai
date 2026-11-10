import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink, X, Code2 } from "lucide-react";
import { useDispatch } from "react-redux";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import {
  setArtifacts,
  setActiveArtifactIndex,
  setArtifactOpen,
} from "../redux/messageSlice.js";

export default function MessageBubble({
  role,
  content,
  images = [],
  artifacts = [],
}) {
  const dispatch = useDispatch();
  const isUser = role === "user";
  const [lightBox, setLightBox] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");

  async function handleCopyButton(code) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode("");
    }, 2000);
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`w-fit max-w-[92vw] md:max-w-[72%] px-4 py-2.5 rounded-2xl overflow-hidden leading-relaxed break-words
          ${
            isUser
              ? "bg-linear-to-br from-indigo-500 to-violet-700 text-white rounded-tr-sm"
              : "text-slate-200 rounded-tl-sm"
          }`}
      >
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                loading="lazy"
                onError={(e) => e.currentTarget.remove()}
                onClick={() => setLightBox(img)}
                className="w-40 h-28 rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition"
              />
            ))}
          </div>
        )}

        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mt-5 mb-3">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold mt-3 mb-2">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-3 whitespace-pre-wrap break-words">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-white/10">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-white/10 bg-white/5 px-3 py-2 text-left">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-white/10 px-3 py-2 text-center">
                {children}
              </td>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline inline-flex items-center gap-1"
              >
                {children}
                <ExternalLink size={14} />
              </a>
            ),
            code: ({ className, children }) => {
              const value = String(children).trim();

              if (!className) {
                return (
                  <code className="px-1.5 py-0.5 rounded bg-white/10 text-pink-400">
                    {value}
                  </code>
                );
              }

              const language = className?.replace("language-", "");

              return (
                <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-[#111318]">
                  <div className="flex items-center justify-between bg-[#1b1d24] p-2">
                    <span className="uppercase text-xs font-bold text-slate-400">
                      {language}
                    </span>
                    <button
                      onClick={() => handleCopyButton(value)}
                      className="flex items-center gap-1 text-xs"
                    >
                      {copiedCode === value ? (
                        <>
                          <Check size={14} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <SyntaxHighlighter
                    language={language}
                    style={atomOneDark}
                    wrapLongLines
                    showLineNumbers
                    customStyle={{
                      margin: 0,
                      padding: "16px",
                      background: "#0d1117",
                      fontSize: "13px",
                    }}
                  >
                    {value}
                  </SyntaxHighlighter>
                </div>
              );
            },
            img: ({ src }) => {
              if (!src) return null;

              return (
                <img
                  src={src}
                  loading="lazy"
                  onError={(e) => e.currentTarget.remove()}
                  onClick={() => setLightBox(src)}
                  className="w-84 h-64 rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition"
                />
              );
            },
          }}
        >
          {content || ""}
        </Markdown>

        {!isUser && Array.isArray(artifacts) && artifacts.length > 0 && (
          <div className="space-y-2 mt-3 pt-2 border-t border-white/[0.08]">
            {artifacts.map((art, artIdx) => (
              <div
                key={art?.id || artIdx}
                className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/30 transition-all"
              >
                {/* Header row: icon + title + Open Studio button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Code2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100 truncate">
                        {art?.title || "Code Artifact"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {art?.files?.length || 0}{" "}
                        {art?.files?.length === 1 ? "file" : "files"} •{" "}
                        {art?.framework || art?.language || "Code"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      dispatch(setArtifacts(artifacts));
                      dispatch(setActiveArtifactIndex(artIdx));
                      dispatch(setArtifactOpen(true));
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Studio</span>
                    <ExternalLink size={12} />
                  </button>
                </div>

                {/* Inline notes display */}
                {Array.isArray(art?.notes) && art.notes.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] space-y-1">
                    {art.notes.map((note, noteIdx) => (
                      <div
                        key={noteIdx}
                        className="text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-amber-400/70 shrink-0 mt-px">
                          •
                        </span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightBox && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out">
          <button
            onClick={() => setLightBox(null)}
            className="cursor-pointer absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 rounded-full p-2"
          >
            <X />
          </button>
          <img
            src={lightBox}
            className="max-w-[90vw] max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
