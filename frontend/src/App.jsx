import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { setTokenGetter } from "./services/api";
import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";
import RecipeDetail from "./pages/RecipeDetail";
import AccountSettings from "./pages/AccountSettings";

function App() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/settings" element={<AccountSettings />} />
      </Routes>
    </div>
  );
}

export default App;
