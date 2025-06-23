/**
 * Generates a mapping of staff IDs to colors.
 * @param staffs - Array of staff objects.
 * @returns An object where keys are staff IDs and values are assigned colors.
 */
export const getStaffColorMap = (
  staffs: { id: string }[]
): Record<string, string> => {
  // List of professional colors for dark mode
  const colors = [
    "#3E8C84", // Teal
    "#4C5CFF", // Dark Blue
    "#5ED3F3", // Light Blue
    "#8F9BB3", // Grayish Blue
    "#B08FFF", // Violet
    "#6A5ACD", // Slate Blue
    "#483D8B", // Dark Slate Blue
    "#8B4513", // Saddle Brown
    "#A0522D", // Sienna
    "#2F4F4F", // Dark Slate Gray
  ];

  // Map staff IDs to colors in the order of the staff list
  const staffColorMap: Record<string, string> = {};
  staffs.forEach((staff, index) => {
    staffColorMap[staff.id] = colors[index % colors.length];
  });

  return staffColorMap;
};
