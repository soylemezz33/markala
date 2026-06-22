/**
 * Eski parameters-tabanlı fiyat sistemi yerel tipleri.
 * @markala/types'dan kaldırıldı (Faz C sonrası ölü) — yalnız mock-data/seed için tutulur.
 */
import type { MatrixAxis, MatrixCell, DimensionExtra, ProductOption } from "@markala/types";

export type ParameterKind =
  | "radio"
  | "select"
  | "quantity"
  | "checkbox-group"
  | "dimension"
  | "matrix";

export interface ProductParameter {
  id: string;
  label: string;
  kind: ParameterKind;
  required: boolean;
  options?: ProductOption[];
  quantityPresets?: number[];
  unitPrice?: number;
  isSizeDriver?: boolean;
  perUnit?: boolean;
  defaultOptionId?: string;
  pricePerSqm?: number;
  minDimension?: number;
  maxDimension?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  extras?: DimensionExtra[];
  rows?: MatrixAxis[];
  cols?: MatrixAxis[];
  cells?: MatrixCell[];
  defaultCellId?: string;
  matrixNote?: string;
}

/** Product + eski parameters alanı (seed verisi için). */
export type ProductWithParams = { parameters?: ProductParameter[] } & import("@markala/types").Product;
