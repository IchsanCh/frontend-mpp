import { useEffect } from "react";

export default function MainLayout({ title, children }) {
  useEffect(() => {
    document.title = title ? `${title} | Sistem Antrian` : "Sistem Antrian";
    document.documentElement.setAttribute("data-theme", "light");
  }, [title]);

  return <div className="min-h-screen">{children}</div>;
}
