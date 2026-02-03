import usePageTitle from "../hooks/UsePageTitle";
import SideBar from "../components/admin/SideBar";
import FooterAdmin from "../components/admin/FooterAdmin";

export default function AdminLayout({ title, children }) {
  usePageTitle(title);

  return (
    <div className="min-h-screen">
      <SideBar>
        {children}
        <FooterAdmin />
      </SideBar>
    </div>
  );
}
