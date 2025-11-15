import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ClearSession() {
  const { logout } = useAuth();

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        await logout();
      } catch (error) {
        if (active) {
          console.error("Failed to clear session", error);
        }
      } finally {
        if (active) {
          window.location.href = "/login";
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [logout]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Clearing session...</p>
      </div>
    </div>
  );
}
