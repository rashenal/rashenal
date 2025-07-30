import { useState } from "react";
import { supabase } from "../supabase/supabaseClient";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } =
      authMode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        authMode === "sign-in"
          ? "Signed in successfully!"
          : "Check your email to confirm your account."
      );
    }
  };

  return (
    <div style={styles.container}>
      <h2>{authMode === "sign-in" ? "Sign In" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Loading..." : authMode === "sign-in" ? "Sign In" : "Sign Up"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        {authMode === "sign-in" ? (
          <>
            Need an account?{" "}
            <button onClick={() => setAuthMode("sign-up")} style={styles.linkButton}>
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => setAuthMode("sign-in")} style={styles.linkButton}>
              Sign In
            </button>
          </>
        )}
      </p>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "2rem auto",
    padding: "2rem",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    fontFamily: "Arial, sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  input: {
    padding: "0.75rem",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem",
    fontSize: "1rem",
    cursor: "pointer",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "4px",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#4f46e5",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "1rem",
  },
  message: {
    marginTop: "1rem",
    color: "red",
    fontWeight: "bold",
  },
};
