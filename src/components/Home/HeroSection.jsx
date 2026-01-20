import { Link } from "react-router-dom";
import heroImage from "../../assets/images/hero.svg";

export default function HeroSection() {
  return (
    <div className="hero min-h-[calc(100vh-64px)] bg-gradient-to-r from-base-200 to-base-100">
      <div className="hero-content flex-col md:flex-row items-center text-center lg:text-left py-20">
        <div className="max-w-2xl lg:max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            Kelola Antrian dengan <span className="color0">Mudah</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Sistem antrian digital yang modern dan efisien. Pantau nomor antrian
            dengan mudah dan cepat melalui perangkat Anda.
          </p>

          <div className="flex gap-4 justify-center lg:justify-start mb-12">
            <Link
              to="/antrian"
              className="btn bg-0 text-white hover:bg-white hover:text-black hover:border hover:border-black transition-all duration-200 btn-sm sm:btn-md lg:btn-lg shadow-lg hover:shadow-xl"
            >
              Cek Nomor Antrian
            </Link>
          </div>
        </div>
        <div className="lg:ml-12">
          <img
            src={heroImage}
            alt="Hero Illustration"
            className="w-full max-w-md lg:w-80 lg:max-w-lg h-auto drop-shadow-lgg"
          />
        </div>
      </div>
    </div>
  );
}
