import { Event, RecurrenceRule } from '@types';
import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, isSameDay, startOfDay, endOfDay } from 'date-fns';

/**
 * Generate recurring event instances based on recurrence rule
 */
export function generateRecurringEvents(baseEvent: Event, startRange: Date, endRange: Date): Event[] {
  if (!baseEvent.recurrence) {
    return [baseEvent];
  }

  const events: Event[] = [];
  const { frequency, interval = 1, endDate, occurrences } = baseEvent.recurrence;

  let currentDate = new Date(baseEvent.date);
  let count = 0;
  const maxOccurrences = occurrences || 365; // Limit to prevent infinite loops

  // Calculate the difference between start and end date for multi-day events
  const daysDiff = baseEvent.endDate
    ? Math.floor((baseEvent.endDate.getTime() - baseEvent.date.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  while (
    isBefore(currentDate, endRange) &&
    count < maxOccurrences &&
    (!endDate || isBefore(currentDate, endDate))
  ) {
    // Check if the current date is within the display range
    if (isAfter(currentDate, startRange) || isSameDay(currentDate, startRange)) {
      const eventInstance: Event = {
        ...baseEvent,
        id: `${baseEvent.id}-${count}`,
        baseEventId: baseEvent.id,
        date: new Date(currentDate),
        endDate: daysDiff > 0 ? addDays(currentDate, daysDiff) : undefined
      };

      // Check if this instance is excluded
      if (!baseEvent.recurrence.excludeDates?.some(excludeDate =>
        isSameDay(new Date(excludeDate), currentDate)
      )) {
        events.push(eventInstance);
      }
    }

    // Move to next occurrence
    switch (frequency) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, interval);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, interval);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, interval);
        break;
    }

    count++;
  }

  return events;
}

/**
 * Check if an event occurs on a specific date
 */
export function isEventOnDate(event: Event, date: Date): boolean {
  const targetDate = startOfDay(date);
  const eventDate = startOfDay(event.date);

  // Single day event
  if (!event.endDate) {
    const matches = isSameDay(eventDate, targetDate);
    if (matches) {
      console.log(`Event "${event.title}" matches date ${date.toDateString()}`);
    }
    return matches;
  }

  // Multi-day event: check if target date falls between start and end
  const eventEndDate = startOfDay(event.endDate);
  const isInRange =
    (isSameDay(targetDate, eventDate) || isAfter(targetDate, eventDate)) &&
    (isSameDay(targetDate, eventEndDate) || isBefore(targetDate, eventEndDate));

  if (isInRange) {
    console.log(`Multi-day event "${event.title}" matches date ${date.toDateString()}`);
  }

  return isInRange;
}

/**
 * Get all events for a specific date, including recurring events
 */
export function getEventsForDate(events: Event[], date: Date, rangeStart: Date, rangeEnd: Date): Event[] {
  const eventsOnDate: Event[] = [];

  events.forEach(event => {
    if (event.recurrence) {
      // Generate recurring instances
      const instances = generateRecurringEvents(event, rangeStart, rangeEnd);
      instances.forEach(instance => {
        if (isEventOnDate(instance, date)) {
          eventsOnDate.push(instance);
        }
      });
    } else {
      // Check single event
      if (isEventOnDate(event, date)) {
        eventsOnDate.push(event);
      }
    }
  });

  return eventsOnDate;
}

/**
 * Format event time display
 */
export function formatEventTime(event: Event): string {
  if (event.isAllDay) {
    return '하루 종일';
  }

  if (event.startTime && event.endTime) {
    return `${event.startTime} - ${event.endTime}`;
  }

  if (event.startTime) {
    return event.startTime;
  }

  return '';
}