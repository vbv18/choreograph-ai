import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase";
import { api } from "../utils/axios";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

export default function Login() {
  const dispatch = useDispatch();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(token) {
    try {
      const response = await api.post("/auth/login", {
        token,
      });

      dispatch(setUserData(response.data.user));
    } catch (error) {
      console.error("[Handle-Login-Error]", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async function googleLogin() {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMsg("");

    try {
      const loginData = await signInWithPopup(auth, googleProvider);
      const token = await loginData.user.getIdToken();
      await handleLogin(token);
    } catch (error) {
      console.error("[Google-Login-Error]", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      setErrorMsg(
        error?.response?.data?.message ||
          "Login failed. Please check your network and try again.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="h-screen flex bg-[#0d0f14] text-white overflow-hidden">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5 shadow-2xl">
          <div className="flex flex-col gap-1 items-center justify-center text-center">
            <h2 className="text-[17px] font-semibold text-slate-100 tracking-tight">
              Welcome to Choreograph AI
            </h2>

            <p className="text-[13px] text-slate-500">
              Please login to continue.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            disabled={isLoggingIn}
            onClick={googleLogin}
            className="w-full flex items-center justify-center gap-3 px-[11px] py-[8px] rounded-xl text-sm font-medium text-black/80 bg-white hover:bg-gray-200 shadow-md shadow-indigo-700/30 hover:shadow-indigo-500/30 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <Loader2 size={16} className="animate-spin text-black/70" />
            ) : (
              <FcGoogle size={16} />
            )}
            <span>
              {isLoggingIn ? "Signing in..." : "Continue with Google"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
