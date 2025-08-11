import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import AuthCallback from "./pages/AuthCallback";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      console.log("Initial session:", session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      console.log("Session changed:", session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 💡 Here’s the return block
  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            session ? (
              <div style={{ padding: "2rem" }}>
                <h1>🎉 Welcome!</h1>
                <p>You are signed in.</p>
              </div>
            ) : (
              <SignInPage />
            )
          }
        />
      </Routes>
    </Router>
  );
}
