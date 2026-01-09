import { BarChart3, Clock, Target } from "lucide-react";
const APP_NAME = import.meta.env.VITE_APP_NAME || "SANDIGI";
export default function FeaturesSection() {
  const features = [
    {
      icon: Clock,
      title: "Informasi Antrian Real-Time",
      description:
        "Status dan panggilan antrian diperbarui secara langsung sehingga waktu tunggu lebih jelas dan terkontrol.",
    },
    {
      icon: BarChart3,
      title: "Dashboard Pengelolaan Antrian",
      description:
        "Petugas dapat memantau, mengelola, dan mengatur alur antrian melalui dashboard terpusat.",
    },
    {
      icon: Target,
      title: "Mudah Digunakan",
      description:
        "Antarmuka dirancang sederhana agar mudah digunakan oleh masyarakat maupun petugas layanan.",
    },
  ];

  return (
    <section className="py-20 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Fitur Utama <span className="color-0">{APP_NAME}</span>
          </h2>
          <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
            Fitur-fitur unggulan yang membuat pengalaman antrian Anda lebih
            menyenangkan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card bg-base-200 hover:shadow-lg transition-shadow"
              >
                <div className="card-body">
                  <Icon className="w-12 h-12 color-0 mb-4" />
                  <h3 className="card-title text-xl">{feature.title}</h3>
                  <p className="text-base-content/80">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
