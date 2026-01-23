import { Link } from "react-router-dom";
import logo from "../assets/images/logo.webp";
const APP_NAME = import.meta.env.VITE_APP_NAME || "SANDIGI";

export default function PublikNavbar() {
  return (
    <div className="drawer">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        <div className="navbar lg:px-16 fixed top-0 z-40 bg-base-100 border-b border-base-300">
          <div className="navbar-start">
            <label
              htmlFor="nav-drawer"
              className="btn btn-ghost btn-circle lg:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>

            <Link
              to="/"
              title={APP_NAME}
              className="text-xl flex gap-2 items-center font-bold"
            >
              <img src={logo} alt="Logo" className="h-8" />
              <span className="color0">{APP_NAME}</span>
            </Link>
          </div>

          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1 gap-1">
              <li>
                <Link to="/" title="Home" className="font-semibold">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/antrian" title="Antrian" className="font-semibold">
                  Antrian
                </Link>
              </li>
            </ul>
          </div>

          <div className="navbar-end">
            <Link
              to="/san/login"
              title="Login"
              className="btn bg-0 rounded-md text-white font-semibold hover:bg-white hover:text-black hover:border hover:border-black"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="nav-drawer" className="drawer-overlay"></label>
        <aside className="w-64 min-h-full bg-base-100 flex flex-col">
          <div className="px-4 py-2 border-b border-black/20">
            <Link
              to="/"
              title={APP_NAME}
              className="text-xl font-bold"
              onClick={() =>
                (document.getElementById("nav-drawer").checked = false)
              }
            >
              <span className="color-0">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-base-content/80 mt-1">
              Sistem Antrian Digital
            </p>
          </div>

          <ul className="menu w-full flex-1 p-4 gap-1">
            <li>
              <Link
                to="/"
                title="Home"
                onClick={() =>
                  (document.getElementById("nav-drawer").checked = false)
                }
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/antrian"
                title="Antrian"
                onClick={() =>
                  (document.getElementById("nav-drawer").checked = false)
                }
              >
                Antrian
              </Link>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
