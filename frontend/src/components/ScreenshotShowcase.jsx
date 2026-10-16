import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "./Modal";

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
  const openerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const updateActiveIndex = () => {
      const scrollerLeft = scroller.getBoundingClientRect().left;
      const items = scroller.querySelectorAll("[data-shots-item]");
      let closestIndex = 0;
      let closestDistance = Infinity;

      items.forEach((item, index) => {
        const distance = Math.abs(item.getBoundingClientRect().left - scrollerLeft);
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

  useEffect(() => {
    if (!selectedScreenshot && openerRef.current) {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [selectedScreenshot]);

  const showScreenshot = (index) => {
    const scroller = scrollerRef.current;
    const item = scroller?.querySelectorAll("[data-shots-item]")[index];
    if (!scroller || !item) return;

    const left = scroller.scrollLeft
      + item.getBoundingClientRect().left
      - scroller.getBoundingClientRect().left;
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

  const openScreenshot = (event, screenshot) => {
    openerRef.current = event.currentTarget;
    setSelectedScreenshot(screenshot);
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
          <article className="shots-card" data-shots-item key={screenshot.id}>
            <button
              className="shots-preview-button"
              type="button"
              aria-label={`View ${screenshot.label} screenshot`}
              disabled={failedImages.has(screenshot.id)}
              onClick={(event) => openScreenshot(event, screenshot)}
            >
              <span className="shots-frame">
                {failedImages.has(screenshot.id) ? (
                  <span className="shots-fallback">
                    Product screenshots coming soon
                  </span>
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
              </span>
              <span className="shots-label">{screenshot.label}</span>
            </button>
            <span className="shots-sr-only">{screenshot.caption}</span>
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
      {selectedScreenshot && (
        createPortal(
          <Modal
            title={selectedScreenshot.label}
            onClose={() => setSelectedScreenshot(null)}
          >
            <img
              className="shots-modal-image"
              src={selectedScreenshot.src}
              alt={selectedScreenshot.alt}
              width={selectedScreenshot.width}
              height={selectedScreenshot.height}
              style={{ maxWidth: `min(100%, ${selectedScreenshot.width}px)` }}
            />
          </Modal>,
          document.body,
        )
      )}
    </section>
  );
}
