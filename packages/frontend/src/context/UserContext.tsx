import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  currentUser: string;
  setCurrentUser: (user: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('fsmCurrentUser') || '';
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('fsmCurrentUser', currentUser);
    } else {
      localStorage.removeItem('fsmCurrentUser');
    }
  }, [currentUser]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
