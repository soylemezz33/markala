"use client";

import { createContext, useContext, type Dispatch } from "react";
import type { Product } from "@markala/types";
import type { ConfiguratorAction, ConfiguratorState } from "./reducer";

export interface ConfiguratorContextValue {
  state: ConfiguratorState;
  dispatch: Dispatch<ConfiguratorAction>;
  product: Product;
}

export const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

export function useConfigurator(): ConfiguratorContextValue {
  const ctx = useContext(ConfiguratorContext);
  if (!ctx) {
    throw new Error("useConfigurator must be used within <ConfiguratorContext.Provider>");
  }
  return ctx;
}
