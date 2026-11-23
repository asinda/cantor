import { Music } from "lucide-react";

/**
 * Bandeau citation, recréé en HTML/CSS (net à toutes les tailles, sans bord d'image visible).
 * Inspiré de l'image `public/images/dashboard/citation-banniere.png`.
 */
export default function QuoteBanner() {
  return (
    <figure className="relative m-0 flex min-h-[110px] items-center overflow-hidden rounded-[18px] bg-navy px-6 py-5 md:min-h-[130px] md:rounded-[20px] md:px-14">
      <blockquote className="relative m-0 font-script text-[24px] leading-tight text-white md:text-[32px]">
        <p className="m-0 -rotate-3">Chanter ensemble,<br />c’est prier deux fois.</p>
        <span aria-hidden className="mt-2 block h-[3px] w-24 -rotate-3 rounded-full bg-sun/80" />
      </blockquote>
      {/* Notes décoratives */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-6 hidden items-center gap-4 text-sun/40 sm:flex md:right-14">
        <Music className="h-10 w-10 -rotate-12" strokeWidth={1.5} />
        <Music className="mb-8 h-14 w-14 rotate-6" strokeWidth={1.25} />
        <Music className="mt-6 h-8 w-8 -rotate-6" strokeWidth={1.5} />
      </div>
    </figure>
  );
}
