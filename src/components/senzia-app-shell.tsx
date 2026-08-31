import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Clapperboard,
  Compass,
  Grid2X2,
  House,
  Image,
  ImagePlay,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  WandSparkles,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { getLocale, setLocale } from '@/paraglide/runtime.js';
import { BrandWordmark } from '@/components/brand-wordmark';

export interface SenziaNavItem {
  id: string;
  label: string;
  active?: boolean;
  href?: string;
}

export interface SenziaNavGroup {
  label?: string;
  items: SenziaNavItem[];
}

export interface SenziaAppShellProps {
  brand: string;
  brandHref: string;
  languageLabel: string;
  demoLabel: string;
  demoHref: string;
  collapseSidebarLabel: string;
  expandSidebarLabel: string;
  navGroups: SenziaNavGroup[];
  children: ReactNode;
}

const navItemClass =
  'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm leading-5 text-[#627181] transition-colors duration-150 ease-out hover:bg-white hover:text-[#15202b] focus-visible:bg-white focus-visible:text-[#15202b] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c92f68]';

/**
 * Light application chrome for a text-to-video workspace. All display copy and
 * navigational targets are supplied by the owning page/block.
 */
export function SenziaAppShell({
  brand,
  brandHref,
  languageLabel,
  demoLabel,
  demoHref,
  collapseSidebarLabel,
  expandSidebarLabel,
  navGroups,
  children,
}: SenziaAppShellProps) {
  const locale = getLocale();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const mobileItems = navGroups.flatMap((group) =>
    group.items.filter((item) => item.active)
  );

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  };

  useEffect(() => {
    const savedState = window.localStorage.getItem('proactiv-sidebar-open');
    if (savedState === 'false') setIsSidebarOpen(false);
  }, []);

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
    window.localStorage.setItem('proactiv-sidebar-open', String(open));
  };

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#fff8fa] text-[#15202b]">
      <header className="flex h-12 items-center justify-between border-b border-[#d6e0e7] bg-white px-3 sm:px-5">
        <Link
          href={brandHref}
          className="inline-flex min-w-0 items-center gap-2.5 rounded-lg pr-2 text-base font-semibold tracking-[-0.02em] text-[#15202b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
        >
          <BrandWordmark brand={brand} className="truncate" />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleLocale}
            className="hidden rounded-lg px-2.5 py-2 text-xs font-medium text-[#627181] transition-colors duration-150 ease-out hover:bg-[#fff1f5] hover:text-[#15202b] focus-visible:bg-[#fff1f5] focus-visible:text-[#15202b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
          >
            {languageLabel}
          </button>
          <Link
            href={demoHref}
            className="hidden rounded-lg bg-[#c92f68] px-3 py-1.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[#a62150] focus-visible:bg-[#a62150] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
          >
            {demoLabel}
          </Link>
        </div>
      </header>

      <MobileNav items={mobileItems} />

      <div
        className="flex min-h-[calc(100dvh-3rem)] min-w-0"
        style={
          {
            '--app-sidebar-width': isSidebarOpen ? '14rem' : '0rem',
          } as CSSProperties
        }
      >
        <aside
          className={`relative sticky top-12 hidden h-[calc(100dvh-3rem)] shrink-0 overflow-x-hidden overflow-y-auto bg-[#fff1f5] transition-[width,padding,border-color] duration-300 ease-out md:block ${
            isSidebarOpen
              ? 'w-56 border-r border-[#d6e0e7] p-3'
              : 'w-0 border-r-0 p-0'
          }`}
          aria-hidden={!isSidebarOpen}
        >
          <div
            className={`w-[200px] transition-[opacity,transform] duration-200 ease-out ${
              isSidebarOpen
                ? 'translate-x-0 opacity-100'
                : 'pointer-events-none -translate-x-3 opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 grid size-9 place-items-center rounded-xl border border-[#d6e0e7] bg-white text-[#627181] shadow-sm transition hover:border-[#efb0c4] hover:bg-[#fff0f5] hover:text-[#c92f68] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
              aria-label={collapseSidebarLabel}
              title={collapseSidebarLabel}
            >
              <PanelLeftClose className="size-4" aria-hidden="true" />
            </button>
            <nav className="space-y-5 pt-12">
              {navGroups.map((group, groupIndex) => (
                <section key={`${group.label ?? 'group'}-${groupIndex}`}>
                  {group.label ? (
                    <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.1em] text-[#71808d] uppercase">
                      {group.label}
                    </p>
                  ) : null}
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavigationItem key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </nav>
          </div>
        </aside>

        <main className="relative min-w-0 flex-1">
          {!isSidebarOpen ? (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute top-3 left-3 z-50 hidden size-9 place-items-center rounded-xl border border-[#d6e0e7] bg-white/95 text-[#627181] shadow-[0_8px_20px_rgba(21,32,43,0.12)] backdrop-blur transition hover:border-[#efb0c4] hover:bg-[#fff0f5] hover:text-[#c92f68] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68] md:grid"
              aria-label={expandSidebarLabel}
              title={expandSidebarLabel}
            >
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            </button>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

function MobileNav({ items }: { items: SenziaNavItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="border-b border-[#d6e0e7] bg-[#fff1f5] px-2 py-2 md:hidden">
      <div className="flex min-w-0 gap-1 overflow-x-auto pb-px">
        {items.map((item) => (
          <NavigationItem key={item.id} item={item} compact />
        ))}
      </div>
    </nav>
  );
}

function NavigationItem({
  item,
  compact = false,
}: {
  item: SenziaNavItem;
  compact?: boolean;
}) {
  const Icon = getNavigationIcon(item.id);
  const className = `${navItemClass}${
    item.active ? ' text-[#15202b]' : ''
  }${compact ? ' w-auto shrink-0 whitespace-nowrap' : ''}`;
  const content = (
    <>
      <Icon
        aria-hidden="true"
        className="size-4 shrink-0 text-[#71808d] group-hover:text-[#c92f68]"
        strokeWidth={1.8}
      />
      <span className="truncate">{item.label}</span>
    </>
  );

  return (
    <Link
      href={item.href ?? '/text-to-image'}
      className={className}
      aria-current={item.active ? 'page' : undefined}
    >
      {content}
    </Link>
  );
}

function getNavigationIcon(id: string) {
  const normalizedId = id.toLowerCase();

  if (normalizedId.includes('text') || normalizedId.includes('prompt')) {
    return WandSparkles;
  }
  if (
    normalizedId.includes('image-to-video') ||
    normalizedId.includes('image-video')
  ) {
    return ImagePlay;
  }
  if (normalizedId.includes('image')) return Image;
  if (normalizedId.includes('extend') || normalizedId.includes('video')) {
    return Clapperboard;
  }
  if (normalizedId.includes('edit')) return SlidersHorizontal;
  if (normalizedId.includes('explore')) return Compass;
  if (normalizedId.includes('home')) return House;

  return Grid2X2;
}
