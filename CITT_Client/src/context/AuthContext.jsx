import React, { createContext, useState, useEffect } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import axios from "axios";

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

  // 🔹 Initialize: Check for existing JWT token in localStorage
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
          await syncWithBackend(firebaseUser, firestoreData);

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

    // Log out user only when tab/browser is closed (not on refresh)
    const handlePageHide = (event) => {
      if (!event.persisted) {
        signOut(auth);
        handleLogout();
      }
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      unsubscribe();
      window.removeEventListener('pagehide', handlePageHide);
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

      const { token: jwtToken, user: backendUser } = response.data;

      // Store JWT token and user data
      setToken(jwtToken);
      setProfile(backendUser);
      setRole(backendUser.role);
      localStorage.setItem("authToken", jwtToken);
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

      const { token: jwtToken, user: backendUser } = response.data;

      // Store authentication data
      setToken(jwtToken);
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
      
      localStorage.setItem("authToken", jwtToken);
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
      console.error("Login failed:", error);
      // Extract error message from axios response
      let errorMessage = "Incorrect username or password";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  // 🔹 Google login (Firebase + PostgreSQL)
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    setJustAuthenticated(true);

    // Firebase auth successful, now sync with PostgreSQL
    const backendUser = await syncWithBackend(result.user, {});
    return backendUser;
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

      const { token: jwtToken, user: backendUser } = response.data;

      // Store authentication data
      setToken(jwtToken);
      setProfile(backendUser);
      setRole(backendUser.role);
      setUser({ email, displayName: name }); // Set a basic user object
      setJustAuthenticated(true);
      localStorage.setItem("authToken", jwtToken);
      localStorage.setItem("userProfile", JSON.stringify(backendUser));

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
    await signOut(auth);
    handleLogout();
  };

  // 🔹 Clear local authentication state
  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem("authToken");
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
    try {
      console.log("💾 Saving profile...", data);
      
      // Prepare profile data
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

      // Update backend profile via API (faster than Firestore)
      if (token) {
        console.log("📤 Updating backend profile...");
        try {
          await axios.put(`${API_BASE_URL}/api/auth/me`, {
            name: profileData.fullName,
            email: profileData.email,
            phone: profileData.phone,
          }, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000 // 5 second timeout
          });
          console.log("✅ Backend profile updated successfully");
        } catch (apiError) {
          console.error("❌ Failed to update backend profile:", apiError);
          throw new Error("Failed to save profile to backend: " + (apiError.response?.data?.error || apiError.message));
        }
      } else {
        throw new Error("No authentication token found");
      }

      // If user has Firebase UID, save to Firestore (secondary - don't block on this)
      if (user?.uid) {
        console.log("🔥 Saving to Firestore...");
        try {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, {
            ...profileData,
            createdAt: new Date().toISOString(),
          });
          console.log("✅ Firestore updated successfully");
        } catch (firestoreError) {
          console.warn("⚠️ Firestore update failed (non-critical):", firestoreError);
        }
      }

      // Update local state
      console.log("📝 Updating local state...");
      setProfile(profileData);
      setShowProfileForm(false);
      console.log("✅ Profile saved successfully!");
    } catch (error) {
      console.error("❌ Failed to save profile:", error);
      throw error;
    }
  };

  // 🔹 Role-based helper functions
  const hasRole = (requiredRole) => {
    if (!role) return false;
    return role === requiredRole;
  };

  const hasAnyRole = (requiredRoles) => {
    if (!role) return false;
    return requiredRoles.includes(role);
  };

  const isSuperAdmin = () => role === "superAdmin";
  const isAdmin = () => role === "admin";
  const isIPManager = () => role === "ipManager";
  const isInnovator = () => role === "innovator";

  // 🔹 Check if user has admin privileges (admin or superAdmin)
  const hasAdminAccess = () => hasAnyRole(["admin", "superAdmin"]);

  // 🔹 Get axios instance with auth header
  const getAuthenticatedAxios = () => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  };

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

        // Role-based helpers
        hasRole,
        hasAnyRole,
        isSuperAdmin,
        isAdmin,
        isIPManager,
        isInnovator,
        hasAdminAccess,

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
