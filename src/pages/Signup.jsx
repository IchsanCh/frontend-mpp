export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Daftar Akun</h2>

          <input className="input input-bordered w-full" placeholder="Nama" />
          <input className="input input-bordered w-full" placeholder="Email" />
          <input
            type="password"
            className="input input-bordered w-full"
            placeholder="Password"
          />

          <button className="btn btn-primary w-full">Daftar</button>
        </div>
      </div>
    </div>
  );
}
