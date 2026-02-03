import usePageTitle from "../hooks/UsePageTitle";

export default function AntrianLayout({ title, children }) {
  usePageTitle(title);

  return (
    <div className="min-h-screen flex flex-col">
      <main>{children}</main>
    </div>
  );
}
