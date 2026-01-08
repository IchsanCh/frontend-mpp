import { authService } from "../services/api";

export default function Dashboard() {
  const user = authService.getUser();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard Antrian</h1>

      <pre className="mt-4 bg-gray-100 p-4 rounded text-sm">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}
