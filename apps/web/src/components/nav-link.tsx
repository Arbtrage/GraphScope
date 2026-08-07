"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "./navigation-provider";

export function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const { startNavigation } = useNavigation();

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (href !== pathname && !href.startsWith(pathname + "?")) {
          startNavigation();
        }
      }}
    >
      {children}
    </Link>
  );
}
