// useUserProfile - Hook to fetch and manage user profile data
// Handles fetching user's first name and other profile information

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  getDisplayName: () => string;
  getInitials: () => string;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Predefined users - for your specific use case
  const predefinedUsers: Record<string, Partial<UserProfile>> = {
    'rharveybis@hotmail.com': {
      first_name: 'Elizabeth',
      last_name: 'Harvey',
      full_name: 'Elizabeth Harvey',
      bio: 'In loving memory of my late Mum - testing Rashenal\'s full capabilities'
    }
  };

  const fetchProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First try to get from user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
        throw profileError;
      }

      let userProfile: UserProfile;

      if (profileData) {
        // User profile exists in database
        userProfile = profileData;
      } else {
        // Check if this is a predefined user
        const predefined = predefinedUsers[user.email || ''];
        
        if (predefined) {
          // Create profile for predefined user
          const newProfile = {
            id: user.id,
            email: user.email || '',
            first_name: predefined.first_name,
            last_name: predefined.last_name,
            full_name: predefined.full_name,
            bio: predefined.bio,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Insert into database
          const { data: insertedData, error: insertError } = await supabase
            .from('user_profiles')
            .insert([newProfile])
            .select()
            .single();

          if (insertError) {
            console.warn('Could not create profile in database, using memory:', insertError);
            userProfile = newProfile;
          } else {
            userProfile = insertedData;
          }
        } else {
          // Create basic profile from auth user data
          userProfile = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      }

      setProfile(userProfile);

    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      
      // Fallback to predefined data if available
      const predefined = predefinedUsers[user?.email || ''];
      if (predefined) {
        setProfile({
          id: user?.id || '',
          email: user?.email || '',
          first_name: predefined.first_name,
          last_name: predefined.last_name,
          full_name: predefined.full_name,
          bio: predefined.bio,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) return;

    try {
      const updatedProfile = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updatedProfile)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const getDisplayName = (): string => {
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]; // First part of full name
    }
    if (user?.email) {
      return user.email.split('@')[0]; // Fallback to email username
    }
    return 'User';
  };

  const getInitials = (): string => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.full_name) {
      const parts = profile.full_name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      const username = user.email.split('@')[0];
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    getDisplayName,
    getInitials
  };
};