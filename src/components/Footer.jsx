import { Link } from "react-router-dom";
const APP_NAME = import.meta.env.VITE_APP_NAME || "SANDIGI";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="footer py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <aside className="col-span-1">
            <div className="text-2xl font-bold mb-3">
              <span className="text-white">{APP_NAME}</span>
            </div>
            <p className="text-white/80">
              Sistem antrian digital yang modern dan efisien untuk pengalaman
              antrian yang lebih nyaman.
            </p>
          </aside>
          <nav className="flex flex-col">
            <h1 className="footer-title">Menu</h1>
            <Link to="/" title="Home" className="link link-hover">
              Home
            </Link>
            <Link to="/antrian" title="Antrian" className="link link-hover">
              Antrian
            </Link>
            <Link to="/san/login" title="Login" className="link link-hover">
              Login
            </Link>
          </nav>
          <nav className="flex flex-col">
            <h1 className="footer-title">Support</h1>
            <a href="/#faq" title="FAQ" className="link link-hover">
              FAQ
            </a>
          </nav>
        </div>

        <div className="border-t border-base-300 py-6 text-center">
          <p className="text-white/80">
            Copyright © {new Date().getFullYear()} {APP_NAME}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
