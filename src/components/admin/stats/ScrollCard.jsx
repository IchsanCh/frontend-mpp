import { Crown, Medal, Award } from "lucide-react";

export default function ScrollCard({ title, data, icon }) {
  const topThree = data.slice(0, 3);

  return (
    <div className="card bg-white shadow-xl border-2 border-[#ceab93]">
      <div className="card-body p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8c6a4b] to-[#ad8b73] flex items-center justify-center">
            {icon}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-[#8c6a4b]">
            {title}
          </h2>
        </div>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-[#ceab93] mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-[#ad8b73] font-medium">Tidak ada data</p>
            <p className="text-sm text-[#ceab93] mt-1">
              Belum ada kunjungan pada periode ini
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-[350px] md:max-h-[420px] overflow-y-auto space-y-2 md:space-y-3 pr-2 custom-scrollbar">
              {data.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 md:p-4 rounded-lg bg-gradient-to-r from-[#fffbe9] to-[rgba(227,202,165,0.3)] hover:from-[rgba(227,202,165,0.4)] hover:to-[#fffbe9] transition-all duration-200 border-2 border-transparent hover:border-[#ceab93] group"
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div
                      className={`
                  flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold
                  ${
                    i === 0
                      ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg"
                      : ""
                  }
                  ${
                    i === 1
                      ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md"
                      : ""
                  }
                  ${
                    i === 2
                      ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md"
                      : ""
                  }
                  ${i > 2 ? "bg-[#ceab93] text-[#8c6a4b]" : ""}
                `}
                    >
                      {i === 0 && <Crown className="w-3 h-3 md:w-4 md:h-4" />}
                      {i === 1 && <Medal className="w-3 h-3 md:w-4 md:h-4" />}
                      {i === 2 && <Award className="w-3 h-3 md:w-4 md:h-4" />}
                      {i > 2 && i + 1}
                    </div>

                    <div className="font-semibold text-[#8c6a4b] text-sm md:text-base truncate group-hover:text-[#ad8b73] transition-colors">
                      {item.nama}
                    </div>
                  </div>

                  <div className="badge badge-lg md:badge-xl bg-gradient-to-r from-[#8c6a4b] to-[#ad8b73] text-white font-bold border-0 shadow-md flex-shrink-0 ml-2">
                    <span className="text-xs md:text-sm">{item.total}</span>
                    <span className="hidden sm:inline text-xs ml-1 opacity-80">
                      pengunjung
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-[#e3caa5]">
              <div className="text-xs md:text-sm text-[#ad8b73] text-center">
                Menampilkan{" "}
                <span className="font-bold text-[#8c6a4b]">{data.length}</span>{" "}
                data teratas
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
