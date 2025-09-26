import { Event, ReminderTime } from '@types';
import { isBefore, isAfter, addMinutes, subMinutes, subHours, startOfDay, parseISO } from 'date-fns';

interface ScheduledNotification {
  eventId: string;
  timeoutId: NodeJS.Timeout;
  scheduledTime: Date;
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
  private calculateNotificationTime(event: Event): Date | null {
    if (!event.reminder || !event.reminderTime) return null;

    const eventDate = new Date(event.date);

    // For all-day events, set time to 9 AM
    let eventTime: Date;
    if (event.isAllDay) {
      eventTime = startOfDay(eventDate);
      eventTime.setHours(9, 0, 0, 0);
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

    // Cancel existing notification for this event
    this.cancelNotification(event.id);

    const notificationTime = this.calculateNotificationTime(event);
    if (!notificationTime) return;

    const now = new Date();
    const timeUntilNotification = notificationTime.getTime() - now.getTime();

    // Only schedule if the notification is in the future
    if (timeUntilNotification > 0) {
      const timeoutId = setTimeout(() => {
        this.sendNotification(event);
        this.scheduledNotifications.delete(event.id);
      }, timeUntilNotification);

      this.scheduledNotifications.set(event.id, {
        eventId: event.id,
        timeoutId,
        scheduledTime: notificationTime
      });
    }
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
  private sendNotification(event: Event) {
    const title = event.title;
    let body = '';

    if (event.isAllDay) {
      body = '오늘 하루 종일 이벤트가 있습니다.';
    } else if (event.startTime && event.endTime) {
      body = `${event.startTime} - ${event.endTime}`;
    } else if (event.startTime) {
      body = `${event.startTime}에 시작합니다.`;
    }

    if (event.description) {
      body += `\n${event.description}`;
    }

    // Send notification through Electron IPC
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification({
        title,
        body,
        icon: undefined, // Can add an icon path here if needed
        silent: false
      });
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
  }
}

// Export singleton instance
export const notificationService = new NotificationService();