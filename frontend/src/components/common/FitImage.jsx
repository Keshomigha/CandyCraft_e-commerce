// Drop-in replacement for a single <img> used inside a container that is
// already `relative overflow-hidden`. Shows the full photo (object-contain,
// never cropped) while a blurred, scaled-up copy of the same image fills any
// leftover space behind it, so mismatched aspect ratios don't leave flat
// empty bars.
export default function FitImage({ src, alt = '', imgClassName = '', onLoad }) {
  return (
    <>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-50"
      />
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        className={`relative w-full h-full object-contain ${imgClassName}`}
      />
    </>
  );
}
