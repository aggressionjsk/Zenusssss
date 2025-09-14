"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/providers/socket-provider";

export function Provider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <SessionProvider>
        <SocketProvider>{children}</SocketProvider>
      </SessionProvider>
    </NextThemesProvider>
  );
}
