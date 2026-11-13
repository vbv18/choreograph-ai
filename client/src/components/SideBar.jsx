import {
  Check,
  Coins,
  Loader2,
  LogOut,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import getConversations from "../features/getConversations.js";
import createConversation from "../features/createConversation.js";
import editConversation from "../features/editConversation.js";
import deleteConversation from "../features/deleteConversation.js";
import logout from "../features/logout.js";
import {
  addConversation,
  deleteConversation as deleteConversationAction,
  setConversations,
  setSelectedConversation,
  setConversationTitle,
} from "../redux/conversationSlice.js";
import { setUserData } from "../redux/userSlice.js";
import BillingModal from "./BillingModal.jsx";
import { PLANS } from "../lib/data.js";

export default function SideBar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState(null);
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingConvId, setDeletingConvId] = useState(null);
  const [showBilling, setShowBilling] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const dispatch = useDispatch();
  const { conversations, selectedConversation } = useSelector(
    (state) => state.conversation,
  );
  const { userData } = useSelector((state) => state.user);

  const safeConversations = Array.isArray(conversations)
    ? conversations.filter(Boolean)
    : [];

  const plan = PLANS[userData?.planId] ?? PLANS["free"];
  const credits = userData?.credits ?? plan.credits;

  useEffect(() => {
    let isMounted = true;
    async function fetchConversations() {
      try {
        const data = await getConversations();
        if (isMounted && data) {
          dispatch(setConversations(Array.isArray(data) ? data : []));
        }
      } catch {
        // Retry
        try {
          const data = await getConversations();
          if (isMounted && data) {
            dispatch(setConversations(Array.isArray(data) ? data : []));
          }
        } catch (error) {
          console.error("[Fetch-Conversations-Error]", {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });
        }
      }
    }
    fetchConversations();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  async function handleCreateConversation() {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const data = await createConversation();
      if (data && data._id) {
        dispatch(addConversation(data));
        dispatch(setSelectedConversation(data));
        setIsMobileOpen(false);
      }
    } catch {
      // Creation error handled gracefully
    } finally {
      setIsCreating(false);
    }
  }

  function handleSelectConversation(conv) {
    if (!conv) return;
    dispatch(setSelectedConversation(conv));
    setIsMobileOpen(false);
  }

  function handleStartEdit(conv, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingConvId(conv._id);
    setEditingTitle(conv?.title?.trim() || "New Chat");
  }

  function handleCancelEdit(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingConvId(null);
    setEditingTitle("");
  }

  async function handleSaveEdit(convId, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      return;
    }
    setIsSavingEdit(true);
    try {
      const updated = await editConversation(convId, trimmed);
      if (updated && updated._id) {
        dispatch(setConversationTitle(updated));
      } else {
        dispatch(setConversationTitle({ _id: convId, title: trimmed }));
      }
      setEditingConvId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("[Edit-Conversation-Error]", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteConversation(convId, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (deletingConvId) return;
    setDeletingConvId(convId);
    try {
      const res = await deleteConversation(convId);
      if (res) {
        dispatch(deleteConversationAction(convId));
      }
    } catch (error) {
      console.error("[Delete-Conversation-Error]", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    } finally {
      setDeletingConvId(null);
    }
  }

  async function handleLogOut() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
      dispatch(setUserData(null));
    } catch (error) {
      console.error("[Logout Error]", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      alert("LogOut Failed! Try again later.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  const showAvatar =
    Boolean(userData?.avatar) && failedAvatarUrl !== userData?.avatar;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile floating toggle trigger when sidebar is closed */}
      {!isMobileOpen && (
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open sidebar"
          className="fixed top-3 left-3 z-30 lg:hidden p-2 rounded-xl bg-[#12141c] text-slate-400 hover:text-slate-100 border border-white/[0.08] shadow-lg shadow-black/40 transition-colors"
        >
          <PanelLeft size={18} />
        </button>
      )}

      {/* Main Sidebar */}
      <aside
        aria-label="Sidebar navigation"
        className={`fixed lg:static inset-y-0 left-0 z-50 h-screen shrink-0 bg-[#0c0d12] border-r border-white/[0.07] flex flex-col justify-between transition-all duration-200 ease-in-out select-none
                    ${isMobileOpen ? "translate-x-0 w-[270px]" : "-translate-x-full lg:translate-x-0"}
                    ${isCollapsed ? "lg:w-[68px]" : "lg:w-[260px]"}
                `}
      >
        {/* Header Section */}
        <div className="flex flex-col shrink-0">
          <div className="h-14 px-3.5 flex items-center justify-between border-b border-white/[0.06]">
            {isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="hidden lg:flex w-10 h-10 mx-auto items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50"
              >
                <PanelLeftOpen size={18} />
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-xs shadow-indigo-500/30 shrink-0">
                    CA
                  </div>
                  <span className="text-[14.5px] font-semibold text-slate-100 tracking-tight truncate">
                    Choreograph AI
                  </span>
                  <span className="text-[10px] font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                    {userData?.plan || "free"}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Desktop collapse button */}
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(true)}
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                    className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50"
                  >
                    <PanelLeftClose size={17} />
                  </button>

                  {/* Mobile close button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    title="Close sidebar"
                    aria-label="Close sidebar"
                    className="flex lg:hidden w-7 h-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* New Chat Action */}
          <div className="p-3">
            {isCollapsed ? (
              <button
                type="button"
                onClick={handleCreateConversation}
                disabled={isCreating}
                title="New chat"
                aria-label="New chat"
                className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                ) : (
                  <Plus size={18} />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateConversation}
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-[13px] font-medium text-white bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 rounded-xl shadow-xs shadow-indigo-950/60 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Plus size={15} />
                )}
                <span>New Chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-h-0">
          {!isCollapsed && (
            <div className="px-2 pt-2 pb-1.5 text-[11px] font-medium text-slate-500">
              Recent chats
            </div>
          )}

          <nav
            className="flex flex-col gap-0.5"
            aria-label="Recent conversations"
          >
            {safeConversations.length === 0
              ? !isCollapsed && (
                  <div className="px-3 py-6 text-center flex flex-col items-center justify-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-500">
                      <MessageSquare size={14} />
                    </div>
                    <p className="text-[12px] font-medium text-slate-400">
                      No chats yet
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-[170px]">
                      Start a new conversation to build or query agents.
                    </p>
                  </div>
                )
              : safeConversations.map((conv) => {
                  const isActive = selectedConversation?._id === conv?._id;
                  const title = conv?.title?.trim() || "New Chat";

                  if (isCollapsed) {
                    return (
                      <button
                        key={conv._id}
                        type="button"
                        onClick={() => handleSelectConversation(conv)}
                        title={title}
                        aria-label={title}
                        aria-current={isActive ? "page" : undefined}
                        className={`w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50
                                                ${
                                                  isActive
                                                    ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                                                }`}
                      >
                        <MessageSquare size={16} />
                      </button>
                    );
                  }

                  const isEditing = editingConvId === conv._id;
                  const isDeleting = deletingConvId === conv._id;

                  return (
                    <div
                      key={conv._id}
                      className={`group relative flex items-center justify-between w-full rounded-xl transition-all duration-150 border ${
                        isActive
                          ? "bg-indigo-500/10 border-indigo-500/20 text-slate-100"
                          : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      {isEditing ? (
                        <form
                          onSubmit={(e) => handleSaveEdit(conv._id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 w-full p-1.5 min-w-0"
                        >
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                            <MessageSquare size={13} />
                          </div>
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                handleCancelEdit(e);
                              }
                            }}
                            disabled={isSavingEdit}
                            autoFocus
                            className="flex-1 min-w-0 bg-[#12141c] text-[13px] text-slate-100 px-2 py-1 rounded-lg border border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="submit"
                            disabled={isSavingEdit || !editingTitle.trim()}
                            title="Save title"
                            aria-label="Save title"
                            className="p-1 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            {isSavingEdit ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isSavingEdit}
                            title="Cancel"
                            aria-label="Cancel"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSelectConversation(conv)}
                            title={title}
                            aria-current={isActive ? "page" : undefined}
                            className="flex items-center gap-2.5 min-w-0 flex-1 px-2.5 py-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 rounded-l-xl"
                          >
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? "bg-indigo-500/20 text-indigo-300"
                                  : "bg-white/[0.04] text-slate-500 group-hover:text-slate-300"
                              }`}
                            >
                              <MessageSquare size={13} />
                            </div>
                            <span className="text-[13px] font-medium truncate flex-1">
                              {title}
                            </span>
                          </button>

                          <div className="flex items-center gap-0.5 pr-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleStartEdit(conv, e)}
                              title="Edit title"
                              aria-label="Edit title"
                              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/15 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50"
                            >
                              <Pencil size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) =>
                                handleDeleteConversation(conv._id, e)
                              }
                              disabled={isDeleting}
                              title="Delete conversation"
                              aria-label="Delete conversation"
                              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50 disabled:opacity-40"
                            >
                              {isDeleting ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin text-rose-400"
                                />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
          </nav>
        </div>

        {/* Footer Section */}
        <div className="shrink-0 border-t border-white/[0.06] p-2.5">
          {userData ? (
            isCollapsed ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <div
                  title={`${userData.name || "User"} (${userData.plan || "Free"})`}
                  className="relative"
                >
                  {showAvatar ? (
                    <img
                      src={userData.avatar}
                      alt={userData.name || "User"}
                      referrerPolicy="no-referrer"
                      onError={() => setFailedAvatarUrl(userData.avatar)}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-400">
                      <User size={16} />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLogOut}
                  title="Log out"
                  aria-label="Log out"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/40"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                <div className="relative shrink-0">
                  {showAvatar ? (
                    <img
                      src={userData.avatar}
                      alt={userData.name || "User"}
                      referrerPolicy="no-referrer"
                      onError={() => setFailedAvatarUrl(userData.avatar)}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400">
                      <User size={15} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-200 truncate leading-tight">
                    {userData?.name || "User"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 flex justify-between">
                    <span>{plan.name || "Free"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  {/* Credits / Billing */}
                  <button
                    type="button"
                    onClick={() => setShowBilling(true)}
                    title="View usage & billing"
                    aria-label={`View usage and billing. ${userData?.credits ?? 0} credits remaining`}
                    className="
                      flex h-8 shrink-0 items-center justify-center gap-1.5
                      rounded-lg border border-amber-400/15
                      bg-amber-400/5 px-2
                      text-amber-400
                      transition-colors duration-200
                      hover:border-amber-400/30
                      hover:bg-amber-400/10
                      hover:text-amber-300
                      active:scale-95
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-amber-400/50 cursor-pointer
                    "
                  >
                    <Coins size={14} className="shrink-0" />

                    <span className="text-[11px] font-mono font-medium tabular-nums">
                      {credits}
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="h-4 w-px shrink-0 bg-slate-700/70" />

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={handleLogOut}
                    disabled={isLoggingOut}
                    title={isLoggingOut ? "Logging out..." : "Log out"}
                    aria-label="Log out"
                    className="
                      flex h-8 w-8 shrink-0 items-center justify-center
                      rounded-lg text-slate-400
                      transition-colors duration-200
                      hover:bg-rose-500/10
                      hover:text-rose-400
                      active:scale-95
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-rose-500/40
                      disabled:cursor-not-allowed
                      disabled:opacity-50 cursor-pointer
                    "
                  >
                    {isLoggingOut ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <LogOut size={15} />
                    )}
                  </button>
                </div>
              </div>
            )
          ) : isCollapsed ? (
            <div className="flex justify-center py-1">
              <Link
                to="/login"
                title="Sign in"
                aria-label="Sign in"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] transition-colors"
              >
                <User size={16} />
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-medium border border-white/[0.07] transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>

      <BillingModal open={showBilling} onClose={() => setShowBilling(false)} />
    </>
  );
}
