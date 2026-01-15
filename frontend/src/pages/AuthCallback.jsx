import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { logger } from "../utils/logger";

/**
 * Auth callback page component - handles OAuth callback
 * @returns {JSX.Element}
 */
export default function AuthCallback() {
  const { completeEmailSignIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await completeEmailSignIn();
        navigate("/");
      } catch (error) {
        logger.error("Auth callback error:", error);
        navigate("/");
      }
    };

    handleCallback();
  }, [completeEmailSignIn, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Completing sign in...</div>
    </div>
  );
}
