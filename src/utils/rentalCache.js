const normalizeRentalKey = (rental) => {
  if (!rental) return "";

  if (rental.id) {
    return String(rental.id).trim().toLowerCase();
  }

  return [
    rental.equipmentId || "",
    rental.farmerId || "",
    rental.ownerId || "",
    rental.startDate || "",
    rental.endDate || "",
  ]
    .join("|")
    .trim()
    .toLowerCase();
};

export const mergeRentalsById = (remoteRentals = [], cachedRentals = []) => {
  const merged = [];
  const seen = new Set();

  [...remoteRentals, ...cachedRentals].forEach((rental) => {
    const key = normalizeRentalKey(rental);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(rental);
  });

  return merged;
};

