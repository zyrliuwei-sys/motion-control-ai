import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import {
  AnimatePresence,
  m,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';

import { Link } from '@/core/i18n/navigation';
import { MotionControlMark } from '@/components/motion-control-mark';

export interface ProactivNavLink {
  href: string;
  label: string;
}

export interface ProactivNavProps {
  /** Text rendered beside the local Proactiv mark. */
  brand?: string;
  /** Destination used by the brand mark. */
  brandHref?: string;
  links?: ProactivNavLink[];
  loginLabel?: string;
  loginHref?: string;
  demoLabel?: string;
  demoHref?: string;
}

const defaultLinks: ProactivNavLink[] = [
  { label: 'Pricing', href: '#pricing' },
];

/**
 * A self-contained navigation surface for the Proactiv marketing pages.
 * Its copy is intentionally supplied by props so page blocks can localize it.
 */
export function ProactivNav({
  brand = 'Proactiv',
  brandHref = '/',
  links = defaultLinks,
  loginLabel = 'Login',
  loginHref = '/sign-in',
  demoLabel = 'Book a demo',
  demoHref = '/book-demo',
}: ProactivNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const { scrollY } = useScroll();
  const compactScale = useTransform(scrollY, [0, 100], [1, 0.8]);
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ['rgba(23, 23, 23, 0)', 'rgb(23, 23, 23)']
  );
  const insetLineOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50">
      <m.div
        className="pointer-events-auto relative mx-auto flex w-[95%] max-w-[1280px] items-center justify-between rounded-[6px] px-3 py-2.5 text-white max-lg:w-full lg:px-4"
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.8,
          ease: [0.6, 0.05, 0.1, 0.9],
        }}
        style={{
          backgroundColor,
          scale: reduceMotion ? 1 : compactScale,
          transformOrigin: 'top center',
        }}
      >
        <m.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[6px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          style={{ opacity: reduceMotion ? 0 : insetLineOpacity }}
        />

        <Brand brand={brand} href={brandHref} />

        <nav
          aria-label="Main navigation"
          className="relative hidden items-center gap-1 lg:flex"
        >
          {links.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="rounded-[6px] px-4 py-2 text-sm text-white transition-all duration-200 hover:bg-[#262626] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c3ef]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="relative hidden items-center gap-2 lg:flex">
          <Link
            href={loginHref}
            className="rounded-[6px] border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c3ef]"
          >
            {loginLabel}
          </Link>
          <DemoLink href={demoHref} label={demoLabel} />
        </div>

        <button
          type="button"
          className="relative inline-flex size-10 items-center justify-center rounded-[6px] text-white transition-colors hover:bg-[#262626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c3ef] lg:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="proactiv-mobile-menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" strokeWidth={1.8} />
        </button>
      </m.div>

      <AnimatePresence>
        {mobileOpen && (
          <m.div
            id="proactiv-mobile-menu"
            className="pointer-events-auto fixed inset-0 z-[60] flex min-h-dvh flex-col bg-[#08090a] px-6 py-5 text-white"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <div className="flex items-center justify-between">
              <Brand brand={brand} href={brandHref} onClick={closeMobileMenu} />
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-[6px] transition-colors hover:bg-[#171717] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c3ef]"
                aria-label="Close menu"
                onClick={closeMobileMenu}
              >
                <X className="size-6" strokeWidth={1.7} />
              </button>
            </div>

            <nav
              aria-label="Mobile navigation"
              className="mt-auto flex flex-col gap-2 pb-12"
            >
              {links.map((link, index) => (
                <m.div
                  key={`${link.href}-${link.label}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : index * 0.06,
                    duration: 0.25,
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="block py-2 text-[26px] leading-tight font-medium text-white transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#39c3ef]"
                  >
                    {link.label}
                  </Link>
                </m.div>
              ))}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={loginHref}
                  onClick={closeMobileMenu}
                  className="rounded-[6px] border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#171717] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c3ef]"
                >
                  {loginLabel}
                </Link>
                <DemoLink
                  href={demoHref}
                  label={demoLabel}
                  onClick={closeMobileMenu}
                />
              </div>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Brand({
  brand,
  href,
  onClick,
}: {
  brand: string;
  href: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={`${brand} home`}
      className="relative inline-flex items-center gap-2 rounded-[6px] text-sm font-bold tracking-[-0.02em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#39c3ef]"
    >
      <MotionControlMark aria-hidden="true" className="size-7" />
      <span className="tracking-[-0.04em]">{brand}</span>
    </Link>
  );
}

function DemoLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group hidden items-center gap-1.5 rounded-[6px] bg-[#39c3ef] px-4 py-2 text-sm font-medium text-black transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
    >
      {label}
      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
