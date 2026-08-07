"use client";

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter motion-reduce:animate-none">{children}</div>;
}
