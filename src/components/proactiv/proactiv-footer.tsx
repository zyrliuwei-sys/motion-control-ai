import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { BuiltWithMotionControlAi } from '@/components/built-with-motion-control-ai';
import { MotionControlMark } from '@/components/motion-control-mark';

export interface ProactivFooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface ProactivFooterColumn {
  title: string;
  links: readonly ProactivFooterLink[];
}

export interface ProactivFooterProps {
  brand: string;
  brandHref?: string;
  copyright: string;
  rights: string;
  columns: readonly ProactivFooterColumn[];
  className?: string;
}

function isExternalHref(href: string, external?: boolean) {
  return external ?? /^(?:https?:)?\/\//.test(href);
}

/**
 * Footer chrome for the Proactiv landing page. All copy and destinations are
 * page data so blocks can localize without the component reading i18n itself.
 */
export function ProactivFooter({
  brand,
  brandHref = '/',
  copyright,
  rights,
  columns,
  className,
}: ProactivFooterProps) {
  return (
    <footer
      className={cn(
        'border-t border-[#171717] bg-[#08090a] px-8 pt-20 pb-32 text-white',
        className
      )}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-14 sm:flex-row sm:gap-10">
        <div className="flex max-w-sm flex-col items-start">
          <Link
            href={brandHref}
            aria-label={`${brand} home`}
            className="inline-flex items-center gap-2 rounded-[6px] text-sm font-bold tracking-[-0.02em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#39c3ef]"
          >
            <MotionControlMark aria-hidden="true" className="size-7" />
            <span className="tracking-[-0.04em]">{brand}</span>
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-3 text-[#a3a3a3]">
            <span className="text-xs">{copyright}</span>
            <span className="text-sm">{rights}</span>
            <BuiltWithMotionControlAi className="border-[#303030] bg-[#171717] text-xs text-[#d4d4d4] hover:border-[#525252] hover:bg-[#262626]" />
          </div>
        </div>

        <nav
          aria-label="Footer navigation"
          className="grid shrink-0 grid-cols-3 gap-10"
        >
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-medium text-white sm:text-sm">
                {column.title}
              </p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    {isExternalHref(link.href, link.external) ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#a3a3a3] transition-colors duration-200 hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#39c3ef] sm:text-sm"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-xs text-[#a3a3a3] transition-colors duration-200 hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#39c3ef] sm:text-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
