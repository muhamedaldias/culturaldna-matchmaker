import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelixMark } from "@/components/marks";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="shell flex min-h-[62vh] flex-col justify-center py-24">
      <div className="flex items-center gap-3">
        <HelixMark className="h-8 w-auto text-ink" />
        <p className="label text-ink-3">404 · No such file</p>
      </div>
      <h1 className="mt-8 max-w-[18ch] font-display text-[clamp(2.6rem,6vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.035em]">
        This case is not in the archive.
      </h1>
      <p className="mt-5 max-w-[52ch] text-[0.95rem] leading-relaxed text-ink-2">
        The page you asked for was never filed. Run a pairing instead — the archive replays in
        about three seconds, and every memo states its own limits.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/match" className="btn btn-primary">
          Run a match
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/" className="btn btn-ghost">
          Back to the desk
        </Link>
      </div>
    </div>
  );
}
