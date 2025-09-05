const { DateTime } = require("luxon");
const tzlookup = require("tz-lookup");

// ISO weekday: Mon=1..Sun=7
const WEEKMAP = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

function computeStartEndUTC({ dayStr, startHHmm, endHHmm, lat, lng }) {
  // 1) Find appointment timezone from coordinates
  const tz = tzlookup(lat, lng); // e.g. "America/Toronto"

  // 2) Work in local tz
  const nowLocal = DateTime.now().setZone(tz);
  const target = WEEKMAP[dayStr.toLowerCase()];
  if (!target) throw new BadRequestError("Invalid day");

  // 3) Next occurrence of that weekday (allow same-day if time still ahead)
  const [sH, sM] = startHHmm.split(":").map(Number);
  const [eH, eM] = endHHmm.split(":").map(Number);

  let daysAhead = (target - nowLocal.weekday + 7) % 7;
  let candidate = nowLocal.plus({ days: daysAhead }).set({ hour: sH, minute: sM, second: 0, millisecond: 0 });
  if (daysAhead === 0 && candidate <= nowLocal) {
    daysAhead = 7; // if same-day but time already passed, go to next week
  }

  const base = nowLocal.plus({ days: daysAhead }).startOf("day");
  let startLocal = base.set({ hour: sH, minute: sM, second: 0, millisecond: 0 });
  let endLocal = base.set({ hour: eH, minute: eM, second: 0, millisecond: 0 });

  // Overnight support (e.g., 22:00 → 02:00 next day)
  if (endLocal <= startLocal) endLocal = endLocal.plus({ days: 1 });

  // 4) Return UTC JS Dates for Prisma, plus tz if you want to store it
  return {
    tz,
    startUTC: startLocal.toUTC().toJSDate(),
    endUTC: endLocal.toUTC().toJSDate(),
  };
}

module.exports = computeStartEndUTC;