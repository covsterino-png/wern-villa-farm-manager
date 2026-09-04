export const LAMBING_SHED = "Lambing Shed";

export const BAYS = [
  "Bay 1",
  "Bay 2",
  "Bay 3",
  "Bay 4",
  "Bay 5",
  "Bay 6",
];

export const WERN_VILLA_BUILDINGS = [LAMBING_SHED, ...BAYS];

const BAY_MERGE_KEY = "wernVillaBayMerges";

// Merges are stored as the split boundaries that remain closed, e.g. [1,3] keeps
// Bay 1 | Bay 2 + Bay 3 | Bay 4 ... The stored value is the merged pairs.
export function loadBayMerges() {
  try {
    const raw = localStorage.getItem(BAY_MERGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (i) => Number.isInteger(i) && i >= 0 && i < BAYS.length - 1
        )
      : [];
  } catch {
    return [];
  }
}

export function saveBayMerges(merges) {
  localStorage.setItem(BAY_MERGE_KEY, JSON.stringify(merges));
}

export function buildBayGroups(merges) {
  const groups = [];
  let current = [BAYS[0]];

  for (let i = 1; i < BAYS.length; i++) {
    if (merges.includes(i - 1)) {
      current.push(BAYS[i]);
    } else {
      groups.push(current);
      current = [BAYS[i]];
    }
  }

  groups.push(current);
  return groups;
}
