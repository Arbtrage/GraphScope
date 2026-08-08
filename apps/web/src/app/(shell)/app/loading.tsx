"use client";

import { HoneycombLoader } from "@/components/honeycomb-loader";

export default function AppLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <HoneycombLoader />
    </div>
  );
}
