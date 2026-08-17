import type { ReactNode } from 'react';
import {
  Clapperboard,
  Compass,
  Grid2X2,
  House,
  Image,
  ImagePlay,
  SlidersHorizontal,
  WandSparkles,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { getLocale, setLocale } from '@/paraglide/runtime.js';

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
  loginLabel: string;
  loginHref: string;
  demoLabel: string;
  demoHref: string;
  navGroups: SenziaNavGroup[];
  sidebarPanel?: ReactNode;
  children: ReactNode;
}

const navItemClass =
  'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm leading-5 text-[#abb4c0] transition-colors duration-150 ease-out hover:bg-[#1d242c] hover:text-[#f4f7fa] focus-visible:bg-[#1d242c] focus-visible:text-[#f4f7fa] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#dbe5ee]';

/**
 * Dark application chrome for a text-to-video workspace. All display copy and
 * navigational targets are supplied by the owning page/block.
 */
export function SenziaAppShell({
  brand,
  brandHref,
  languageLabel,
  loginLabel,
  loginHref,
  demoLabel,
  demoHref,
  navGroups,
  sidebarPanel,
  children,
}: SenziaAppShellProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const locale = getLocale();
  const mobileItems = navGroups.flatMap((group) =>
    group.items.filter((item) => item.active)
  );

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#0d1014] text-[#f4f7fa]">
      <header className="flex h-16 items-center justify-between border-b border-[#252b34] bg-[#0d1014] px-3 sm:px-5">
        <Link
          href={brandHref}
          className="inline-flex min-w-0 items-center gap-2.5 rounded-lg pr-2 text-sm font-semibold tracking-[-0.02em] text-[#f4f7fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dbe5ee]"
        >
          <span
            aria-hidden="true"
            className="relative grid size-6 shrink-0 grid-cols-2 gap-1"
          >
            <span className="rounded-[3px] bg-[#e6edf4]" />
            <span className="rounded-[3px] bg-[#7d8793]" />
            <span className="rounded-[3px] bg-[#7d8793]" />
            <span className="rounded-[3px] bg-[#e6edf4]" />
          </span>
          <span className="truncate">{brand}</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleLocale}
            className="hidden rounded-lg px-2.5 py-2 text-xs font-medium text-[#abb4c0] transition-colors duration-150 ease-out hover:bg-[#1d242c] hover:text-[#f4f7fa] focus-visible:bg-[#1d242c] focus-visible:text-[#f4f7fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dbe5ee]"
          >
            {languageLabel}
          </button>
          {user ? (
            <SignedInUser
              name={user.name || user.email}
              email={user.email}
              image={user.image}
            />
          ) : (
            <Link
              href={loginHref}
              className="rounded-lg border border-[#343c47] px-3 py-1.5 text-sm font-medium text-[#e6edf4] transition-colors duration-150 ease-out hover:bg-[#1d242c] focus-visible:bg-[#1d242c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dbe5ee]"
            >
              {loginLabel}
            </Link>
          )}
          <Link
            href={demoHref}
            className="hidden rounded-lg bg-[#e6edf4] px-3 py-1.5 text-sm font-semibold text-[#11151a] transition-colors duration-150 ease-out hover:bg-white focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dbe5ee]"
          >
            {demoLabel}
          </Link>
        </div>
      </header>

      <MobileNav items={mobileItems} />

      <div className="flex min-h-[calc(100dvh-4rem)] min-w-0">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-[#252b34] bg-[#12161c] p-3 md:block">
          <nav className="space-y-5">
            {navGroups.map((group, groupIndex) => (
              <section key={`${group.label ?? 'group'}-${groupIndex}`}>
                {group.label ? (
                  <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.1em] text-[#6f7985] uppercase">
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
          {sidebarPanel ? (
            <div className="mt-5 border-t border-[#252b34] pt-4">
              {sidebarPanel}
            </div>
          ) : null}
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function SignedInUser({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string | null;
}) {
  const initial = (name || email).charAt(0).toUpperCase();

  return (
    <Link
      href="/settings"
      className="group inline-flex min-w-0 items-center gap-2 rounded-lg border border-[#343c47] bg-[#161c23] py-1 pr-2.5 pl-1 text-sm text-[#e6edf4] transition-colors duration-150 ease-out hover:bg-[#1d242c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dbe5ee]"
      aria-label={`${name}, ${email}`}
    >
      <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-md bg-[#2a3440] text-[11px] font-semibold text-white">
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          initial
        )}
        <span
          aria-hidden="true"
          className="absolute right-0 bottom-0 size-2 rounded-full border-2 border-[#161c23] bg-[#6ee7a8]"
        />
      </span>
      <span className="hidden max-w-32 truncate font-medium sm:block">
        {name}
      </span>
    </Link>
  );
}

function MobileNav({ items }: { items: SenziaNavItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="border-b border-[#252b34] bg-[#12161c] px-2 py-2 md:hidden">
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
    item.active ? ' bg-[#222a34] text-[#f4f7fa]' : ''
  }${compact ? ' w-auto shrink-0 whitespace-nowrap' : ''}`;
  const content = (
    <>
      <Icon
        aria-hidden="true"
        className="size-4 shrink-0 text-[#7f8a96] group-hover:text-[#dbe5ee]"
        strokeWidth={1.8}
      />
      <span className="truncate">{item.label}</span>
    </>
  );

  return (
    <Link
      href={item.href ?? '/text-to-video'}
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
