export const getInitialTheme = (): string => {
  // Get theme from localStorage or default to "light"
  return localStorage.getItem("theme") || "light";
};

export const applyTheme = (theme: string): void => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
};
