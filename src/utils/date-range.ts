export function getMonthRange(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  
  const formatDate = (date: Date) => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    // return date-only to match attendance_date column (YYYY-MM-DD)
    return `${y}-${m}-${d}`;
  };

  return { 
    start: formatDate(firstDay),
    end: formatDate(lastDay)
  };
}

export function getPreviousMonthRange() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return getMonthRange(date);
}
