import { Event, GoogleCalendarAuth, GoogleCalendarEvent } from "@types";
import { electronStore } from "@utils/electronStore";

const SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email openid";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  private constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    this.clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "";
    // 로컬 loopback 주소 사용 (구글이 권장하는 데스크톱 앱 방식)
    this.redirectUri = "http://localhost:8080";
  }

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  /**
   * OAuth 인증 URL 생성
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
    });

    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  /**
   * 인증 코드로 토큰 교환
   */
  async getTokenFromCode(code: string): Promise<GoogleCalendarAuth> {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code.trim(), // 공백 제거
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Token exchange error:", errorData);
      throw new Error(`Failed to exchange code for token: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const auth: GoogleCalendarAuth = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      scope: data.scope,
      token_type: data.token_type,
      expiry_date: Date.now() + data.expires_in * 1000,
    };

    await electronStore.set("googleCalendarAuth", auth);
    return auth;
  }

  /**
   * 저장된 토큰 가져오기
   */
  async getStoredAuth(): Promise<GoogleCalendarAuth | null> {
    try {
      const auth = (await electronStore.get(
        "googleCalendarAuth"
      )) as GoogleCalendarAuth;
      return auth || null;
    } catch (error) {
      console.error("Failed to get stored auth:", error);
      return null;
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleCalendarAuth> {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    const auth: GoogleCalendarAuth = {
      access_token: data.access_token,
      refresh_token: refreshToken, // Keep the original refresh token
      scope: data.scope,
      token_type: data.token_type,
      expiry_date: Date.now() + data.expires_in * 1000,
    };

    await electronStore.set("googleCalendarAuth", auth);
    return auth;
  }

  /**
   * 연결 해제
   */
  async disconnect(): Promise<void> {
    const auth = await this.getStoredAuth();
    if (auth) {
      // Revoke token
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${auth.access_token}`,
        {
          method: "POST",
        }
      );
    }

    await electronStore.delete("googleCalendarAuth");
    await electronStore.delete("googleCalendarSyncState");
  }

  /**
   * 사용자 이메일 가져오기
   */
  async getUserEmail(accessToken?: string): Promise<string> {
    let token = accessToken;

    if (!token) {
      const auth = await this.ensureValidToken();
      token = auth.access_token;
    }

    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to get user info:", errorData);
      throw new Error("Failed to get user info");
    }

    const data = await response.json();
    return data.email || "";
  }

  /**
   * 구글 캘린더에서 이벤트 가져오기 (모든 캘린더)
   */
  async fetchEvents(
    timeMin?: Date,
    timeMax?: Date
  ): Promise<GoogleCalendarEvent[]> {
    const auth = await this.ensureValidToken();

    // 1. 먼저 모든 캘린더 목록 가져오기
    const calendarsResponse = await fetch(
      `${CALENDAR_API_BASE}/users/me/calendarList`,
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
    );

    if (!calendarsResponse.ok) {
      throw new Error("Failed to fetch calendar list");
    }

    const calendarsData = await calendarsResponse.json();
    const calendars = calendarsData.items || [];

    // 2. 각 캘린더에서 이벤트 가져오기
    const allEvents: GoogleCalendarEvent[] = [];

    for (const calendar of calendars) {
      try {
        const params = new URLSearchParams({
          maxResults: "2500",
          singleEvents: "false", // 반복 이벤트를 개별 인스턴스로 펼치지 않음
        });

        // 날짜 범위 필터 추가
        if (timeMin) {
          params.append("timeMin", timeMin.toISOString());
        }
        if (timeMax) {
          params.append("timeMax", timeMax.toISOString());
        }

        const calendarId = encodeURIComponent(calendar.id);
        const response = await fetch(
          `${CALENDAR_API_BASE}/calendars/${calendarId}/events?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${auth.access_token}`,
            },
          }
        );

        if (!response.ok) {
          console.warn(`Failed to fetch events from calendar: ${calendar.summary}`);
          continue;
        }

        const data = await response.json();
        const events = (data.items || []).map((event: any) => ({
          id: `${calendar.id}_${event.id}`, // 캘린더 ID를 접두사로 추가하여 고유성 보장
          summary: event.summary || "제목 없음",
          description: event.description || undefined,
          start: {
            dateTime: event.start?.dateTime || undefined,
            date: event.start?.date || undefined,
            timeZone: event.start?.timeZone || undefined,
          },
          end: {
            dateTime: event.end?.dateTime || undefined,
            date: event.end?.date || undefined,
            timeZone: event.end?.timeZone || undefined,
          },
          colorId: event.colorId || undefined,
          recurrence: event.recurrence || undefined,
        }));

        allEvents.push(...events);
      } catch (error) {
        console.error(`Error fetching events from calendar ${calendar.summary}:`, error);
      }
    }

    return allEvents;
  }

  /**
   * 구글 캘린더로 이벤트 보내기
   */
  async createEvent(event: Event): Promise<string> {
    const auth = await this.ensureValidToken();
    const googleEvent = this.convertToGoogleEvent(event);

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create event");
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * 구글 캘린더 이벤트 업데이트
   */
  async updateEvent(googleEventId: string, event: Event): Promise<void> {
    const auth = await this.ensureValidToken();
    const googleEvent = this.convertToGoogleEvent(event);

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events/${googleEventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update event");
    }
  }

  /**
   * 구글 캘린더 이벤트 삭제
   */
  async deleteEvent(googleEventId: string): Promise<void> {
    const auth = await this.ensureValidToken();

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events/${googleEventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete event");
    }
  }

  /**
   * 앱 이벤트를 구글 캘린더 형식으로 변환
   */
  private convertToGoogleEvent(event: Event): any {
    const googleEvent: any = {
      summary: event.title,
      description: event.description || "",
    };

    // 종일 이벤트 처리
    if (event.isAllDay) {
      googleEvent.start = {
        date: event.date.toISOString().split("T")[0],
      };
      googleEvent.end = {
        date: event.endDate
          ? event.endDate.toISOString().split("T")[0]
          : event.date.toISOString().split("T")[0],
      };
    } else {
      // 시간이 있는 이벤트
      const startDateTime = this.combineDateAndTime(
        event.date,
        event.startTime
      );
      const endDateTime = event.endTime
        ? this.combineDateAndTime(event.endDate || event.date, event.endTime)
        : new Date(startDateTime.getTime() + 60 * 60 * 1000); // 기본 1시간

      googleEvent.start = {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      googleEvent.end = {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    // 반복 일정 처리
    if (event.recurrence) {
      googleEvent.recurrence = this.convertToGoogleRecurrence(event.recurrence);
    }

    return googleEvent;
  }

  /**
   * 날짜와 시간을 결합
   */
  private combineDateAndTime(date: Date, time?: string): Date {
    if (!time) return date;

    const [hours, minutes] = time.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  /**
   * 앱 반복 규칙을 구글 캘린더 RRULE 형식으로 변환
   */
  private convertToGoogleRecurrence(recurrence: any): string[] {
    const freq = recurrence.frequency.toUpperCase();
    const interval = recurrence.interval || 1;

    let rrule = `RRULE:FREQ=${freq};INTERVAL=${interval}`;

    if (recurrence.occurrences) {
      rrule += `;COUNT=${recurrence.occurrences}`;
    } else if (recurrence.endDate) {
      const until =
        recurrence.endDate.toISOString().replace(/[-:]/g, "").split(".")[0] +
        "Z";
      rrule += `;UNTIL=${until}`;
    }

    return [rrule];
  }

  /**
   * 유효한 토큰 확보 (필요시 갱신)
   */
  private async ensureValidToken(): Promise<GoogleCalendarAuth> {
    let auth = await this.getStoredAuth();

    if (!auth) {
      throw new Error(
        "Google Calendar not connected. Please authenticate first."
      );
    }

    // 토큰 만료 확인 (5분 여유 두기)
    if (auth.expiry_date < Date.now() + 5 * 60 * 1000) {
      auth = await this.refreshAccessToken(auth.refresh_token);
    }

    return auth;
  }
}

export const googleCalendarService = GoogleCalendarService.getInstance();
