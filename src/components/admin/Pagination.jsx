const Pagination = ({ page, totalPages, totalItems, limit, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  const pages = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);

    if (page > 4) pages.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 3) pages.push("...");

    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-0 items-center justify-between mt-6">
      <p className="text-sm text-base-content/70">
        Menampilkan{" "}
        <span className="font-semibold">
          {startItem}-{endItem}
        </span>{" "}
        dari <span className="font-semibold">{totalItems}</span> data
      </p>

      <div className="join">
        <button
          className="join-item btn btn-sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          «
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <button key={i} className="join-item btn btn-sm btn-disabled">
              …
            </button>
          ) : (
            <button
              key={i}
              className={`join-item btn btn-sm ${
                p === page ? "btn-active bg-0 text-primary-content" : ""
              }`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="join-item btn btn-sm"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          »
        </button>
      </div>
    </div>
  );
};

export default Pagination;
