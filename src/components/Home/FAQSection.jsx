import { useState, useRef, useEffect } from "react";

export default function FAQSection() {
  const STEP = 5;
  const [visibleCount, setVisibleCount] = useState(STEP);
  const listRef = useRef(null);

  const faqs = [
    {
      question: "Apa itu SANDIGI?",
      answer:
        "SANDIGI (Sistem Antrian Digital) adalah sistem antrian yang digunakan di Mal Pelayanan Publik (MPP) untuk membantu pengunjung mendapatkan layanan secara tertib, nyaman, dan efisien.",
    },
    {
      question: "Mengapa MPP menggunakan SANDIGI?",
      answer:
        "SANDIGI digunakan untuk:\n\nMenghindari antrean panjang\n\nMembantu pengunjung mengetahui urutan layanan\n\nMenjadikan proses pelayanan lebih cepat dan teratur",
    },
    {
      question: "Bagaimana cara mengambil nomor antrian di MPP?",
      answer:
        "Pengunjung dapat mengambil nomor antrian melalui:\n\nMesin kios antrian yang tersedia di area MPP\n\nBantuan petugas layanan, jika mengalami kesulitan",
    },
    {
      question: "Apakah saya harus datang lebih awal untuk mengambil antrian?",
      answer:
        "Disarankan datang sesuai jam operasional MPP. Nomor antrian akan dipanggil berdasarkan urutan pengambilan dan ketersediaan loket layanan.",
    },
    {
      question: "Apakah setiap layanan memiliki nomor antrian yang berbeda?",
      answer:
        "Ya. Setiap jenis layanan dan gerai di MPP memiliki nomor antrian masing-masing agar proses pelayanan berjalan lebih tertib.",
    },
    {
      question: "Bagaimana cara mengetahui nomor antrian saya dipanggil?",
      answer:
        "Nomor antrian akan ditampilkan melalui:\n\nLayar informasi (display) MPP\n\nPengumuman suara (audio)\n\nPastikan Anda memperhatikan layar dan pengumuman di area layanan.",
    },
    {
      question: "Apa yang harus dilakukan jika nomor antrian saya terlewat?",
      answer:
        "Jika nomor antrian terlewat:\n\nSegera laporkan ke petugas layanan\n\nPetugas akan membantu sesuai dengan ketentuan yang berlaku",
    },
    {
      question:
        "Apakah satu nomor antrian bisa digunakan untuk beberapa layanan?",
      answer:
        "Tidak. Setiap layanan memerlukan nomor antrian tersendiri agar pelayanan dapat berjalan adil dan teratur.",
    },
    {
      question:
        "Apakah saya boleh meninggalkan area MPP saat menunggu antrian?",
      answer:
        "Pengunjung boleh meninggalkan area sejenak, namun disarankan tetap berada di sekitar MPP agar tidak melewatkan panggilan antrian.",
    },
    {
      question:
        "Apakah SANDIGI bisa digunakan oleh lansia dan penyandang disabilitas?",
      answer:
        "Ya. MPP menyediakan bantuan petugas untuk membantu lansia, penyandang disabilitas, ibu hamil, dan pengunjung yang membutuhkan pendampingan.",
    },
    {
      question: "Apakah data saya aman saat menggunakan SANDIGI?",
      answer:
        "Ya. Data yang digunakan dalam SANDIGI hanya untuk keperluan pelayanan dan dikelola sesuai dengan ketentuan yang berlaku.",
    },
    {
      question: "Siapa yang dapat saya hubungi jika mengalami kendala?",
      answer:
        "Jika mengalami kendala:\n\nHubungi petugas informasi MPP\n\nDatangi meja layanan/pengaduan yang tersedia",
    },
    {
      question: "Apakah penggunaan SANDIGI dikenakan biaya?",
      answer: "Tidak. Penggunaan SANDIGI di MPP tidak dipungut biaya (gratis).",
    },
    {
      question: "Apakah SANDIGI mendukung pelayanan yang transparan dan adil?",
      answer:
        "Ya. SANDIGI membantu memastikan pelayanan di MPP dilakukan secara adil, transparan, dan sesuai urutan antrian.",
    },
  ];

  useEffect(() => {
    // Reset scroll position when items change
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [visibleCount]);

  const isExpanded = visibleCount >= faqs.length;

  const handleToggle = () => {
    if (isExpanded) {
      setVisibleCount(STEP);
    } else {
      setVisibleCount(faqs.length);
    }
  };

  const renderAnswer = (text) => {
    const blocks = text.split("\n\n").filter(Boolean);

    return (
      <div className="space-y-2 text-base-content/90">
        {blocks.map((block, i) => {
          if (block.trim().endsWith(":")) {
            return (
              <p key={i} className="font-medium">
                {block}
              </p>
            );
          }

          if (i > 0 && !block.endsWith(".") && !block.endsWith("?")) {
            return (
              <ul key={i} className="list-disc ml-5 space-y-1">
                <li>{block}</li>
              </ul>
            );
          }

          return <p key={i}>{block}</p>;
        })}
      </div>
    );
  };

  return (
    <section id="faq" className="py-20 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-lg text-base-content/80">
            Informasi penting seputar penggunaan sistem antrian digital
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          <div ref={listRef} className="space-y-4">
            {faqs.slice(0, visibleCount).map((faq, index) => (
              <div key={index} className="collapse collapse-arrow bg-base-300">
                <input type="radio" name="faq-accordion" />
                <div className="collapse-title font-medium">{faq.question}</div>
                <div className="collapse-content">
                  {renderAnswer(faq.answer)}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-6">
            <button
              className="btn bg-0 rounded-md text-white font-semibold hover:bg-white hover:text-black hover:border hover:border-black hover:scale-105 duration-300 transition-all"
              onClick={handleToggle}
            >
              {isExpanded ? "Show Less" : "Load More"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
