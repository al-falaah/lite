// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, auth, profiles } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    checkUser();

    // Listen for auth changes (including TOKEN_REFRESHED and SIGNED_OUT)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed. Event:', event, 'Session:', session?.user?.id);

        // Handle different auth events
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed, session is still valid');
        }

        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing state');
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Setting user from auth state change:', session.user.id);
          setUser(session.user);

          // Only load profile if user is NOT a teacher
          // Teachers use TeacherPortal which manages its own state
          const userRole = session.user.user_metadata?.role;
          if (userRole !== 'teacher') {
            await loadProfile(session.user.id);
          } else {
            console.log('User is a teacher, skipping profile load');
            setProfile(null); // Teachers don't have profiles
          }
        } else {
          console.log('No session, clearing user and profile');
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // No need for periodic session checks - Supabase handles this automatically
    // The onAuthStateChange listener will fire on TOKEN_REFRESHED events
    // If session expires, SIGNED_OUT event will fire automatically

    return () => {
      // Properly unsubscribe from auth state changes
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const checkUser = async () => {
    try {
      console.log('[checkUser] Starting session check...');

      // Increased timeout to 15 seconds for better session persistence on slow connections
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 15000)
      );

      const authCheck = supabase.auth.getSession();

      // Race between auth check and timeout
      const result = await Promise.race([authCheck, timeout]);
      const session = result?.data?.session;

      if (session?.user) {
        console.log('[checkUser] Session found for user:', session.user.id);
        setUser(session.user);

        // Only load profile if user is NOT a teacher
        const userRole = session.user.user_metadata?.role;
        if (userRole !== 'teacher') {
          await loadProfile(session.user.id);
        } else {
          console.log('[checkUser] User is a teacher, skipping profile load');
          setProfile(null);
        }
      } else {
        console.log('[checkUser] No active session found');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('[checkUser] Error checking user:', error);
      // On timeout, DON'T clear user state - let onAuthStateChange handle it
      // The onAuthStateChange listener may have already set the user
      // Only clear if it's not a timeout (actual error)
      if (!error.message?.includes('timeout')) {
        setUser(null);
        setProfile(null);
      } else {
        console.log('[checkUser] Timeout occurred, deferring to onAuthStateChange');
      }
    } finally {
      console.log('[checkUser] Auth check complete, setting loading to false');
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    try {
      console.log('[loadProfile] Loading profile for userId:', userId);

      // Use direct REST API call to bypass potential RLS timing issues during auth state changes
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        console.error('[loadProfile] No access token available');
        setProfile(null);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('[loadProfile] Fetching profile via REST API...');
      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('[loadProfile] Profile fetch failed:', response.status, response.statusText);

        // If profile doesn't exist, try to create it
        if (response.status === 404 || response.status === 406) {
          console.log('[loadProfile] Profile not found, attempting to create...');
          const currentUser = await auth.getCurrentUser();

          if (currentUser.user) {
            const createResponse = await fetch(
              `${supabaseUrl}/rest/v1/profiles`,
              {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                  id: userId,
                  email: currentUser.user.email,
                  full_name: currentUser.user.user_metadata?.full_name || currentUser.user.email,
                  role: 'student',
                  is_admin: false
                })
              }
            );

            if (createResponse.ok) {
              const [newProfile] = await createResponse.json();
              console.log('[loadProfile] Profile created successfully:', newProfile);
              setProfile(newProfile);
            } else {
              console.error('[loadProfile] Failed to create profile');
              setProfile({
                id: userId,
                email: currentUser.user.email,
                full_name: currentUser.user.email,
                role: 'student',
                is_admin: false
              });
            }
          }
        } else {
          // For other errors, set minimal profile
          const currentUser = await auth.getCurrentUser();
          setProfile({
            id: userId,
            email: currentUser.user?.email || 'unknown',
            full_name: currentUser.user?.email || 'Unknown User',
            role: 'student',
            is_admin: false
          });
        }
        return;
      }

      const data = await response.json();
      console.log('[loadProfile] Profile fetch response:', data);

      if (!data || data.length === 0) {
        console.error('[loadProfile] No profile data returned for user:', userId);
        const currentUser = await auth.getCurrentUser();
        setProfile({
          id: userId,
          email: currentUser.user?.email || 'unknown',
          full_name: currentUser.user?.email || 'Unknown User',
          role: 'student',
          is_admin: false
        });
        return;
      }

      const profile = data[0]; // REST API returns array
      console.log('[loadProfile] Profile loaded successfully:', { id: profile.id, role: profile.role, name: profile.full_name });
      setProfile(profile);
    } catch (error) {
      console.error('[loadProfile] Exception in loadProfile:', error);
      // Even on exception, set minimal profile to prevent app hang
      try {
        const currentUser = await auth.getCurrentUser();
        setProfile({
          id: userId,
          email: currentUser.user?.email || 'unknown',
          full_name: currentUser.user?.email || 'Unknown User',
          role: 'student',
          is_admin: false
        });
      } catch (innerError) {
        console.error('[loadProfile] Failed to create fallback profile:', innerError);
      }
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await auth.signUp(email, password, fullName);
      if (error) throw error;

      // Profile is automatically created by database trigger
      // No need to manually create it here

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('SignIn attempt for:', email);

      // Add retry logic for network failures
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`SignIn attempt ${attempt}/3...`);
          const { data, error } = await auth.signIn(email, password);

          if (error) {
            // If it's a retryable network error, try again
            if (error.name === 'AuthRetryableFetchError' && attempt < 3) {
              console.warn(`Network error on attempt ${attempt}, retrying...`);
              lastError = error;
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              continue;
            }
            console.error('SignIn error:', error);
            throw error;
          }

          console.log('SignIn successful, user:', data.user?.id);
          console.log('Waiting for profile to load via auth state change...');
          return { data, error: null };
        } catch (err) {
          if (err.name === 'AuthRetryableFetchError' && attempt < 3) {
            lastError = err;
            console.warn(`Network error on attempt ${attempt}, retrying in ${attempt}s...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw err;
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Sign in failed after 3 attempts');
    } catch (error) {
      console.error('SignIn exception:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('SignOut initiated');

      // First, immediately clear local state to provide instant feedback
      // DO NOT set loading to true - this prevents the loading screen from appearing
      setUser(null);
      setProfile(null);

      // Use 'local' scope for instant logout (doesn't contact server)
      // This is what enterprise apps do - clear local state immediately
      try {
        const { error } = await supabase.auth.signOut({ scope: 'local' });

        if (error) {
          console.warn('Local signout error (non-critical):', error);
        } else {
          console.log('SignOut successful (local)');
        }
      } catch (signOutError) {
        console.warn('SignOut error (non-critical):', signOutError);
        // Local state is already cleared, so this is fine
      }

      return { error: null };
    } catch (error) {
      console.error('SignOut exception:', error);

      // IMPORTANT: Clear user and profile even on error
      // This ensures local state is cleared even if signout fails
      setUser(null);
      setProfile(null);

      // Return success because local state is cleared
      return { error: null };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await auth.resetPassword(email);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await auth.updatePassword(newPassword);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const isAdmin = () => {
    return profile?.is_admin === true;
  };

  const isStudent = () => {
    return profile?.role === 'student';
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isAdmin,
    isStudent,
    refreshProfile: () => loadProfile(user?.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};