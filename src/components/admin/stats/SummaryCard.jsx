export default function SummaryCard({ title, value, icon, gradient }) {
  return (
    <div className="card bg-white shadow-lg border-2 border-[#ceab93] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="card-body p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs md:text-sm font-semibold text-[#ad8b73] mb-1">
              {title}
            </div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#8c6a4b]">
              {value.toLocaleString("id-ID")}
            </div>
          </div>
          <div
            className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
