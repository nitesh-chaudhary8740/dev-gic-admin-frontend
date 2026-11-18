
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentAdmin } from "../api/auth";

const ProtectedRoute = () => {
  const location = useLocation();

  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        await getCurrentAdmin();

        if (isMounted) {
          setStatus("authenticated");
        }
      } catch (error) {
        if (!isMounted) return;

        if (error.response?.status === 401) {
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    );
  }

if (status === "error") {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">

      <p className="text-sm text-red-600">
        Unable to verify your session. Please try again.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">

        {/* Retry */}
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          Retry
        </button>

        {/* Go to Login */}
        <button
          onClick={() => {
            window.location.href = "/admin/login";
          }}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          Go Back to Login
        </button>

      </div>
    </div>
  );
}

  return <Outlet />;
};

export default ProtectedRoute;
