export default function FooterAdmin() {
  return (
    <div className="bg-0 flex flex-col items-center justify-center p-2">
      <span className="text-white font-semibold">
        &copy; {new Date().getFullYear()} SANDIGI - All Right Reserved
      </span>
    </div>
  );
}
