"use client";

import type { Product } from "@markala/types";
import { initSelections } from "@/lib/configurator";

export interface ConfiguratorState {
  selections: Record<string, string>;
  quantity: number;
  uploadedFile: File | null;
  uploadedFileName?: string;
  uploadedFileUrl?: string;
  needsDesign: boolean;
  justAdded: boolean;
}

export type ConfiguratorAction =
  | { type: "SET_SELECTION"; groupKey: string; optionKey: string }
  | { type: "SET_QUANTITY"; value: number }
  | { type: "SET_NEEDS_DESIGN"; value: boolean }
  | { type: "UPLOAD_FILE"; file: File | null }
  | { type: "SET_UPLOADED_URL"; fileName: string; url: string }
  | { type: "TOGGLE_DESIGN_HELP" }
  | { type: "JUST_ADDED"; value: boolean }
  | { type: "RESET"; product: Product };

export function initState(product: Product): ConfiguratorState {
  const selections = initSelections(product);
  // Area (m²) ürünler ölçü boş açılınca fiyat çıkmaz → sayfa "Teklif Al" gösterir.
  // Varsayılan ölçüyü (60×150) ön-dolu getir ki ürün doğrudan fiyatlı + "Sepete Ekle"
  // açılsın (müşteri yine dilediği ölçüyü girebilir). maxEn kuralı olan üründe (araç
  // magneti gibi) area-field varsayılanı zaten tavana çeker.
  if ((product as { pricingMode?: string }).pricingMode === "area") {
    if (!selections.en) selections.en = "60";
    if (!selections.boy) selections.boy = "150";
    if (!selections.adet) selections.adet = "1";
  }
  return {
    selections,
    quantity: 1,
    uploadedFile: null,
    uploadedFileName: undefined,
    uploadedFileUrl: undefined,
    needsDesign: false,
    justAdded: false,
  };
}

export function configuratorReducer(
  state: ConfiguratorState,
  action: ConfiguratorAction,
): ConfiguratorState {
  switch (action.type) {
    case "SET_SELECTION":
      return {
        ...state,
        selections: { ...state.selections, [action.groupKey]: action.optionKey },
      };
    case "SET_QUANTITY":
      return { ...state, quantity: Math.min(100000, Math.max(1, action.value)) };
    case "SET_NEEDS_DESIGN":
      return { ...state, needsDesign: action.value };
    case "TOGGLE_DESIGN_HELP":
      return { ...state, needsDesign: !state.needsDesign };
    case "UPLOAD_FILE":
      return {
        ...state,
        uploadedFile: action.file,
        uploadedFileName: action.file?.name,
        uploadedFileUrl: undefined,
      };
    case "SET_UPLOADED_URL":
      return {
        ...state,
        uploadedFileName: action.fileName,
        uploadedFileUrl: action.url,
      };
    case "JUST_ADDED":
      return { ...state, justAdded: action.value };
    case "RESET":
      return initState(action.product);
    default:
      return state;
  }
}
