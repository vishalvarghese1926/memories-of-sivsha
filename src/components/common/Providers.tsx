"use client";

import React from "react";
import { StoryProvider } from "@/context/StoryContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <StoryProvider>{children}</StoryProvider>;
}
