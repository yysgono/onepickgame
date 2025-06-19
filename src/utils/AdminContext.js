import React, { createContext, useContext, useState } from "react";

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("onepickgame_isAdmin") === "true";
  });

  function login(pw) {
    if (pw === "1234") {
      setIsAdmin(true);
      localStorage.setItem("onepickgame_isAdmin", "true");
      return true;
    }
    return false;
  }

  function logout() {
    setIsAdmin(false);
    localStorage.removeItem("onepickgame_isAdmin");
  }

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin은 AdminProvider 안에서만 사용하세요.");
  return ctx;
}
