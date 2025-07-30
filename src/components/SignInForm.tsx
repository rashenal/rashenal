// src/components/SignInForm.tsx
import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return setError(error.message);

    setMessage('Successfully signed in!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Sign In</button>
      <p style={{ color: 'red' }}>{error}</p>
      <p style={{ color: 'green' }}>{message}</p>
    </form>
  );
}
