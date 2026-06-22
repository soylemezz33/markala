"use client";

import type { ProductParameter } from "@markala/types";
import { isDimensionValue } from "@/lib/configurator";
import { useConfigurator } from "./context";
import { RadioCard } from "./radio-card";
import { CheckboxModifier } from "./checkbox-modifier";
import { QuantityInput } from "./quantity-input";
import { DimensionInput } from "./dimension-input";
import { MatrixField } from "./matrix-field";

/**
 * Parametre tipine göre uygun field component'ini render eden router.
 * Context'ten state/dispatch alır — prop drilling yok.
 */
export function ParameterField({ param }: { param: ProductParameter }) {
  const { state, dispatch } = useConfigurator();
  const value = state.selections[param.id];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <label id={`param-${param.id}-label`} className="text-sm font-medium text-ink-900">
          {param.label}
          {param.required && <span className="text-error ml-0.5">*</span>}
        </label>
      </div>

      {param.kind === "radio" && param.options && (
        <div
          role="radiogroup"
          aria-labelledby={`param-${param.id}-label`}
          className="grid grid-cols-1 gap-2"
        >
          {param.options.map((opt) => (
            <RadioCard
              key={opt.id}
              option={opt}
              selected={value === opt.id}
              onSelect={() =>
                dispatch({ type: "SELECT_PARAMETER", paramId: param.id, value: opt.id })
              }
            />
          ))}
        </div>
      )}

      {param.kind === "checkbox-group" && param.options && (
        <div role="group" aria-labelledby={`param-${param.id}-label`} className="space-y-2">
          {param.options.map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt.id);
            return (
              <CheckboxModifier
                key={opt.id}
                option={opt}
                checked={checked}
                onToggle={() =>
                  dispatch({ type: "TOGGLE_CHECKBOX", paramId: param.id, optionId: opt.id })
                }
              />
            );
          })}
        </div>
      )}

      {param.kind === "quantity" && (
        <QuantityInput
          value={typeof value === "number" ? value : 1}
          presets={param.quantityPresets ?? []}
          unitPrice={param.unitPrice ?? 0}
          onChange={(n) => dispatch({ type: "SET_QUANTITY", paramId: param.id, value: n })}
        />
      )}

      {param.kind === "dimension" && isDimensionValue(value) && (
        <DimensionInput
          param={param}
          value={value}
          onChange={(v) => dispatch({ type: "SET_DIMENSION", paramId: param.id, value: v })}
        />
      )}

      {param.kind === "matrix" && (
        <MatrixField
          param={param}
          value={typeof value === "string" ? value : ""}
          onSelect={(id) => dispatch({ type: "SELECT_PARAMETER", paramId: param.id, value: id })}
        />
      )}
    </div>
  );
}
