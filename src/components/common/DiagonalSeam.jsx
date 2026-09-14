/**
 * Diagonal section divider — the slanted seam motif used across public pages.
 *
 * `from` is the background of the section above (fills the uncut area);
 * `to` is the background of the section below (the angled wedge).
 * `direction="up"` rises left→right; `"down"` descends left→right.
 * Place it between two sections whose backgrounds match `from`/`to`.
 */
export default function DiagonalSeam({
  from = 'bg-white',
  to = 'bg-gray-50',
  direction = 'up',
  height = 'h-10 sm:h-16',
}) {
  return (
    // The wrapper bleeds 1px into the sections above and below so the clipped
    // wedge never leaves a hairline seam against the adjacent solid colour.
    <div aria-hidden="true" className={`${from} -mt-px -mb-px`}>
      <div
        className={`${height} ${to}`}
        style={{
          clipPath: direction === 'up'
            ? 'polygon(0 100%, 100% 0, 100% 100%)'
            : 'polygon(0 0, 100% 100%, 0 100%)',
        }}
      />
    </div>
  );
}
