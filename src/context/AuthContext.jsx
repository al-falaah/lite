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

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed. Event:', event, 'Session:', session?.user?.id);
        if (session?.user) {
          console.log('Setting user from auth state change:', session.user.id);
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          console.log('No session, clearing user and profile');
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { user: currentUser } = await auth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadProfile(currentUser.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
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
      const { data, error } = await auth.signIn(email, password);

      if (error) {
        console.error('SignIn error:', error);
        throw error;
      }

      console.log('SignIn successful, user:', data.user?.id);
      console.log('Waiting for profile to load via auth state change...');

      return { data, error: null };
    } catch (error) {
      console.error('SignIn exception:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('SignOut initiated');
      setLoading(true); // Set loading while signing out

      const { error } = await auth.signOut();
      if (error) {
        console.error('SignOut error:', error);
        throw error;
      }

      console.log('SignOut successful, clearing user and profile');
      setUser(null);
      setProfile(null);
      setLoading(false);

      return { error: null };
    } catch (error) {
      console.error('SignOut exception:', error);
      setLoading(false);
      return { error };
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