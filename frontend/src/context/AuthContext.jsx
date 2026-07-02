import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session on app start
  useEffect(() => {
    const storedToken = localStorage.getItem("jedida_access_token");
    const storedUser = localStorage.getItem("jedida_user");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = (data) => {
    setToken(data.accessToken);
    setUser(data.user);

    localStorage.setItem("jedida_access_token", data.accessToken);
    localStorage.setItem("jedida_user", JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem("jedida_access_token");
    localStorage.removeItem("jedida_user");
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
