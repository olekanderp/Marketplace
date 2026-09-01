import Link from "next/link";

export function Pagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number;
  pageCount: number;
  makeHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 2,
  );

  return (
    <nav className="mt-6 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className="btn-ghost btn-sm">
          Prev
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && <span className="text-muted">…</span>}
          <Link
            href={makeHref(p)}
            className={`btn-sm rounded-full px-3 py-1.5 ${
              p === page ? "bg-ink text-white" : "btn-ghost"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={makeHref(page + 1)} className="btn-ghost btn-sm">
          Next
        </Link>
      )}
    </nav>
  );
}
