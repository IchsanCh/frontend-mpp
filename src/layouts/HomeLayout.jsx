import usePageTitle from "../hooks/UsePageTitle";
import PublikNavbar from "../components/PublikNavbar";
import Footer from "../components/Footer";

export default function HomeLayout({ title, children }) {
  usePageTitle(title);

  return (
    <div className="min-h-screen flex flex-col">
      <PublikNavbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
