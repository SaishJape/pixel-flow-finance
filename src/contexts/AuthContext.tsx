import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  user_id: string;
  group_id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuthStatus = () => {
      const storedUserId = localStorage.getItem('user_id');
      const storedGroupId = localStorage.getItem('group_id');
      const storedUsername = localStorage.getItem('username');
      const storedLoginStatus = localStorage.getItem('isLoggedIn');

      if (storedUserId && storedGroupId && storedUsername && storedLoginStatus === 'true') {
        setUser({
          user_id: storedUserId,
          group_id: storedGroupId,
          username: storedUsername,
        });
        setIsLoggedIn(true);
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user_id', userData.user_id);
    localStorage.setItem('group_id', userData.group_id);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user_id');
    localStorage.removeItem('group_id');
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
