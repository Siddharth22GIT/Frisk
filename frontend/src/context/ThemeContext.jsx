import React, { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext({ theme: "dark" });

export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    localStorage.removeItem("frisk-theme");
  }, []);

  return <ThemeContext.Provider value={{ theme: "dark" }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
