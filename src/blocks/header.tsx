import { m } from '@/paraglide/messages.js';
import { SiteHeader } from '@/components/site-header';

export function Header() {
  const navLinks = [
    { href: '/#features', label: m['landing.nav.features']() },
    { href: '/#pricing', label: m['landing.nav.pricing']() },
  ];

  return <SiteHeader navLinks={navLinks} />;
}
