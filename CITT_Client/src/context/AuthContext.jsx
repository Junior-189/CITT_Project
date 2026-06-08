import React, { createContext, useState, useEffect, useCallback } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import axios from "axios";
import api from '../services/api';

// Base URL for backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// 🔹 Create the global authentication context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);          // Firebase auth user
  const [profile, setProfile] = useState(null);    // User profile from PostgreSQL
  const [role, setRole] = useState(null);          // User role (from PostgreSQL)
  const [token, setToken] = useState(null);        // JWT token from backend
  const [loading, setLoading] = useState(true);    // App loading state
  const [showProfileForm, setShowProfileForm] = useState(false); // Controls popup for completing profile
  const [justAuthenticated, setJustAuthenticated] = useState(false); // Track if user just logged in/registered

  // Handle Google sign-in redirect result on page load
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        setJustAuthenticated(true);
        sessionStorage.setItem('googleRedirect', 'true');
      }
    }).catch(() => {});
  }, []);

  // Initialize: Check for existing JWT token in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("userProfile");

    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setProfile(parsedUser);
      setRole(parsedUser.role);
      
      // Set user object for JWT-based authentication
      setUser({
        uid: parsedUser.id,
        email: parsedUser.email,
        displayName: parsedUser.name,
        isJWTLogin: true
      });

      // Verify token is still valid by fetching fresh user data
      fetchCurrentUser(storedToken);
    } else {
      // No stored auth data, finish loading
      setLoading(false);
    }
  }, []);

  // 🔹 Fetch current user from backend using JWT token
  const fetchCurrentUser = async (jwtToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });

      const userData = response.data;
      setProfile(userData);
      setRole(userData.role);
      
      // Set user object for JWT-based authentication
      setUser({
        uid: userData.id,
        email: userData.email,
        displayName: userData.name,
        isJWTLogin: true
      });
      
      localStorage.setItem("userProfile", JSON.stringify(userData));
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      // If token is invalid, clear auth state
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        setLoading(false);
      }
    }
  };

  // 🔹 On mount: watch authentication state (Firebase)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const firestoreData = userSnap.data();
          setUser(firebaseUser);

          // Sync with PostgreSQL backend
          const backendUser = await syncWithBackend(firebaseUser, firestoreData);

          // Handle Google redirect sign-in (popup-blocked fallback)
          if (sessionStorage.getItem('googleRedirect')) {
            sessionStorage.removeItem('googleRedirect');
            const role = backendUser?.role || 'innovator';
            const routes = {
              superAdmin: '/superadmin/dashboard', admin: '/admin/dashboard',
              transferTechnologyOfficer: '/admin/dashboard', ipManager: '/ipmanager/dashboard',
              diiDirector: '/dii/workspace', debmDirector: '/debm/workspace',
              rtpDirector: '/rtp/workspace', mentor: '/workspace/mentor',
              technicalCommittee: '/workspace/technical-committee',
              coordinator: '/workspace/coordinator', innovator: '/projects',
            };
            window.location.href = routes[role] || '/';
            return;
          }

          // If profile not complete AND user just authenticated, trigger popup
          if (justAuthenticated && !firestoreData.profileComplete) {
            setShowProfileForm(true);
            setJustAuthenticated(false); // reset after showing
          }
        } else {
          // No profile record found AND user just authenticated → show profile completion form
          setUser(firebaseUser);
          if (justAuthenticated) {
            setShowProfileForm(true);
            setJustAuthenticated(false); // reset after showing
          }
        }
      } else {
        // Only clear user if it's not a JWT login (i.e., Firebase is the auth method)
        // If we have a profile (JWT login), don't clear the user
        if (!profile) {
          setUser(null);
          setShowProfileForm(false);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [justAuthenticated, profile]);

  // 🔹 Sync Firebase user with PostgreSQL backend
  const syncWithBackend = async (firebaseUser, firestoreData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/firebase-register`, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firestoreData?.name,
        phoneNumber: firebaseUser.phoneNumber || firestoreData?.phone,
        photoURL: firebaseUser.photoURL
      });

      const { accessToken, refreshToken: newRefreshToken, user: backendUser } = response.data;

      // Store JWT token and user data
      setToken(accessToken);
      setProfile(backendUser);
      setRole(backendUser.role);
      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      localStorage.setItem("userProfile", JSON.stringify(backendUser));

      // Return the backend user data
      return backendUser;
    } catch (error) {
      console.error("Failed to sync with backend:", error);
      throw error;
    }
  };

  // 🔹 Email/password login (PostgreSQL backend)
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      const { accessToken, refreshToken: newRefreshToken, user: backendUser } = response.data;

      // Store authentication data
      setToken(accessToken);
      setProfile(backendUser);
      setRole(backendUser.role);
      setJustAuthenticated(true);
      
      // Set user object with email for JWT-based login (not using Firebase auth)
      setUser({
        uid: backendUser.id,
        email: backendUser.email,
        displayName: backendUser.name,
        isJWTLogin: true // Flag to indicate this is JWT-only login
      });
      
      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      localStorage.setItem("userProfile", JSON.stringify(backendUser));

      // Also sign in to Firebase if user has firestore_id
      if (backendUser.firestore_id) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (firebaseError) {
          console.log("Firebase sign-in skipped:", firebaseError.message);
        }
      }

      return backendUser;
    } catch (error) {
      throw error;
    }
  };

  // Google login (Firebase + PostgreSQL)
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setJustAuthenticated(true);
      const backendUser = await syncWithBackend(result.user, {});
      return backendUser;
    } catch (error) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        sessionStorage.setItem('googleRedirect', 'true');
        await signInWithRedirect(auth, googleProvider);
        return; // page will redirect; never reaches here
      }
      throw error;
    }
  };

  // 🔹 Registration (Email/Password) - PostgreSQL backend
  const register = async (name, email, password, confirmPassword) => {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
        role: "innovator" // Default role
      });

      // Registration returns pending status - no tokens issued
      const { user: backendUser, pending } = response.data;

      if (pending) {
        // Account pending approval - show message, don't set auth
        setJustAuthenticated(true);
        return backendUser;
      }

      // Store authentication data
      setProfile(backendUser);
      setRole(backendUser.role);
      setUser({ email, displayName: name });
      setJustAuthenticated(true);

      // Show profile form after registration
      setShowProfileForm(true);

      return backendUser;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  // 🔹 Logout user (both Firebase and clear local storage)
  const logout = async () => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      await api.post('/api/auth/logout', { refreshToken: storedRefreshToken }).catch(() => {});
    } catch {}
    try { await signOut(auth); } catch {}
    handleLogout();
  };

  // 🔹 Clear local authentication state
  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userProfile");
  };

  // 🔹 Set password for users (especially Google OAuth users)
  const setPassword = async (newPassword) => {
    if (!token) {
      throw new Error("You must be logged in to set a password");
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/set-password`, {
        password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Password set successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to set password:", error);
      const errorMessage = error.response?.data?.error || "Failed to set password";
      throw new Error(errorMessage);
    }
  };

  // 🔹 Save user profile to Firestore (for both Google & normal registration)
  const saveProfile = async (data) => {
    const profileData = {
      fullName: data.fullName,
      phone: data.phone,
      university: data.university,
      college: data.college,
      category: data.category,
      yearOfStudy: data.yearOfStudy || "",
      role: data.role || "innovator",
      profileComplete: true,
      email: user?.email || profile?.email,
      name: data.fullName || user?.displayName || profile?.name,
    };

    if (token) {
      try {
        await axios.put(`${API_BASE_URL}/api/auth/me`, {
          name: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
        }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
      } catch (apiError) {
        throw new Error("Failed to save profile to backend: " + (apiError.response?.data?.error || apiError.message));
      }
    } else {
      throw new Error("No authentication token found");
    }

    if (user?.uid) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          ...profileData,
          createdAt: new Date().toISOString(),
        });
      } catch {}
    }

    setProfile(profileData);
    setShowProfileForm(false);
  };

  // 🔹 Role-based route map covering all 11 roles
  const ROLE_ROUTES = {
    superAdmin:                '/superadmin/dashboard',
    admin:                     '/admin/dashboard',
    transferTechnologyOfficer: '/admin/dashboard',
    ipManager:                 '/ipmanager/dashboard',
    diiDirector:               '/dii/workspace',
    debmDirector:              '/debm/workspace',
    rtpDirector:               '/rtp/workspace',
    mentor:                    '/workspace/mentor',
    technicalCommittee:        '/workspace/technical-committee',
    coordinator:               '/workspace/coordinator',
    innovator:                 '/projects',
  };

  // 🔹 Get the default route for a given role
  const getRouteForRole = (userRole) => ROLE_ROUTES[userRole] || '/';

  // 🔹 Get axios instance with auth header
  const getAuthenticatedAxios = useCallback(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    });
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        // User data
        user,
        profile,
        role,
        token,
        loading,

        // Authentication functions
        login,
        register,
        loginWithGoogle,
        logout,
        setPassword,

        // Profile management
        showProfileForm,
        setShowProfileForm,
        saveProfile,

        // State management
        justAuthenticated,
        setJustAuthenticated,

        // Role-based navigation
        getRouteForRole,

        // Utility
        getAuthenticatedAxios,
        fetchCurrentUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 🔹 Custom hook to use Auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
