const DEFAULT_TTL_MINUTES = 120;
const MIN_TTL_MINUTES = 5;
const MAX_TTL_MINUTES = 1440;
const DEFAULT_MAX_ACTIVE = 200;

export const getDemoTtlMs = (value = process.env.DEMO_TTL_MINUTES) => {
  const parsed = Number.parseInt(value, 10);
  const minutes = Number.isFinite(parsed)
    ? Math.min(MAX_TTL_MINUTES, Math.max(MIN_TTL_MINUTES, parsed))
    : DEFAULT_TTL_MINUTES;

  return minutes * 60 * 1000;
};

export const getDemoMaxActive = (value = process.env.DEMO_MAX_ACTIVE) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ACTIVE;
};
