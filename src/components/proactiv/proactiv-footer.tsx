import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { BrandWordmark } from '@/components/brand-wordmark';

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
  return (
    external || /^(?:https?:)?\/\//.test(href) || href.startsWith('mailto:')
  );
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
        'relative overflow-hidden border-t border-[#e8e5e6] bg-white px-5 pt-14 text-[#18181b] sm:px-8 sm:pt-20',
        className
      )}
    >
      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col items-start gap-12 text-sm text-[#71717a] lg:flex-row lg:justify-center lg:gap-64">
        <div className="max-w-xs">
          <Link
            href={brandHref}
            aria-label={`${brand} home`}
            className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18181b]"
          >
            <BrandWordmark brand={brand} />
          </Link>

          <p className="mt-5 max-w-[17rem] text-sm leading-6 text-[#71717a]">
            {copyright} {rights}
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="grid w-full grid-cols-2 gap-x-8 gap-y-10 sm:max-w-2xl lg:w-auto lg:gap-x-32"
        >
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-bold text-[#3f3f46]">{column.title}</p>
              <ul className="mt-4 space-y-3.5">
                {column.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    {isExternalHref(link.href, link.external) ? (
                      <a
                        href={link.href}
                        target={
                          /^(?:https?:)?\/\//.test(link.href)
                            ? '_blank'
                            : undefined
                        }
                        rel={
                          /^(?:https?:)?\/\//.test(link.href)
                            ? 'noopener noreferrer'
                            : undefined
                        }
                        className="text-sm whitespace-nowrap text-[#71717a] transition-colors duration-200 hover:text-[#18181b] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#18181b]"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm whitespace-nowrap text-[#71717a] transition-colors duration-200 hover:text-[#18181b] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#18181b]"
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

      <p
        aria-hidden="true"
        className="pointer-events-none mx-auto mt-16 max-w-[1600px] bg-gradient-to-b from-[#fafafa] to-[#e5e5e5] bg-clip-text text-center text-[clamp(4.5rem,14vw,13rem)] leading-[0.78] font-black tracking-[-0.09em] whitespace-nowrap text-transparent select-none"
      >
        {brand}
      </p>
    </footer>
  );
}
