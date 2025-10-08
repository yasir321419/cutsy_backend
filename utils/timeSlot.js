const { BadRequestError } = require("../handler/CustomError");

const TIME_ONLY_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/; // 24h HH:mm or HH:mm:ss
const TIME_12H_REGEX = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(am|pm)$/i; // 12h h:mm am/pm

const clampMinutes = (hours, minutes) => hours * 60 + minutes;

const parseTimeString = (input) => {
  if (typeof input !== "string") return null;

  const normalized = input.trim();

  let match = normalized.match(TIME_ONLY_REGEX);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return clampMinutes(hours, minutes);
  }

  match = normalized.match(TIME_12H_REGEX);
  if (match) {
    let hours = Number(match[1]) % 12; // 12 AM -> 0, 12 PM -> handled below
    const minutes = Number(match[2]);
    const meridiem = match[3].toLowerCase();
    if (meridiem === "pm") {
      hours += 12;
    }
    return clampMinutes(hours, minutes);
  }

  return null;
};

const getMinutesFromDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getUTCHours() * 60 + date.getUTCMinutes();
};

const parseTimeInputToMinutes = (input, label = "time") => {
  if (input === undefined || input === null || input === "") {
    throw new BadRequestError(`${label} is required`);
  }

  const timeStringMinutes = parseTimeString(input);
  if (timeStringMinutes !== null) {
    return timeStringMinutes;
  }

  const asDate = new Date(input);
  const dateMinutes = getMinutesFromDate(asDate);
  if (dateMinutes !== null) {
    return dateMinutes;
  }

  throw new BadRequestError(`Invalid ${label} supplied`);
};

const minutesToUtcDate = (minutes) => {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes >= 24 * 60) {
    throw new BadRequestError("Minutes must be within a single day");
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(Date.UTC(1970, 0, 1, hours, mins, 0, 0));
};

const extractMinutesFromStoredValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const fromString = parseTimeString(value);
    if (fromString !== null) {
      return fromString;
    }

    const asDate = new Date(value);
    const fromDate = getMinutesFromDate(asDate);
    if (fromDate !== null) {
      return fromDate;
    }
  }

  if (value instanceof Date) {
    const dateMinutes = getMinutesFromDate(value);
    if (dateMinutes !== null) {
      return dateMinutes;
    }
  }

  return null;
};

const formatMinutesToLabel = (minutes) => {
  if (!Number.isFinite(minutes)) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const serializeAvailabilitySlot = (record = {}) => {
  const startMinutes = extractMinutesFromStoredValue(record?.startTime);
  const endMinutes = extractMinutesFromStoredValue(record?.endTime);

  return {
    ...record,
    startTime:
      record?.startTime instanceof Date
        ? record.startTime.toISOString()
        : record?.startTime ?? null,
    endTime:
      record?.endTime instanceof Date
        ? record.endTime.toISOString()
        : record?.endTime ?? null,
    startMinutes,
    endMinutes,
    startTimeLabel: formatMinutesToLabel(startMinutes),
    endTimeLabel: formatMinutesToLabel(endMinutes),
  };
};

module.exports = {
  parseTimeInputToMinutes,
  minutesToUtcDate,
  extractMinutesFromStoredValue,
  formatMinutesToLabel,
  serializeAvailabilitySlot,
};
