export default function HeroCards() {
  return (
    <div className="hero-cards-cluster" aria-hidden="true">
      <svg className="hero-cards-squiggle" viewBox="0 0 440 352" fill="none">
        <path
          d="M8 102C62 46 90 165 151 119S238 40 278 103s73 89 154 18"
          stroke="var(--hero-cards-pink)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <div className="hero-cards-balance">
        <span className="hero-cards-muted-label">Balance</span>
        <strong className="hero-cards-balance-value">₹34,710</strong>
        <svg className="hero-cards-sparkline" viewBox="0 0 150 28" fill="none">
          <polyline
            points="2,22 25,17 44,20 66,8 86,14 108,5 128,10 148,2"
            stroke="var(--yellow)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="hero-cards-income">
        <span className="hero-cards-income-label">Income</span>
        <strong className="hero-cards-income-value">₹65,705</strong>
        <span className="hero-cards-income-note">▲ this month</span>
      </div>

      <div className="hero-cards-spending">
        <svg className="hero-cards-donut" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="16" stroke="var(--hero-cards-donut-track)" strokeWidth="7" />
          <circle className="hero-cards-donut-orange" cx="22" cy="22" r="16" />
          <circle className="hero-cards-donut-purple" cx="22" cy="22" r="16" />
          <circle className="hero-cards-donut-pink" cx="22" cy="22" r="16" />
          <circle className="hero-cards-donut-cyan" cx="22" cy="22" r="16" />
        </svg>
        <span className="hero-cards-spending-copy">
          <span className="hero-cards-spending-label">Spending</span>
          <strong className="hero-cards-spending-value">₹30,995</strong>
        </span>
      </div>

      <div className="hero-cards-chip">Food · On track</div>
    </div>
  );
}
