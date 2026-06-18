"use client";

/**
 * Telefon girişi — +90 sabit önek, SADECE rakam (harf yazılamaz), maks 10 hane.
 * Kullanıcı "5522324102" gibi doldurur; saklanan değer E.164: "+905522324102"
 * (backend telefon doğrulaması bu formatı bekler: /^\+?[1-9]\d{1,14}$/).
 *
 * value (gelen) herhangi bir formatta olabilir (0532..., +90..., 90...) → ulusal 10 haneye indirgenir.
 */

const PREFIX = "+90";

/** Herhangi bir girdiden ulusal 10 haneyi çıkarır (başındaki 90 / 0 atılır). */
export function toNationalPhone(v: string): string {
  let d = (v || "").replace(/\D/g, "");
  if (d.startsWith("90")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

/** Form gönderimi için E.164: ulusal hane varsa "+90XXXXXXXXXX", yoksa "". */
export function toE164Phone(v: string): string {
  const nat = toNationalPhone(v);
  return nat ? PREFIX + nat : "";
}

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  label,
  required,
  className,
  inputClassName,
  id,
  placeholder = "5XX XXX XX XX",
}: PhoneInputProps) {
  const national = toNationalPhone(value);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const nat = toNationalPhone(e.target.value);
    onChange(nat ? PREFIX + nat : "");
  }

  const inputBase =
    inputClassName ??
    "w-full px-3 py-2.5 rounded border border-paper-200 text-sm focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30";

  return (
    <label className={className ?? "block"}>
      {label && (
        <span className="text-sm font-medium text-ink-900">
          {label}
          {required && " *"}
        </span>
      )}
      <div className={label ? "mt-1.5 flex items-stretch" : "flex items-stretch"}>
        <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-paper-200 bg-paper-100 text-sm text-ink-700 font-medium select-none">
          {PREFIX}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={national}
          onChange={handle}
          placeholder={placeholder}
          maxLength={10}
          className={`${inputBase} !rounded-l-none`}
          aria-label={label ?? "Telefon numarası"}
        />
      </div>
    </label>
  );
}
