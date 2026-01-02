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

    // Listen for auth changes (including TOKEN_REFRESHED)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed. Event:', event, 'Session:', session?.user?.id);

        // Handle token refresh to keep user state updated
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed, updating user state');
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

    // Periodically verify session is still valid (every 30 seconds)
    // This ensures we catch any session issues early
    const sessionCheckInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session check error:', error);
          // Don't clear state on error - let the auth state change handler deal with it
          return;
        }

        // If we have a user in state but no session, clear the state
        if (user && !session) {
          console.warn('Session expired, clearing user state');
          setUser(null);
          setProfile(null);
        }

        // If we have a session but no user in state, update the state
        if (!user && session?.user) {
          console.log('Session found but no user in state, updating');
          setUser(session.user);
          const userRole = session.user.user_metadata?.role;
          if (userRole !== 'teacher') {
            await loadProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      // Properly unsubscribe from auth state changes
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      // Clear interval
      clearInterval(sessionCheckInterval);
    };
  }, [user]); // Add user as dependency to track changes

  const checkUser = async () => {
    try {
      console.log('[checkUser] Starting session check...');

      // Increased timeout to 10 seconds for better session persistence
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 10000)
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
      // On timeout or error, clear user state to prevent stuck state
      setUser(null);
      setProfile(null);
    } finally {
      console.log('[checkUser] Auth check complete, setting loading to false');
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    try {
      console.log('[loadProfile] Loading profile for userId:', userId);
      const { data, error } = await profiles.get(userId);
      console.log('[loadProfile] Profile query completed. Data:', data, 'Error:', error);

      if (error) {
        console.error('[loadProfile] Error loading profile:', error);
        console.error('[loadProfile] Profile error details:', JSON.stringify(error, null, 2));

        // If profile doesn't exist (PGRST116 error), try to create it
        if (error.code === 'PGRST116') {
          console.log('[loadProfile] Profile not found, attempting to create...');
          const currentUser = await auth.getCurrentUser();

          if (currentUser.user) {
            const { data: newProfile, error: createError } = await profiles.create({
              id: userId,
              email: currentUser.user.email,
              full_name: currentUser.user.user_metadata?.full_name || currentUser.user.email,
              role: 'student' // Default role
            });

            if (createError) {
              console.error('[loadProfile] Failed to create profile:', createError);
              // Set a minimal profile to allow the app to continue
              setProfile({
                id: userId,
                email: currentUser.user.email,
                full_name: currentUser.user.email,
                role: 'student'
              });
            } else {
              console.log('[loadProfile] Profile created successfully:', newProfile);
              setProfile(newProfile);
            }
          }
        } else {
          // For other errors, set minimal profile to prevent app hang
          console.error('[loadProfile] Non-recoverable error, setting minimal profile');
          const currentUser = await auth.getCurrentUser();
          setProfile({
            id: userId,
            email: currentUser.user?.email || 'unknown',
            full_name: currentUser.user?.email || 'Unknown User',
            role: 'student'
          });
        }
        return;
      }

      if (!data) {
        console.error('[loadProfile] No profile data returned for user:', userId);
        // Set minimal profile to prevent app hang
        const currentUser = await auth.getCurrentUser();
        setProfile({
          id: userId,
          email: currentUser.user?.email || 'unknown',
          full_name: currentUser.user?.email || 'Unknown User',
          role: 'student'
        });
        return;
      }

      console.log('[loadProfile] Profile loaded successfully:', { id: data.id, role: data.role, name: data.full_name });
      setProfile(data);
    } catch (error) {
      console.error('[loadProfile] Exception in loadProfile:', error);
      // Even on exception, set minimal profile to prevent app hang
      try {
        const currentUser = await auth.getCurrentUser();
        setProfile({
          id: userId,
          email: currentUser.user?.email || 'unknown',
          full_name: currentUser.user?.email || 'Unknown User',
          role: 'student'
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
      setLoading(true);

      // First, immediately clear local state to provide instant feedback
      setUser(null);
      setProfile(null);

      // Add timeout to prevent infinite loading (5 seconds to be safe)
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignOut timeout')), 5000)
      );

      const signOutPromise = auth.signOut();

      // Race between sign out and timeout
      try {
        const result = await Promise.race([signOutPromise, timeout]);

        if (result?.error) {
          console.error('SignOut error:', result.error);
          // Local state already cleared, so this is fine
        } else {
          console.log('SignOut successful on server');
        }
      } catch (timeoutError) {
        console.warn('SignOut timed out, but local state already cleared:', timeoutError.message);
        // This is fine - local state is cleared and user appears logged out
      }

      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('SignOut exception:', error);

      // IMPORTANT: Clear user and profile even on error
      // This ensures local state is cleared even if server signout fails
      setUser(null);
      setProfile(null);
      setLoading(false);

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
    return profile?.role === 'admin';
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