import { useState, useCallback } from "react";
import { useRecoilState } from "recoil";
import { eventsState, googleCalendarSyncState } from "@store/atoms";
import { googleCalendarService } from "@/services/googleCalendarService";
import { Event, GoogleCalendarEvent } from "@types";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { RRule, rrulestr } from "rrule";

export const useGoogleCalendarSync = () => {
  const [events, setEvents] = useRecoilState(eventsState);
  const [syncState, setSyncState] = useRecoilState(googleCalendarSyncState);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * 구글 캘린더에서 이벤트 가져오기
   */
  const importFromGoogle = useCallback(
    async (timeMin?: Date, timeMax?: Date) => {
      if (!syncState.isConnected) {
        toast.error("구글 캘린더에 먼저 연동해주세요");
        return;
      }

      setIsSyncing(true);
      try {
        const googleEvents = await googleCalendarService.fetchEvents(
          timeMin,
          timeMax
        );

        const importedEvents: Event[] = googleEvents.map((gEvent) =>
          convertGoogleEventToAppEvent(gEvent)
        );

        console.log('Imported events from Google:', importedEvents);
        console.log('Sample event date:', importedEvents[0]?.date, 'Type:', typeof importedEvents[0]?.date);

        // 기존 이벤트와 병합 (중복 제거)
        const existingIds = new Set(events.map((e) => e.id));
        console.log('Existing event IDs sample (first 10):', Array.from(existingIds).slice(0, 10));
        console.log('Google event IDs sample (first 5):', importedEvents.slice(0, 5).map(e => e.id));

        // 중복 제거: 이미 존재하는 ID는 제외
        const newEvents = importedEvents.filter((e) => !existingIds.has(e.id));

        console.log('New events to add:', newEvents);
        console.log('Duplicate events filtered out:', importedEvents.length - newEvents.length);
        console.log('Total events after merge:', [...events, ...newEvents].length);

        setEvents([...events, ...newEvents]);

        setSyncState({
          ...syncState,
          lastSyncTime: new Date(),
        });

        toast.success(`${newEvents.length}개의 이벤트를 가져왔습니다`);
        return newEvents;
      } catch (error) {
        console.error("Failed to import events from Google:", error);
        toast.error("이벤트 가져오기 실패");
        throw error;
      } finally {
        setIsSyncing(false);
      }
    },
    [events, setEvents, syncState, setSyncState]
  );

  /**
   * 구글 캘린더로 이벤트 보내기 (단일)
   */
  const exportToGoogle = useCallback(
    async (event: Event) => {
      if (!syncState.isConnected) {
        toast.error("구글 캘린더에 먼저 연동해주세요");
        return;
      }

      try {
        const googleEventId = await googleCalendarService.createEvent(event);
        toast.success(`"${event.title}" 이벤트를 구글 캘린더로 보냈습니다`);
        return googleEventId;
      } catch (error) {
        console.error("Failed to export event to Google:", error);
        toast.error("이벤트 보내기 실패");
        throw error;
      }
    },
    [syncState]
  );

  /**
   * 구글 캘린더로 여러 이벤트 보내기
   */
  const exportMultipleToGoogle = useCallback(
    async (eventsToExport: Event[]) => {
      if (!syncState.isConnected) {
        toast.error("구글 캘린더에 먼저 연동해주세요");
        return;
      }

      setIsSyncing(true);
      try {
        let successCount = 0;
        let failCount = 0;

        for (const event of eventsToExport) {
          try {
            await googleCalendarService.createEvent(event);
            successCount++;
          } catch (error) {
            console.error(`Failed to export event ${event.id}:`, error);
            failCount++;
          }
        }

        setSyncState({
          ...syncState,
          lastSyncTime: new Date(),
        });

        if (failCount === 0) {
          toast.success(
            `${successCount}개의 이벤트를 구글 캘린더로 보냈습니다`
          );
        } else {
          toast.error(`${successCount}개 성공, ${failCount}개 실패`);
        }
      } catch (error) {
        console.error("Failed to export multiple events:", error);
        toast.error("이벤트 보내기 실패");
        throw error;
      } finally {
        setIsSyncing(false);
      }
    },
    [syncState, setSyncState]
  );

  /**
   * 양방향 동기화
   */
  const syncBidirectional = useCallback(async () => {
    if (!syncState.isConnected) {
      toast.error("구글 캘린더에 먼저 연동해주세요");
      return;
    }

    setIsSyncing(true);
    try {
      // 1. 구글에서 이벤트 가져오기
      await importFromGoogle();

      toast.success("동기화 완료");
    } catch (error) {
      console.error("Bidirectional sync failed:", error);
      toast.error("동기화 실패");
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [syncState, importFromGoogle]);

  return {
    importFromGoogle,
    exportToGoogle,
    exportMultipleToGoogle,
    syncBidirectional,
    isSyncing,
  };
};

/**
 * 구글 캘린더 이벤트를 앱 이벤트로 변환
 */
function convertGoogleEventToAppEvent(gEvent: GoogleCalendarEvent): Event {
  const isAllDay = !!gEvent.start.date;

  let date: Date;
  let endDate: Date | undefined;
  let startTime: string | undefined;
  let endTime: string | undefined;

  if (isAllDay) {
    // 종일 이벤트: YYYY-MM-DD 형식을 로컬 타임존으로 파싱
    const [year, month, day] = gEvent.start.date!.split('-').map(Number);
    date = new Date(year, month - 1, day);

    if (gEvent.end.date) {
      const [eYear, eMonth, eDay] = gEvent.end.date.split('-').map(Number);
      endDate = new Date(eYear, eMonth - 1, eDay);
      // 구글 캘린더의 종일 이벤트는 종료일이 다음날로 설정되므로 하루 빼기
      endDate.setDate(endDate.getDate() - 1);
    }
  } else {
    const startDateTime = new Date(gEvent.start.dateTime!);
    const endDateTime = new Date(gEvent.end.dateTime!);

    date = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
    startTime = formatTime(startDateTime);
    endTime = formatTime(endDateTime);

    // 다른 날짜면 endDate 설정
    if (startDateTime.toDateString() !== endDateTime.toDateString()) {
      endDate = new Date(endDateTime.getFullYear(), endDateTime.getMonth(), endDateTime.getDate());
    }
  }

  // 색상 매핑 (구글 캘린더 색상 ID -> 앱 색상)
  const colorMap: Record<string, string> = {
    "1": "#a4bdfc", // 연한 파란색
    "2": "#7ae7bf", // 민트색
    "3": "#dbadff", // 연한 보라색
    "4": "#ff887c", // 연한 빨간색
    "5": "#fbd75b", // 노란색
    "6": "#ffb878", // 오렌지색
    "7": "#46d6db", // 청록색
    "8": "#e1e1e1", // 회색
    "9": "#5484ed", // 파란색
    "10": "#51b749", // 초록색
    "11": "#dc2127", // 빨간색
  };

  const color = gEvent.colorId
    ? colorMap[gEvent.colorId] || "#a4bdfc"
    : "#a4bdfc";

  // 반복 이벤트 처리
  let recurrence;
  if (gEvent.recurrence && gEvent.recurrence.length > 0) {
    recurrence = parseGoogleRecurrence(gEvent.recurrence[0]);
  }

  return {
    id: `google_${gEvent.id || uuidv4()}`, // 구글 이벤트임을 표시
    title: gEvent.summary,
    date,
    endDate,
    startTime,
    endTime,
    color,
    description: gEvent.description,
    isAllDay,
    recurrence,
  };
}

/**
 * 시간을 HH:mm 형식으로 포맷
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * 구글 RRULE을 앱 반복 규칙으로 변환 (rrule 라이브러리 사용)
 */
function parseGoogleRecurrence(rruleString: string): any {
  try {
    if (!rruleString || !rruleString.startsWith('RRULE:')) {
      console.warn('Invalid recurrence rule:', rruleString);
      return undefined;
    }

    // rrule 라이브러리로 파싱
    const rule = rrulestr(rruleString);
    const options = rule.options;

    // frequency 매핑
    const freqMap: Record<number, "daily" | "weekly" | "monthly" | "yearly"> = {
      [RRule.DAILY]: 'daily',
      [RRule.WEEKLY]: 'weekly',
      [RRule.MONTHLY]: 'monthly',
      [RRule.YEARLY]: 'yearly'
    };

    const frequency = freqMap[options.freq];
    if (!frequency) {
      console.warn('Unknown frequency:', options.freq);
      return undefined;
    }

    // 기본 필드들
    const recurrence: any = {
      frequency,
      interval: options.interval || 1,
    };

    // COUNT (occurrences)
    if (options.count) {
      recurrence.occurrences = options.count;
    }

    // UNTIL (endDate)
    if (options.until) {
      recurrence.endDate = options.until;
    }

    // 추가 옵션들 (BYDAY, BYMONTHDAY 등)을 원본 RRULE 문자열로 저장
    // 나중에 다시 생성할 때 사용
    recurrence._rrule = rruleString;

    console.log('Parsed recurrence rule:', recurrence);

    return recurrence;
  } catch (error) {
    console.error('Failed to parse recurrence rule:', rruleString, error);
    return undefined;
  }
}
