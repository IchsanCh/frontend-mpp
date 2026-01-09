import usePageTitle from "../hooks/UsePageTitle";

export default function MainLayout({ title, children }) {
  usePageTitle(title);

  return <div className="min-h-screen">{children}</div>;
}
