import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Code2,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  PanelRightClose,
  FileCode,
  FileText,
  FileJson,
  Layers,
  Sparkles,
  FolderTree,
} from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import {
  setArtifactOpen,
  setActiveArtifactIndex,
  setActiveFileIndex,
} from "../redux/messageSlice.js";

// Helper to deduce language for syntax highlighter
function getLanguageFromFilename(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "html":
      return "html";
    case "css":
    case "scss":
      return "css";
    case "json":
      return "json";
    case "py":
      return "python";
    case "cpp":
    case "c":
    case "h":
    case "hpp":
      return "cpp";
    case "sql":
      return "sql";
    case "sh":
    case "bash":
      return "bash";
    case "md":
      return "markdown";
    default:
      return "javascript";
  }
}

// Helper to get file icon based on extension
function getFileIcon(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["json"].includes(ext))
    return <FileJson size={14} className="text-amber-400" />;
  if (["md", "txt"].includes(ext))
    return <FileText size={14} className="text-slate-400" />;
  if (["html"].includes(ext))
    return <Code2 size={14} className="text-orange-400" />;
  if (["css", "scss"].includes(ext))
    return <Code2 size={14} className="text-sky-400" />;
  return <FileCode size={14} className="text-indigo-400" />;
}

// Task Type badge colors and styling
function getTaskTypeStyle(taskType = "") {
  const normalized = taskType.toLowerCase();
  switch (normalized) {
    case "web":
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    case "fullstack":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case "backend":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    case "dsa":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "app":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default:
      return "bg-white/[0.06] text-slate-300 border-white/10";
  }
}

function downloadSingleFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.split("/").pop() || "code.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Artifact() {
  const dispatch = useDispatch();
  const { artifacts, isArtifactOpen, activeArtifactIndex, activeFileIndex } =
    useSelector((state) => state.message);

  const [copiedFile, setCopiedFile] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const artifactList = useMemo(() => {
    return Array.isArray(artifacts) ? artifacts : artifacts ? [artifacts] : [];
  }, [artifacts]);

  const currentArtifact = artifactList[activeArtifactIndex] || artifactList[0];
  const files = currentArtifact?.files || [];
  const currentFile = files[activeFileIndex] || files[0];

  const currentLanguage = currentFile?.name
    ? getLanguageFromFilename(currentFile.name)
    : "javascript";

  const lineCount = currentFile?.content
    ? currentFile.content.split("\n").length
    : 0;

  async function handleCopyCurrentFile() {
    if (!currentFile?.content) return;
    await navigator.clipboard.writeText(currentFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  }

  async function handleCopyAllFiles() {
    if (!files.length) return;
    const combined = files
      .map(
        (f) =>
          `// ==========================================\n// File: ${f.name}\n// ==========================================\n\n${f.content}\n`,
      )
      .join("\n\n");
    await navigator.clipboard.writeText(combined);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function handleDownloadCurrent() {
    if (!currentFile?.content) return;
    downloadSingleFile(currentFile.name, currentFile.content);
  }

  // Panel closed — Nav.jsx Artifacts button handles re-opening
  if (!isArtifactOpen) {
    return null;
  }

  return (
    <aside
      className={`h-full border-l border-white/[0.06] flex flex-col overflow-hidden shrink-0 bg-[#0a0c10] transition-all duration-300 z-20 ${
        isFullscreen
          ? "fixed inset-0 w-full z-50 bg-[#0a0c10]"
          : "w-full sm:w-[480px] md:w-[540px] xl:w-[620px]"
      }`}
    >
      {/* Top Header */}
      <div className="h-14 px-4 border-b border-white/[0.06] bg-[#0d0f14] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
            <Code2 size={16} />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
                {currentArtifact?.title || "Artifact Studio"}
              </h2>

              {currentArtifact?.taskType && (
                <span
                  className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded border tracking-wide ${getTaskTypeStyle(
                    currentArtifact.taskType,
                  )}`}
                >
                  {currentArtifact.taskType}
                </span>
              )}
            </div>

            {currentArtifact && (
              <span className="text-[11px] text-slate-400 font-mono truncate">
                {currentArtifact.framework ||
                  currentArtifact.language ||
                  "Multi-file"}
                {files.length > 0 &&
                  ` • ${files.length} ${files.length === 1 ? "file" : "files"}`}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {currentFile && (
            <>
              <button
                onClick={handleCopyCurrentFile}
                title="Copy current file content"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-colors cursor-pointer"
              >
                {copiedFile ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadCurrent}
                title={`Download ${currentFile.name}`}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Download size={14} />
              </button>
            </>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            onClick={() => dispatch(setArtifactOpen(false))}
            title="Collapse Artifacts"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
          >
            <PanelRightClose size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!currentArtifact ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0c10]">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/5">
            <FolderTree size={28} />
          </div>

          <h3 className="text-base font-semibold text-slate-200 mb-2">
            No Code Artifacts Yet
          </h3>

          <p className="text-xs text-slate-400 max-w-[320px] leading-relaxed mb-6">
            When you ask Choreograph AI to generate code, multi-file
            applications, or algorithms, your interactive code workspace and
            files will emerge here.
          </p>

          <div className="w-full max-w-[320px] p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
              <Sparkles size={13} className="text-amber-400" />
              <span>Try asking:</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1.5 pl-4 list-disc">
              <li>"Build a modern React counter component"</li>
              <li>"Create a complete Kanban board with Vite"</li>
              <li>"Write a fullstack auth API in Express"</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Active Artifact Workspace */
        <div className="flex-1 flex flex-col min-h-0 bg-[#0a0c10]">
          {/* Multi-Artifact switcher if conversation produced more than 1 artifact */}
          {artifactList.length > 1 && (
            <div className="px-3 py-2 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider shrink-0">
                Versions:
              </span>
              {artifactList.map((art, idx) => (
                <button
                  key={art.id || idx}
                  onClick={() => dispatch(setActiveArtifactIndex(idx))}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    activeArtifactIndex === idx
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]"
                  }`}
                >
                  {art.title || `Artifact ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* File Tab Bar */}
          <div className="px-3 py-2 bg-[#0d0f14] border-b border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
              {files.map((file, idx) => {
                const isActive = activeFileIndex === idx;
                const fileNameOnly = file.name?.split("/").pop() || file.name;

                return (
                  <button
                    key={file.name || idx}
                    onClick={() => dispatch(setActiveFileIndex(idx))}
                    title={file.name}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer border ${
                      isActive
                        ? "bg-[#161a23] text-indigo-300 border-indigo-500/30 shadow-sm"
                        : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border-transparent"
                    }`}
                  >
                    {getFileIcon(file.name)}
                    <span className="truncate max-w-[150px]">
                      {fileNameOnly}
                    </span>
                  </button>
                );
              })}
            </div>

            {files.length > 1 && (
              <button
                onClick={handleCopyAllFiles}
                title="Copy all project files"
                className="text-[11px] font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copiedAll ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">All Copied</span>
                  </>
                ) : (
                  <>
                    <Layers size={12} />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Active File Meta Bar */}
          {currentFile && (
            <div className="px-4 py-1.5 bg-[#0e1117] border-b border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
              <span className="truncate text-slate-400">
                {currentFile.name}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span>{lineCount} lines</span>
                <span className="uppercase text-[10px] bg-white/[0.04] px-1.5 py-0.5 rounded text-slate-400">
                  {currentLanguage}
                </span>
              </div>
            </div>
          )}

          {/* Code Viewer */}
          <div className="flex-1 overflow-auto bg-[#0a0d14] relative">
            {currentFile?.content ? (
              <SyntaxHighlighter
                language={currentLanguage}
                style={atomOneDark}
                showLineNumbers
                wrapLongLines={false}
                customStyle={{
                  margin: 0,
                  padding: "16px",
                  background: "#0a0d14",
                  fontSize: "12.5px",
                  lineHeight: "1.65",
                  fontFamily:
                    "JetBrains Mono, ui-monospace, SFMono-Regular, monospace",
                  minHeight: "100%",
                }}
                lineNumberStyle={{
                  color: "#4a5568",
                  paddingRight: "16px",
                  userSelect: "none",
                }}
              >
                {currentFile.content}
              </SyntaxHighlighter>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Empty file.
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
