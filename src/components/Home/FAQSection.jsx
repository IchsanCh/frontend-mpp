export default function FAQSection() {
  const faqs = [
    {
      question: "Bagaimana cara mengambil nomor antrian?",
      answer:
        "Pemohon dapat mengambil nomor antrian melalui sistem antrian digital yang tersedia di Mall Pelayanan Publik sesuai dengan layanan yang dibutuhkan.",
    },
    {
      question: "Apakah nomor antrian harus diambil langsung di lokasi?",
      answer:
        "Ya, pengambilan nomor antrian dilakukan di lokasi Mall Pelayanan Publik melalui perangkat yang telah disediakan.",
    },
    {
      question: "Apa yang harus dilakukan setelah mengambil nomor antrian?",
      answer:
        "Setelah mengambil nomor antrian, pemohon diminta untuk menunggu hingga nomor tersebut dipanggil sesuai urutan pada layar pemanggilan.",
    },
    {
      question: "Bagaimana jika nomor antrian terlewat?",
      answer:
        "Jika nomor antrian terlewat, pemohon dapat menghubungi atau melapor kepada petugas untuk mendapatkan arahan lebih lanjut sesuai kebijakan layanan.",
    },
    {
      question:
        "Apakah satu orang bisa mengambil lebih dari satu nomor antrian?",
      answer:
        "Setiap pemohon hanya diperbolehkan mengambil satu nomor antrian untuk satu layanan agar proses berjalan tertib dan adil.",
    },
  ];

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
          {faqs.map((faq, index) => (
            <div key={index} className="collapse collapse-arrow bg-base-300">
              <input
                type="radio"
                name="faq-accordion"
                defaultChecked={index === 0}
              />

              <div className="collapse-title text-lg font-medium">
                {faq.question}
              </div>

              <div className="collapse-content text-base-content/85">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
