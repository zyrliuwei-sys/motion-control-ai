import { useState } from 'react';
import { ArrowRight, LogOut, Menu, Settings, X } from 'lucide-react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';

import { signOut, useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { localizeHref } from '@/paraglide/runtime.js';
import { BrandWordmark } from '@/components/brand-wordmark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  settingsLabel?: string;
  signOutLabel?: string;
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
  settingsLabel = 'Settings',
  signOutLabel = 'Sign out',
}: ProactivNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const reduceMotion = useReducedMotion() ?? false;

  const closeMobileMenu = () => setMobileOpen(false);
  const isSignedIn = Boolean(session?.user);
  const accountHref = isSignedIn ? '/settings' : loginHref;
  const accountLabel = isSignedIn ? 'Account settings' : loginLabel;
  const accountInitial = (session?.user?.name || session?.user?.email || 'U')
    .trim()
    .charAt(0)
    .toLocaleUpperCase();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-[80] px-2 sm:px-4">
      <div className="pointer-events-auto mx-auto w-full max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/95 text-[#18181b] shadow-[0_18px_45px_rgba(24,24,27,0.10),0_2px_8px_rgba(24,24,27,0.06),inset_0_1px_0_rgba(255,255,255,0.96),inset_0_-1px_0_rgba(24,24,27,0.05)] backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <Brand brand={brand} href={brandHref} />

            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-1 lg:flex"
            >
              {links.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <AccountLink
                href={localizeHref(accountHref)}
                label={accountLabel}
                signedIn={isSignedIn}
                initial={accountInitial}
                name={session?.user?.name || session?.user?.email || ''}
                email={session?.user?.email || ''}
                settingsLabel={settingsLabel}
                signOutLabel={signOutLabel}
              />
            </div>

            <button
              type="button"
              className="relative inline-flex size-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="proactiv-mobile-menu"
              onClick={() => setMobileOpen((isOpen) => !isOpen)}
            >
              {mobileOpen ? (
                <X className="size-5" strokeWidth={1.8} />
              ) : (
                <Menu className="size-5" strokeWidth={1.8} />
              )}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {mobileOpen && (
              <m.nav
                id="proactiv-mobile-menu"
                aria-label="Mobile navigation"
                className="overflow-hidden border-t border-black/[0.06] lg:hidden"
                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <div className="grid gap-1 px-4 py-4 sm:px-6">
                  {links.map((link, index) => (
                    <m.div
                      key={`${link.href}-${link.label}`}
                      initial={reduceMotion ? false : { opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: reduceMotion ? 0 : index * 0.04,
                        duration: 0.18,
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={closeMobileMenu}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                      >
                        {link.label}
                      </Link>
                    </m.div>
                  ))}
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
                    <AccountLink
                      href={localizeHref(accountHref)}
                      onClick={closeMobileMenu}
                      label={accountLabel}
                      signedIn={isSignedIn}
                      initial={accountInitial}
                      name={session?.user?.name || session?.user?.email || ''}
                      email={session?.user?.email || ''}
                      settingsLabel={settingsLabel}
                      signOutLabel={signOutLabel}
                    />
                  </div>
                </div>
              </m.nav>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function AccountLink({
  href,
  label,
  signedIn,
  initial,
  name,
  email,
  settingsLabel,
  signOutLabel,
  onClick,
}: {
  href: string;
  label: string;
  signedIn: boolean;
  initial: string;
  name: string;
  email: string;
  settingsLabel: string;
  signOutLabel: string;
  onClick?: () => void;
}) {
  if (!signedIn) {
    return (
      <a
        href={href}
        onClick={onClick}
        className="group inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
      >
        {label}
        <ArrowRight
          aria-hidden="true"
          className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          strokeWidth={1.8}
        />
      </a>
    );
  }

  return (
    <SignedInAccountMenu
      email={email}
      initial={initial}
      label={label}
      name={name}
      onClick={onClick}
      settingsLabel={settingsLabel}
      signOutLabel={signOutLabel}
    />
  );
}

function SignedInAccountMenu({
  email,
  initial,
  label,
  name,
  onClick,
  settingsLabel,
  signOutLabel,
}: {
  email: string;
  initial: string;
  label: string;
  name: string;
  onClick?: () => void;
  settingsLabel: string;
  signOutLabel: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        title={label}
        className="inline-flex size-9 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(24,24,27,0.16)] transition-transform outline-none hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:scale-95"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="min-w-52">
        <DropdownMenuLabel className="px-2 py-2">
          <span className="block truncate text-sm font-semibold text-zinc-950">
            {name}
          </span>
          {email && (
            <span className="mt-0.5 block truncate text-xs font-normal text-zinc-500">
              {email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />} onClick={onClick}>
          <Settings className="size-4" aria-hidden="true" />
          {settingsLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="size-4" aria-hidden="true" />
          {signOutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
      className="inline-flex items-center gap-2 rounded-md text-lg font-bold tracking-[-0.035em] text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-zinc-950"
    >
      <BrandWordmark brand={brand} />
    </Link>
  );
}
