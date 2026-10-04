import { createContext, useContext, useEffect, useState } from "react";
import { registerUser, loginUser, logoutUser, fetchMe, updateProfile as updateProfileApi  } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until /me has answered

  // Restore the session on page load
  useEffect(() => {
    fetchMe()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const register = async (data) => {
    const res = await registerUser(data);
    setUser(res.data.user);
  };

  const login = async (data) => {
    const res = await loginUser(data);
    setUser(res.data.user);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };
  const updateProfile = async (data) => {
  const res = await updateProfileApi(data);
  setUser(res.data.user);
};

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);