export const DEFAULT_DASHBOARD_LAYOUT = {
  mobileColumns: 2,
  desktopColumns: 4,
};

const storageKey = (user) => `dashboardLayout:${user}`;

function normalizeDashboardLayout(layout = {}) {
  const mobileColumns = Number(layout.mobileColumns);
  const desktopColumns = Number(layout.desktopColumns);

  return {
    mobileColumns:
      Number.isInteger(mobileColumns) && mobileColumns >= 1 && mobileColumns <= 4
        ? mobileColumns
        : DEFAULT_DASHBOARD_LAYOUT.mobileColumns,
    desktopColumns:
      Number.isInteger(desktopColumns) && desktopColumns >= 2 && desktopColumns <= 6
        ? desktopColumns
        : DEFAULT_DASHBOARD_LAYOUT.desktopColumns,
  };
}

export function readDashboardLayout(user) {
  if (!user) return { ...DEFAULT_DASHBOARD_LAYOUT };

  try {
    const saved = localStorage.getItem(storageKey(user));
    return normalizeDashboardLayout(saved ? JSON.parse(saved) : undefined);
  } catch {
    return { ...DEFAULT_DASHBOARD_LAYOUT };
  }
}

export function saveDashboardLayout(user, layout) {
  const normalized = normalizeDashboardLayout(layout);
  localStorage.setItem(storageKey(user), JSON.stringify(normalized));
  return normalized;
}
