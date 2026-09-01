import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { LogoutButton } from "./logout-button";
import { NavLink } from "./nav-link";

const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  guest: [{ href: "/listings", label: "All listings" }],
  buyer: [
    { href: "/listings", label: "All listings" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "My mandate" },
    { href: "/inbox", label: "Inbox" },
  ],
  seller: [
    { href: "/listings", label: "All listings" },
    { href: "/dashboard", label: "My listings" },
    { href: "/buyers", label: "Browse buyers" },
    { href: "/inbox", label: "Inbox" },
    { href: "/profile", label: "My profile" },
  ],
  manager: [
    { href: "/listings", label: "All listings" },
    { href: "/admin", label: "Moderation" },
  ],
};

export async function SiteNav() {
  const user = await getCurrentUser();
  const items = NAV_BY_ROLE[user?.role ?? "guest"];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link href="/listings" className="mr-3 flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white">
            N5
          </span>
          <span className="hidden sm:inline">N5Deal</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-[13px] leading-tight sm:block">
              <span className="block font-medium">{user.name}</span>
              <span className="block text-muted capitalize">{user.role}</span>
            </span>
            <LogoutButton />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost btn-sm">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary btn-sm">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
