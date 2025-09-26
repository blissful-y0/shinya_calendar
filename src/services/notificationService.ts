import { Event, ReminderTime } from "@types";
import {
  isBefore,
  isAfter,
  addMinutes,
  subMinutes,
  subHours,
  startOfDay,
  parseISO,
} from "date-fns";

interface ScheduledNotification {
  eventId: string;
  timeoutId: NodeJS.Timeout;
  scheduledTime: Date;
}

class NotificationService {
  private scheduledNotifications: Map<string, ScheduledNotification> =
    new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * 알림 서비스 시작
   */
  start() {
    // 매 분마다 체크
    this.checkInterval = setInterval(() => {
      this.checkUpcomingEvents();
    }, 60000);

    // 초기 체크
    this.checkUpcomingEvents();
  }

  /**
   * 알림 서비스 중지
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // 모든 예약된 알림 취소
    this.scheduledNotifications.forEach((notification) => {
      clearTimeout(notification.timeoutId);
    });
    this.scheduledNotifications.clear();
  }

  /**
   * 알림 시간 계산
   */
  private calculateNotificationTime(event: Event): Date | null {
    if (!event.reminder || !event.reminderTime) return null;

    const eventDate = new Date(event.date);

    // 종일 이벤트인 경우, 시간을 00:00으로 설정
    let eventTime: Date;
    if (event.isAllDay) {
      eventTime = startOfDay(eventDate);
      eventTime.setHours(0, 0, 0, 0);
    } else if (event.startTime) {
      const [hours, minutes] = event.startTime.split(":").map(Number);
      eventTime = new Date(eventDate);
      eventTime.setHours(hours, minutes, 0, 0);
    } else {
      return null;
    }

    // 알림 시간 계산
    switch (event.reminderTime) {
      case "now":
        return eventTime;
      case "5min":
        return subMinutes(eventTime, 5);
      case "10min":
        return subMinutes(eventTime, 10);
      case "30min":
        return subMinutes(eventTime, 30);
      case "1hour":
        return subHours(eventTime, 1);
      default:
        return eventTime;
    }
  }

  /**
   * 알림 예약
   */
  scheduleNotification(event: Event) {
    if (!event.reminder) return;

    // 이벤트에 대한 기존 알림 취소
    this.cancelNotification(event.id);

    const notificationTime = this.calculateNotificationTime(event);
    if (!notificationTime) return;

    const now = new Date();
    const timeUntilNotification = notificationTime.getTime() - now.getTime();

    // 알림이 미래이고 24시간 이내인 경우에만 예약
    // 메모리 문제를 방지하기 위해 24시간 이내의 이벤트만 예약
    const maxDelay = 24 * 60 * 60 * 1000; // 24시간 이내의 이벤트만 예약

    if (timeUntilNotification > 0 && timeUntilNotification <= maxDelay) {
      const timeoutId = setTimeout(async () => {
        await this.sendNotification(event);
        this.scheduledNotifications.delete(event.id);
      }, timeUntilNotification);

      this.scheduledNotifications.set(event.id, {
        eventId: event.id,
        timeoutId,
        scheduledTime: notificationTime,
      });
    }
  }

  /**
   * 예약된 알림 취소
   */
  cancelNotification(eventId: string) {
    const notification = this.scheduledNotifications.get(eventId);
    if (notification) {
      clearTimeout(notification.timeoutId);
      this.scheduledNotifications.delete(eventId);
    }
  }

  /**
   * Electron의 알림 API를 사용하여 알림 전송
   */
  private async sendNotification(event: Event) {
    try {
      const title = event.title;
      let body = "";

      if (event.isAllDay) {
        body = "오늘 하루 종일 진행되는 이벤트입니다.";
      } else if (event.startTime && event.endTime) {
        body = `${event.startTime} - ${event.endTime}`;
      } else if (event.startTime) {
        body = `${event.startTime}에 시작합니다.`;
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
          silent: false,
        });

        if (!result) {
          console.warn(`Failed to show notification for event: ${event.title}`);
        }
      } else {
        console.warn("Notification API not available");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
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
    this.scheduledNotifications.forEach((notification) => {
      clearTimeout(notification.timeoutId);
    });
    this.scheduledNotifications.clear();

    // Schedule new notifications
    events.forEach((event) => {
      if (event.reminder) {
        this.scheduleNotification(event);
      }
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
