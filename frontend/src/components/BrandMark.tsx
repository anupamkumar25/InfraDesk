import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  label?: string;
  className?: string;
};

export default function BrandMark({
  href = "/",
  label = "InfraDesk",
  className = "",
}: BrandMarkProps) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 ${className}`}>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-cyan-300/45 bg-cyan-400/10">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 14.5V9.8a2 2 0 0 1 .94-1.7l4.06-2.6a2 2 0 0 1 2.1 0l4.06 2.6A2 2 0 0 1 18 9.8v4.7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M5 14.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9.5 14.5V19h5v-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span>{label}</span>
    </Link>
  );
}
