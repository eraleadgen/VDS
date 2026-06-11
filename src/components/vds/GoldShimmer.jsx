export default function GoldShimmer({ children, className = '' }) {
  return (
    <span
      className={`inline-block gold-shine-text ${className}`}
      style={{
        backgroundImage: 'linear-gradient(105deg, #A08020 0%, #C9921A 15%, #D4AF37 30%, #BF9B30 42%, #FFFDE0 50%, #BF9B30 58%, #D4AF37 70%, #C9921A 85%, #A08020 100%)',
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'goldShine 4s linear infinite',
      }}
    >
      {children}
    </span>
  );
}