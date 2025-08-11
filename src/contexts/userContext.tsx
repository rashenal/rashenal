// src/contexts/userContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthResponse = {
  data: { user: User | null; session: Session | null };
  error: AuthError | null;
};

type UserContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  // Auth functions
  signUp: (
    email: string,
    password: string,
    metadata?: any
  ) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch initial session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Auth functions
  const signUp = async (
    email: string,
    password: string,
    metadata?: any
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      });

      // If signup successful and user exists, also create profile
      if (data.user && !error && metadata?.full_name) {
        try {
          await supabase.from('profiles').insert([
            {
              id: data.user.id,
              email,
              full_name: metadata.full_name,
            },
          ]);
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return { data, error };
    } catch (err) {
      return {
        data: { user: null, session: null },
        error: err as AuthError,
      };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      return {
        data: { user: null, session: null },
        error: err as AuthError,
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resendConfirmation,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Export useAuth as an alias to useUser for backward compatibility
export const useAuth = useUser;
