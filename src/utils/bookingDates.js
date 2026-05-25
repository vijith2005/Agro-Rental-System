const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const createLocalDate = (year, month, day) => {
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseStructuredDate = (value) => {
  if (Array.isArray(value) && value.length >= 3) {
    return createLocalDate(value[0], value[1], value[2]);
  }

  if (typeof value === "object") {
    const year = value.year ?? value.y;
    const month = value.monthValue ?? value.month ?? value.m;
    const day = value.dayOfMonth ?? value.day ?? value.d;

    if (year != null && month != null && day != null) {
      return createLocalDate(year, month, day);
    }
  }

  return null;
};

export const parseBookingDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const structuredDate = parseStructuredDate(value);
  if (structuredDate) {
    return structuredDate;
  }

  const raw = value.toString().trim();
  if (!raw) return null;

  const displayMatch = raw.match(DATE_PATTERN);
  if (displayMatch) {
    return createLocalDate(displayMatch[3], displayMatch[2], displayMatch[1]);
  }

  const isoMatch = raw.match(ISO_DATE_PATTERN);
  if (isoMatch) {
    return createLocalDate(isoMatch[1], isoMatch[2], isoMatch[3]);
  }

  const fallback = new Date(raw);
  if (Number.isNaN(fallback.getTime())) return null;
  fallback.setHours(0, 0, 0, 0);
  return fallback;
};

export const formatBookingDate = (value) => {
  const date = parseBookingDate(value);
  if (!date) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatBookingRange = (startValue, endValue, fallback = "Date not available") => {
  const startDate = formatBookingDate(startValue);
  const endDate = formatBookingDate(endValue);

  if (startDate && endDate) {
    return `${startDate} to ${endDate}`;
  }

  return startDate || endDate || fallback;
};

export const isBookingDateTodayOrFuture = (value) => {
  const date = parseBookingDate(value);
  if (!date) return false;
  return date.getTime() >= startOfToday().getTime();
};

export const areBookingDatesValid = (startValue, endValue) => {
  const startDate = parseBookingDate(startValue);
  const endDate = parseBookingDate(endValue);
  if (!startDate || !endDate) return false;

  const today = startOfToday().getTime();
  if (startDate.getTime() < today || endDate.getTime() < today) return false;
  return endDate.getTime() >= startDate.getTime();
};

export const getBookingDurationDays = (startValue, endValue) => {
  const startDate = parseBookingDate(startValue);
  const endDate = parseBookingDate(endValue);
  if (!startDate || !endDate) return 0;

  const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
  return Math.max(1, diffDays);
};
