import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, signupUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    token: "",
    user: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const response = await getCurrentUser();
        setAuthState({
          token: "",
          user: response.user,
        });
      } catch (error) {
        setAuthState({ token: "", user: null });
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);

    try {
      const response = await loginUser(credentials);
      setAuthState({ token: "", user: response.user });
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload) => {
    setIsLoading(true);

    try {
      const response = await signupUser(payload);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // No-op: client state should still clear when server logout fails.
    }

    setAuthState({ token: "", user: null });
  };

  const refreshUser = async () => {
    try {
      const response = await getCurrentUser();
      setAuthState((currentState) => ({
        ...currentState,
        user: response.user,
      }));

      return response.user;
    } catch (error) {
      setAuthState({ token: "", user: null });
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      token: authState.token,
      user: authState.user,
      isAuthenticated: Boolean(authState.user),
      isAdmin: authState.user?.role === "admin",
      isLoading,
      isInitializing,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [authState, isInitializing, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
