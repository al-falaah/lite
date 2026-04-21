/**
 * SubsidizedPrice — shows crossed-out market rate + current fee + "Subsidized" badge
 * when the current fee is below market rate. If previousPrice is given and differs
 * from price, also shows a "Was $X" tag to signal recent uplift.
 *
 * Props:
 *   fullPrice      - market rate number (e.g. 720)
 *   price          - current fee number (e.g. 295)
 *   previousPrice  - optional prior fee (e.g. 150) — renders as "Was $150"
 *   suffix         - optional text after price (e.g. "/month", " NZD", " one-time")
 *   className      - optional wrapper className
 */
export default function SubsidizedPrice({ fullPrice, price, previousPrice, suffix = '', className = '' }) {
  const hasPrior = previousPrice && Number(previousPrice) !== Number(price);
  const isSubsidized = fullPrice && price && price < fullPrice;

  if (!isSubsidized && !hasPrior) {
    return (
      <span className={className}>
        ${price}{suffix}
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      {isSubsidized && (
        <span className="line-through text-gray-400 text-[0.8em]">${fullPrice.toLocaleString()}</span>
      )}
      <span>${price}{suffix}</span>
      {hasPrior && (
        <span className="text-[0.65em] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full leading-none align-middle whitespace-nowrap">
          Was ${previousPrice}
        </span>
      )}
      {isSubsidized && (
        <span className="text-[0.65em] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full leading-none align-middle whitespace-nowrap">
          Subsidized
        </span>
      )}
    </span>
  );
}
