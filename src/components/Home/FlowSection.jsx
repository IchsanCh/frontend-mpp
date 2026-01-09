import { MapPin, Smartphone, Clock, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Datang ke Mall Pelayanan Publik",
    desc: "Pemohon datang langsung ke lokasi layanan.",
  },
  {
    icon: Smartphone,
    title: "Ambil Nomor Antrian",
    desc: "Nomor antrian diambil melalui sistem digital.",
  },
  {
    icon: Clock,
    title: "Menunggu Panggilan",
    desc: "Menunggu hingga nomor dipanggil sesuai urutan.",
  },
  {
    icon: CheckCircle,
    title: "Dilayani Petugas",
    desc: "Pelayanan diberikan oleh petugas terkait.",
  },
];

export default function FlowSection() {
  return (
    <section className="py-20 bg-base-200">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Alur Penggunaan Sistem Antrian
          </h2>
          <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
            Proses antrian dirancang sederhana agar pemohon dapat dilayani
            dengan tertib dan efisien.
          </p>
        </div>

        <div className="space-y-4 lg:hidden max-w-xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-4 bg-base-100 p-4 rounded-lg shadow-sm"
              >
                <div className="flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-base-content/80">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden lg:block max-w-5xl mx-auto">
          <ul className="steps steps-horizontal w-full">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={index} className="step step-color-0">
                  <div className="flex flex-col items-center gap-3">
                    <Icon className="w-8 h-8" />
                    <span className="font-semibold text-center">
                      {step.title}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
