import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import {
  registerUser,
  loginUser,
  logoutUser,
  fetchMe,
  updateProfile as updateProfileApi,
  startDemoUser,
} from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until /me has answered
  const [demoExpired, setDemoExpired] = useState(false);
  const userRef = useRef(null);
  const setCurrentUser = useCallback((nextUser) => {
    userRef.current = nextUser;
    setUser(nextUser);
  }, []);

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const path = (error.config?.url || "").split("?")[0];
        const isAuthEndpoint = /(?:^|\/)auth(?:\/|$)/.test(path);
        if (error.response?.status === 401 && !isAuthEndpoint && userRef.current?.isDemo) {
          userRef.current = null;
          setCurrentUser(null);
          setDemoExpired(true);
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptorId);
  }, [setCurrentUser]);

  // Restore the session on page load
  useEffect(() => {
    fetchMe()
      .then((res) => setCurrentUser(res.data.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, [setCurrentUser]);

  const register = async (data) => {
    const res = await registerUser(data);
    setCurrentUser(res.data.user);
    setDemoExpired(false);
  };

  const login = async (data) => {
    const res = await loginUser(data);
    setCurrentUser(res.data.user);
    setDemoExpired(false);
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setDemoExpired(false);
  };

  const startDemo = async () => {
    const res = await startDemoUser();
    setCurrentUser(res.data.user);
    setDemoExpired(false);
  };

  const updateProfile = async (data) => {
    const res = await updateProfileApi(data);
    setCurrentUser(res.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, demoExpired, register, login, logout, updateProfile, startDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);