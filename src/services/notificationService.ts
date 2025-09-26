import { Event, ReminderTime } from '@types';
import { isBefore, isAfter, addMinutes, subMinutes, subHours, startOfDay, parseISO, addDays, endOfDay } from 'date-fns';
import { generateRecurringEvents } from '@utils/eventUtils';

interface ScheduledNotification {
  eventId: string;
  timeoutId: NodeJS.Timeout;
  scheduledTime: Date;
  instanceDate?: Date; // For recurring event instances
}

class NotificationService {
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Start the notification service
   */
  start() {
    // Check for notifications every minute
    this.checkInterval = setInterval(() => {
      this.checkUpcomingEvents();
    }, 60000); // Check every minute

    // Initial check
    this.checkUpcomingEvents();
  }

  /**
   * Stop the notification service
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Clear all scheduled notifications
    this.scheduledNotifications.forEach(notification => {
      clearTimeout(notification.timeoutId);
    });
    this.scheduledNotifications.clear();
  }

  /**
   * Calculate notification time based on event and reminder settings
   */
  private calculateNotificationTime(event: Event, instanceDate?: Date): Date | null {
    if (!event.reminder || !event.reminderTime) return null;

    // Use instance date for recurring events, otherwise use event date
    const eventDate = instanceDate ? new Date(instanceDate) : new Date(event.date);

    // For all-day events, set time to midnight (00:00)
    let eventTime: Date;
    if (event.isAllDay) {
      eventTime = startOfDay(eventDate);
      eventTime.setHours(0, 0, 0, 0);
    } else if (event.startTime) {
      const [hours, minutes] = event.startTime.split(':').map(Number);
      eventTime = new Date(eventDate);
      eventTime.setHours(hours, minutes, 0, 0);
    } else {
      return null;
    }

    // Calculate notification time based on reminder setting
    switch (event.reminderTime) {
      case 'now':
        return eventTime;
      case '5min':
        return subMinutes(eventTime, 5);
      case '10min':
        return subMinutes(eventTime, 10);
      case '30min':
        return subMinutes(eventTime, 30);
      case '1hour':
        return subHours(eventTime, 1);
      default:
        return eventTime;
    }
  }

  /**
   * Schedule a notification for an event
   */
  scheduleNotification(event: Event) {
    if (!event.reminder) return;

    // If it's a recurring event and reminderForAllOccurrences is true,
    // schedule notifications for all upcoming instances
    if (event.recurrence && event.reminderForAllOccurrences) {
      this.scheduleRecurringNotifications(event);
    } else {
      // Schedule notification for single event or first occurrence only
      this.scheduleSingleNotification(event);
    }
  }

  /**
   * Schedule notification for a single event instance
   */
  private scheduleSingleNotification(event: Event, instanceDate?: Date, notificationKey?: string) {
    const key = notificationKey || event.id;

    // Cancel existing notification for this key
    this.cancelNotification(key);

    const notificationTime = this.calculateNotificationTime(event, instanceDate);
    if (!notificationTime) return;

    const now = new Date();
    const timeUntilNotification = notificationTime.getTime() - now.getTime();

    // Only schedule if the notification is in the future and within 24 hours
    // to avoid potential memory issues with very distant events
    const maxDelay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (timeUntilNotification > 0 && timeUntilNotification <= maxDelay) {
      const timeoutId = setTimeout(async () => {
        await this.sendNotification(event, instanceDate);
        this.scheduledNotifications.delete(key);
      }, timeUntilNotification);

      this.scheduledNotifications.set(key, {
        eventId: event.id,
        timeoutId,
        scheduledTime: notificationTime,
        instanceDate
      });
    }
  }

  /**
   * Schedule notifications for all recurring event instances
   */
  private scheduleRecurringNotifications(event: Event) {
    if (!event.recurrence) return;

    // Clear any existing notifications for this event
    // Remove all notifications that start with this event ID
    Array.from(this.scheduledNotifications.keys()).forEach(key => {
      if (key.startsWith(event.id)) {
        this.cancelNotification(key);
      }
    });

    // Generate recurring instances for the next 30 days
    const now = new Date();
    const rangeEnd = addDays(now, 30);
    const instances = generateRecurringEvents(event, now, rangeEnd);

    // Schedule notification for each instance
    instances.forEach((instance, index) => {
      const notificationKey = `${event.id}-${index}`;
      this.scheduleSingleNotification(event, instance.date, notificationKey);
    });
  }

  /**
   * Cancel a scheduled notification
   */
  cancelNotification(eventId: string) {
    const notification = this.scheduledNotifications.get(eventId);
    if (notification) {
      clearTimeout(notification.timeoutId);
      this.scheduledNotifications.delete(eventId);
    }
  }

  /**
   * Send a notification using Electron's notification API
   */
  private async sendNotification(event: Event, instanceDate?: Date) {
    try {
      const title = event.title;
      let body = '';

      // Add date info for recurring events
      if (event.recurrence && instanceDate) {
        const dateStr = instanceDate.toLocaleDateString('ko-KR', {
          month: 'long',
          day: 'numeric',
          weekday: 'short'
        });
        body = `${dateStr} - `;
      }

      if (event.isAllDay) {
        body += '하루 종일 진행되는 이벤트입니다.';
      } else if (event.startTime && event.endTime) {
        body += `${event.startTime} - ${event.endTime}`;
      } else if (event.startTime) {
        body += `${event.startTime}에 시작합니다.`;
      }

      if (event.description) {
        body += `\n${event.description}`;
      }

      // Send notification through Electron IPC with error handling
      if (window.electronAPI?.showNotification) {
        const result = await window.electronAPI.showNotification({
          title,
          body,
          icon: undefined, // Can add an icon path here if needed
          silent: false
        });

        if (!result) {
          console.warn(`Failed to show notification for event: ${event.title}`);
        }
      } else {
        console.warn('Notification API not available');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Check for upcoming events and schedule notifications
   */
  private checkUpcomingEvents() {
    // This will be called from the main app to update notifications
    // when events change or on regular intervals
  }

  /**
   * Update notifications when events change
   */
  updateNotifications(events: Event[]) {
    // Clear all existing notifications
    this.scheduledNotifications.forEach(notification => {
      clearTimeout(notification.timeoutId);
    });
    this.scheduledNotifications.clear();

    // Schedule new notifications
    events.forEach(event => {
      if (event.reminder) {
        this.scheduleNotification(event);
      }
    });

    // Re-check for any upcoming recurring events in the next 24 hours
    this.checkUpcomingEvents();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();