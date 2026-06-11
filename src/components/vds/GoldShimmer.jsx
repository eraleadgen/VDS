export default function GoldShimmer({ children, className = '' }) {
  return (
    <span
      className={`inline-block gold-shine-text ${className}`}
      style={{
        backgroundImage: 'linear-gradient(105deg, #A08020 0%, #A08020 30%, #C9921A 40%, #D4AF37 45%, #FFFDE0 50%, #D4AF37 55%, #C9921A 60%, #A08020 70%, #A08020 100%)',
        backgroundSize: '600% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'goldShine 6s linear infinite',
      }}
    >
      {children}
    </span>
  );
}