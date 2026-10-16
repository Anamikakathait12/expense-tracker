import { useEffect, useRef, useState } from "react";

const screenshots = [
  {
    id: "dashboard",
    label: "Dashboard",
    caption: "Balance, income and expense at a glance.",
    src: "/screenshots/dashboard.png",
    alt: "Dashboard showing balance, income and expense cards, budget progress and spending by category",
    width: 342,
    height: 608,
  },
  {
    id: "transactions",
    label: "Transactions",
    caption: "Search, filter, add, edit and delete.",
    src: "/screenshots/transactions.png",
    alt: "Transactions list with search, filters and edit and delete buttons",
    width: 344,
    height: 606,
  },
  {
    id: "analytics",
    label: "Analytics",
    caption: "Trends and income versus expense over time.",
    src: "/screenshots/analytics.png",
    alt: "Analytics charts showing a spending trend and income versus expense bars",
    width: 338,
    height: 601,
  },
  {
    id: "budgets",
    label: "Budgets",
    caption: "Monthly budgets with progress and warnings.",
    src: "/screenshots/budgets.png",
    alt: "Budgets page with a spending overview donut and budget cards",
    width: 342,
    height: 606,
  },
];

export default function ScreenshotShowcase() {
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(() => new Set());

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const updateActiveIndex = () => {
      const scrollerCenter = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
      const items = scroller.querySelectorAll("[data-shots-item]");
      let closestIndex = 0;
      let closestDistance = Infinity;

      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - scrollerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    };
    const handleWheel = (event) => {
      if (scroller.scrollWidth <= scroller.clientWidth || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, scroller.scrollLeft + event.deltaY));
      if (nextScrollLeft === scroller.scrollLeft) return;

      event.preventDefault();
      scroller.scrollLeft = nextScrollLeft;
    };

    scroller.addEventListener("scroll", updateActiveIndex, { passive: true });
    scroller.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", updateActiveIndex);
    updateActiveIndex();

    return () => {
      scroller.removeEventListener("scroll", updateActiveIndex);
      scroller.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, []);

  const showScreenshot = (index) => {
    const scroller = scrollerRef.current;
    const item = scroller?.querySelectorAll("[data-shots-item]")[index];
    if (!scroller || !item) return;

    const itemRect = item.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const left = scroller.scrollLeft
      + itemRect.left
      + itemRect.width / 2
      - scrollerRect.left
      - scroller.clientWidth / 2;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const handleKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const scroller = scrollerRef.current;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(screenshots.length - 1, activeIndex + direction));
    showScreenshot(nextIndex);
  };

  const handleImageError = (id) => {
    setFailedImages((current) => {
      if (current.has(id)) return current;
      return new Set(current).add(id);
    });
  };

  return (
    <section className="shots-showcase">
      <div
        className="shots-scroller"
        ref={scrollerRef}
        role="region"
        aria-label="Product screenshots"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {screenshots.map((screenshot, index) => (
          <article
            className="shots-card"
            data-shots-item
            key={screenshot.id}
          >
            <h2 className="shots-label">{screenshot.label}</h2>
            <div className="shots-phone">
              {failedImages.has(screenshot.id) ? (
                <div className="shots-fallback">
                  <span>Product screenshots coming soon</span>
                </div>
              ) : (
                <img
                  src={screenshot.src}
                  alt={screenshot.alt}
                  width={screenshot.width}
                  height={screenshot.height}
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                  onError={() => handleImageError(screenshot.id)}
                />
              )}
              <span className="shots-notch" aria-hidden="true" />
            </div>
            <p className="shots-caption">{screenshot.caption}</p>
          </article>
        ))}
      </div>
      <div className="shots-dots" aria-label="Choose a screenshot">
        {screenshots.map((screenshot, index) => (
          <button
            className="shots-dot"
            type="button"
            key={screenshot.id}
            aria-label={`Show screenshot ${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => showScreenshot(index)}
          >
            <span className="shots-dot-indicator" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
