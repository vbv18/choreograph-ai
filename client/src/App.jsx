import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Login from "./pages/LoginPage.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import getCurrentUser from "./features/getCurrentUser";
import { setUserData } from "./redux/userSlice";

export default function App() {
  const dispatch = useDispatch();

  const userData = useSelector((state) => state.user.userData);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        const userData = await getCurrentUser();

        dispatch(setUserData(userData));
      } catch (error) {
        console.error("[Get-Current-User-Error]", {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });

        if (error.response?.status === 401) {
          dispatch(setUserData(null));
        }
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0d0f14] text-white">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={userData ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/"
          element={userData ? <Home /> : <Navigate to="/login" replace />}
        />

        {/* Fallback 404 Route for deep links and unhandled URLs */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
