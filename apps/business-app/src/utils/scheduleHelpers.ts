// scheduleHelpers.ts

export const parseTimeString = (timeString: string) => {
  if (timeString.includes("T")) {
    const timePart = timeString.split("T")[1];
    const [hours, minutes] = timePart.split(":").map(Number);
    return { hours, minutes };
  } else {
    const [hours, minutes] = timeString.split(":").map(Number);
    return { hours, minutes };
  }
};

export const isScheduleFullyCovered = (
  schedule: any,
  timeOffBlocks: any[],
  targetDate: Date
) => {
  if (!schedule || timeOffBlocks.length === 0) return false;

  const { hours: startH, minutes: startM } = parseTimeString(
    schedule.start_time
  );
  const { hours: endH, minutes: endM } = parseTimeString(schedule.end_time);

  const scheduleStart = new Date(targetDate);
  scheduleStart.setHours(startH, startM, 0, 0);

  const scheduleEnd = new Date(targetDate);
  scheduleEnd.setHours(endH, endM, 0, 0);

  return timeOffBlocks.some((block) => {
    const blockStart = new Date(block.start_date_time);
    const blockEnd = new Date(block.end_date_time);
    return blockStart <= scheduleStart && blockEnd >= scheduleEnd;
  });
};

export const getOverlappingTimeOff = (
  schedule: any,
  timeOffBlocks: any[],
  targetDate: Date
): Array<{ reason: string; start_time: string; end_time: string }> => {
  if (!schedule || timeOffBlocks.length === 0) return [];

  const { hours: startH, minutes: startM } = parseTimeString(
    schedule.start_time
  );
  const { hours: endH, minutes: endM } = parseTimeString(schedule.end_time);

  const scheduleStart = new Date(targetDate);
  scheduleStart.setHours(startH, startM, 0, 0);

  const scheduleEnd = new Date(targetDate);
  scheduleEnd.setHours(endH, endM, 0, 0);

  return timeOffBlocks.flatMap((block) => {
    const blockStart = new Date(block.start_date_time);
    const blockEnd = new Date(block.end_date_time);

    const overlapStart = new Date(
      Math.max(scheduleStart.getTime(), blockStart.getTime())
    );
    const overlapEnd = new Date(
      Math.min(scheduleEnd.getTime(), blockEnd.getTime())
    );

    if (overlapStart < overlapEnd) {
      return [
        {
          reason: block.reason,
          start_time: overlapStart.toTimeString().slice(0, 8),
          end_time: overlapEnd.toTimeString().slice(0, 8),
        },
      ];
    }
    return [];
  });
};
