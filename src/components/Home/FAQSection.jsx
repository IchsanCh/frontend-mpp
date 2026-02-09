import { useState, useRef, useEffect } from "react";
import { faqPublic } from "../../services/faq";

export default function FAQSection() {
  const STEP = 5;
  const [visibleCount, setVisibleCount] = useState(STEP);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await faqPublic.getAllPublic();
      setFaqs(response.data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  if (loading) {
    return (
      <section id="faq" className="py-20 bg-base-100">
        <div className="container mx-auto px-4 text-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

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
              <div key={faq.id} className="collapse collapse-arrow bg-base-300">
                <input
                  type="radio"
                  name="faq-accordion"
                  aria-label={faq.question}
                />
                <div className="collapse-title font-medium">{faq.question}</div>
                <div className="collapse-content">
                  {renderAnswer(faq.answer)}
                </div>
              </div>
            ))}
          </div>

          {faqs.length > STEP && (
            <div className="text-center pt-6">
              <button
                className="btn bg-0 rounded-md text-white font-semibold hover:bg-white hover:text-black hover:border hover:border-black hover:scale-105 duration-300 transition-all"
                onClick={handleToggle}
              >
                {isExpanded ? "Tampilkan Lebih Sedikit" : "Tampilkan Semua"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
