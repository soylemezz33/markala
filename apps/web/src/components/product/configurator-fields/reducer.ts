import type { Product } from "@markala/types";
import {
  initConfig,
  type ConfigState,
  type DimensionValue,
  type SelectionValue,
} from "@/lib/configurator";

/**
 * Configurator state machine — tüm state mutasyonlarını tek noktadan yönetir.
 * Test edilebilir saf reducer, side-effect içermez.
 */
export interface ConfiguratorState {
  selections: ConfigState["selections"];
  quantity: number;
  uploadedFile: File | null;
  uploadedFileName?: string;
  /** Backend storage'a yüklenen tasarım dosyasının URL'i (yükleme tamamlanınca set edilir) */
  uploadedFileUrl?: string;
  needsDesign: boolean;
  justAdded: boolean;
}

export type ConfiguratorAction =
  | { type: "SELECT_PARAMETER"; paramId: string; value: SelectionValue }
  | { type: "TOGGLE_CHECKBOX"; paramId: string; optionId: string }
  | { type: "SET_DIMENSION"; paramId: string; value: DimensionValue }
  | { type: "SET_QUANTITY"; paramId: string; value: number }
  | { type: "UPLOAD_FILE"; file: File | null }
  // Backend yükleme tamamlanınca: dosya adı (sanitize) + indirilebilir URL'i state'e yazar.
  | { type: "SET_UPLOADED_URL"; fileName: string; url: string }
  | { type: "TOGGLE_DESIGN_HELP" }
  | { type: "SET_DESIGN_HELP"; value: boolean }
  | { type: "MARK_ADDED"; value: boolean }
  | { type: "RESET"; product: Product };

export function initState(product: Product): ConfiguratorState {
  const cfg = initConfig(product);
  return {
    selections: cfg.selections,
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
    case "SELECT_PARAMETER":
      return {
        ...state,
        selections: { ...state.selections, [action.paramId]: action.value },
      };
    case "TOGGLE_CHECKBOX": {
      const current = (state.selections[action.paramId] as string[]) ?? [];
      const next = current.includes(action.optionId)
        ? current.filter((id) => id !== action.optionId)
        : [...current, action.optionId];
      return {
        ...state,
        selections: { ...state.selections, [action.paramId]: next },
      };
    }
    case "SET_DIMENSION":
      return {
        ...state,
        selections: { ...state.selections, [action.paramId]: action.value },
      };
    case "SET_QUANTITY":
      return {
        ...state,
        selections: {
          ...state.selections,
          [action.paramId]: Math.max(1, action.value),
        },
        quantity: Math.max(1, action.value),
      };
    case "UPLOAD_FILE":
      // Dosya seçimi/temizlenmesi. Dosya kaldırılınca yüklenmiş URL de temizlenir.
      return {
        ...state,
        uploadedFile: action.file,
        uploadedFileName: action.file?.name,
        uploadedFileUrl: undefined,
      };
    case "SET_UPLOADED_URL":
      // Backend yükleme tamamlandı — sanitize edilmiş ad + indirilebilir URL.
      return {
        ...state,
        uploadedFileName: action.fileName,
        uploadedFileUrl: action.url,
      };
    case "TOGGLE_DESIGN_HELP":
      return { ...state, needsDesign: !state.needsDesign };
    case "SET_DESIGN_HELP":
      return { ...state, needsDesign: action.value };
    case "MARK_ADDED":
      return { ...state, justAdded: action.value };
    case "RESET":
      return initState(action.product);
    default:
      return state;
  }
}
