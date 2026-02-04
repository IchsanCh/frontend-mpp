import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  BarChart3,
  Users,
  LogOut,
  Menu,
  ChevronUp,
  User,
  FileText,
  TrendingUp,
  LayersPlus,
  ListOrdered,
  Volume2,
  BellElectricIcon,
  BellRing,
} from "lucide-react";
import { useState } from "react";
import logo from "../../assets/images/logo.webp";
import { authService } from "../../services/api";

const APP_NAME = import.meta.env.VITE_APP_NAME || "SANDIGI";

export default function SideBar({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getUser();
  const [isLaporanOpen, setIsLaporanOpen] = useState(false);

  const menuByRole = {
    super_user: [
      {
        to: "/admin/dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
        description: "Ringkasan & statistik",
      },
      {
        to: "/admin/antrian",
        title: "Antrian",
        icon: ListOrdered,
        description: "Ambil Antrian",
      },
      {
        to: "/admin/units",
        title: "Kelola Unit",
        icon: ClipboardList,
        description: "Manajemen Unit",
      },
      {
        to: "/admin/users",
        title: "Pengguna",
        icon: Users,
        description: "Kelola pengguna",
      },
      {
        to: "/admin/config",
        title: "Pengaturan",
        icon: Settings,
        description: "Pengaturan layanan",
      },
      {
        to: "/admin/reports",
        title: "Laporan",
        icon: BarChart3,
        description: "Laporan Analitik",
      },
      {
        to: "/admin/audio",
        title: "Audio",
        icon: Volume2,
        description: "Management Audio",
      },
      // {
      //   title: "Laporan",
      //   icon: BarChart3,
      //   description: "Data & analitik",
      //   isDropdown: true,
      //   subMenu: [
      //     {
      //       to: "/admin/laporan/harian",
      //       title: "Laporan Harian",
      //       icon: FileText,
      //     },
      //     {
      //       to: "/admin/laporan/bulanan",
      //       title: "Laporan Bulanan",
      //       icon: TrendingUp,
      //     },
      //   ],
      // },
    ],

    unit: [
      {
        to: "/admin/dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
        description: "Ringkasan unit",
      },
      {
        to: "/admin/services",
        title: "Service Management",
        icon: LayersPlus,
        description: "Management service",
      },
      {
        to: "/admin/caller",
        title: "Caller Antrian",
        icon: BellRing,
        description: "Panggil Antrian",
      },
      {
        to: "/admin/reports/unit",
        title: "Laporan",
        icon: BarChart3,
        description: "Laporan Analitik",
      },
      // {
      //   title: "Laporan",
      //   icon: BarChart3,
      //   isDropdown: true,
      //   subMenu: [
      //     {
      //       to: "/admin/laporan/harian",
      //       title: "Laporan Harian",
      //       icon: FileText,
      //     },
      //   ],
      // },
    ],
  };
  const role = user?.role || "guest";
  const menuItems = menuByRole[role] || [];
  const isActive = (path) => location.pathname === path;

  const handleCloseMobileMenu = () => {
    const drawer = document.getElementById("admin-drawer");
    if (drawer && window.innerWidth < 1024) {
      drawer.checked = false;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      handleCloseMobileMenu();
      navigate("/san/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/san/login", { replace: true });
    }
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <div className="navbar bg-base-100 border-b border-base-300 lg:hidden fixed top-0 z-40 shadow-sm">
          <div className="navbar-start">
            <label
              htmlFor="admin-drawer"
              aria-label="Open menu"
              className="btn btn-ghost btn-circle"
            >
              <Menu className="h-5 w-5" />
            </label>
          </div>
          <div className="navbar-center">
            <span className="text-lg font-bold color-0">{APP_NAME}</span>
          </div>
          <div className="navbar-end">
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
                aria-label="User menu"
              >
                <div className="w-8 rounded-full bg-0 text-primary-content flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {user?.nama?.substring(0, 2).toUpperCase() || "AD"}
                  </span>
                </div>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300 mt-3"
              >
                <li className="menu-title px-4 py-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-base-content text-sm">
                      {user?.nama || "Admin User"}
                    </span>
                    <span className="text-xs text-base-content">
                      {user?.email || "example@email.com"}
                    </span>
                  </div>
                </li>
                <div className="divider my-1"></div>
                {/* <li>
                  <Link
                    to="/admin/profile"
                    className="gap-2"
                    onClick={handleCloseMobileMenu}
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">Profil</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/settings"
                    className="gap-2"
                    onClick={handleCloseMobileMenu}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Pengaturan</span>
                  </Link>
                </li>
                <div className="divider my-1"></div> */}
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 text-error hover:bg-error hover:text-error-content px-4 py-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <main className="flex-1 pt-16 lg:pt-0">{children}</main>
      </div>

      <div className="drawer-side z-50">
        <label
          htmlFor="admin-drawer"
          aria-label="Close menu"
          className="drawer-overlay lg:hidden"
        ></label>

        <aside className="w-64 min-h-full bg-base-100 border-r border-base-300 flex flex-col">
          <div className="px-6 py-5 border-b bg-3 border-base-300">
            <Link
              to="/admin/dashboard"
              title={`${APP_NAME} - Admin Panel`}
              className="flex items-center gap-3 group"
              onClick={handleCloseMobileMenu}
            >
              <img
                src={logo}
                alt={`${APP_NAME} Logo`}
                className="h-10 w-10 object-contain transition-transform group-hover:scale-110"
              />
              <div>
                <span className="text-xl font-bold color-0 block leading-tight">
                  {APP_NAME}
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto bg-4">
            <ul className="menu w-full p-4 gap-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;

                if (item.isDropdown) {
                  const hasActiveSubMenu = item.subMenu.some((sub) =>
                    isActive(sub.to)
                  );

                  return (
                    <li key={index}>
                      <details open={hasActiveSubMenu}>
                        <summary
                          className={`
                            group font-medium transition-all duration-200
                            ${
                              hasActiveSubMenu
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-base-200"
                            }
                          `}
                        >
                          <Icon
                            className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                              hasActiveSubMenu
                                ? "text-primary"
                                : "text-base-content/70"
                            }`}
                          />
                          <div className="flex flex-col items-start flex-1">
                            <span className="text-sm font-semibold">
                              {item.title}
                            </span>
                            <span
                              className={`text-xs ${
                                hasActiveSubMenu
                                  ? "text-primary/80"
                                  : "text-base-content/50"
                              }`}
                            >
                              {item.description}
                            </span>
                          </div>
                        </summary>
                        <ul>
                          {item.subMenu.map((subItem, subIndex) => {
                            const SubIcon = subItem.icon;
                            const active = isActive(subItem.to);

                            return (
                              <li key={subIndex}>
                                <Link
                                  to={subItem.to}
                                  title={subItem.description}
                                  className={`
                                    group relative font-medium transition-all duration-200
                                    ${
                                      active
                                        ? "bg-primary text-primary-content hover:bg-primary/90"
                                        : "hover:bg-base-200"
                                    }
                                  `}
                                  onClick={handleCloseMobileMenu}
                                >
                                  <SubIcon
                                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                                      active
                                        ? "text-primary-content"
                                        : "text-base-content/70"
                                    }`}
                                  />
                                  <div className="flex flex-col items-start">
                                    <span className="text-sm">
                                      {subItem.title}
                                    </span>
                                    <span
                                      className={`text-xs ${
                                        active
                                          ? "text-primary-content/80"
                                          : "text-base-content/50"
                                      }`}
                                    >
                                      {subItem.description}
                                    </span>
                                  </div>
                                  {active && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-2 rounded-r-full"></div>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    </li>
                  );
                }

                const active = isActive(item.to);

                return (
                  <li key={index}>
                    <Link
                      to={item.to}
                      title={item.description}
                      className={`group relative font-medium transition-all duration-200
      ${active ? "bg-0" : "hover:bg-0"}
    `}
                      onClick={handleCloseMobileMenu}
                    >
                      <Icon
                        className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                          active
                            ? "text-white"
                            : "text-base-content/70 group-hover:text-white"
                        }`}
                      />

                      <div className="flex flex-col items-start">
                        <span
                          className={`text-sm font-semibold transition-colors ${
                            active
                              ? "text-white"
                              : "text-base-content group-hover:text-white"
                          }`}
                        >
                          {item.title}
                        </span>

                        <span
                          className={`text-xs transition-colors ${
                            active
                              ? "text-white"
                              : "text-base-content/70 group-hover:text-white"
                          }`}
                        >
                          {item.description}
                        </span>
                      </div>

                      {active && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-2 rounded-r-full" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-2 hidden lg:block border-t border-base-300 bg-3">
            <div className="dropdown dropdown-top dropdown-end w-full">
              <div
                tabIndex={0}
                role="button"
                className="flex items-center bg-4 gap-3 px-2 py-2 rounded-lg hover:bg-base-200 transition-colors cursor-pointer w-full"
              >
                <div className="avatar placeholder">
                  <div className="bg-0 text-primary-content rounded-full w-10 flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {user?.nama?.substring(0, 2).toUpperCase() || "AD"}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {user?.nama || "AD"}
                  </p>
                  <p className="text-xs text-base-content truncate">
                    {user?.email || "sandigi@email.com"}
                  </p>
                </div>
                <ChevronUp className="h-4 w-4 text-base-content/50" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow-lg border border-base-300 mb-2"
              >
                {/* <li>
                  <Link
                    to="/admin/profile"
                    className="gap-2"
                    onClick={handleCloseMobileMenu}
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">Profil</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/settings"
                    className="gap-2"
                    onClick={handleCloseMobileMenu}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Pengaturan</span>
                  </Link>
                </li>
                <div className="divider my-1"></div> */}
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 text-error hover:bg-error hover:text-error-content px-4 py-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
