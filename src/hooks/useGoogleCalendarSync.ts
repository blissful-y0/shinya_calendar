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

        // 기존 이벤트와 병합 (중복 제거)
        const existingIds = new Set(events.map((e) => e.id));

        // 중복 제거: 이미 존재하는 ID는 제외
        const newEvents = importedEvents.filter((e) => !existingIds.has(e.id));

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
 * 구글 캘린더 이벤트를 앱 이벤트 형식으로 변환
 */
function convertGoogleEventToAppEvent(gEvent: GoogleCalendarEvent): Event {
  const isAllDay = !!gEvent.start.date;

  let date: Date;
  let endDate: Date | undefined;
  let startTime: string | undefined;
  let endTime: string | undefined;

  if (isAllDay) {
    // 종일 이벤트: YYYY-MM-DD 형식을 UTC로 저장 (타임존 문제 방지)
    const [year, month, day] = gEvent.start.date!.split('-').map(Number);
    date = new Date(Date.UTC(year, month - 1, day));

    if (gEvent.end.date) {
      const [eYear, eMonth, eDay] = gEvent.end.date.split('-').map(Number);
      endDate = new Date(Date.UTC(eYear, eMonth - 1, eDay));
      // 구글 캘린더의 종일 이벤트는 종료일이 다음날로 설정되므로 하루 빼기
      endDate.setUTCDate(endDate.getUTCDate() - 1);
    }
  } else {
    // 시간 지정 이벤트: 로컬 타임존 기준으로 날짜 추출
    const startDateTime = new Date(gEvent.start.dateTime!);
    const endDateTime = new Date(gEvent.end.dateTime!);

    // 날짜는 UTC로 저장 (로컬 날짜 기준)
    date = new Date(Date.UTC(
      startDateTime.getFullYear(),
      startDateTime.getMonth(),
      startDateTime.getDate()
    ));
    startTime = formatTime(startDateTime);
    endTime = formatTime(endDateTime);

    // 종료일이 시작일과 다른 경우 endDate 설정 (로컬 타임존 기준으로 비교)
    if (startDateTime.getDate() !== endDateTime.getDate() ||
        startDateTime.getMonth() !== endDateTime.getMonth() ||
        startDateTime.getFullYear() !== endDateTime.getFullYear()) {
      endDate = new Date(Date.UTC(
        endDateTime.getFullYear(),
        endDateTime.getMonth(),
        endDateTime.getDate()
      ));
    }
  }

  // 색상 매핑: 구글 캘린더 색상 -> 앱 색상 팔레트
  // 앱 색상: #FFB6C1(핑크), #FFC0CB(연핑크), #FFE4B5(베이지), #E6E6FA(라벤더),
  //         #B0E0E6(하늘), #98FB98(민트), #F0E68C(노랑), #DDA0DD(자주)
  const colorMap: Record<string, string> = {
    "1": "#B0E0E6",  // 구글 연한 파란색 → 하늘색
    "2": "#98FB98",  // 구글 민트색 → 민트
    "3": "#DDA0DD",  // 구글 연한 보라색 → 자주
    "4": "#FFB6C1",  // 구글 연한 빨간색 → 핑크
    "5": "#F0E68C",  // 구글 노란색 → 노랑
    "6": "#FFE4B5",  // 구글 오렌지색 → 베이지
    "7": "#B0E0E6",  // 구글 청록색 → 하늘색
    "8": "#E6E6FA",  // 구글 회색 → 라벤더
    "9": "#B0E0E6",  // 구글 파란색 → 하늘색
    "10": "#98FB98", // 구글 초록색 → 민트
    "11": "#FFB6C1", // 구글 빨간색 → 핑크
  };

  const color = gEvent.colorId
    ? colorMap[gEvent.colorId] || "#FFC0CB"
    : "#FFC0CB"; // 기본값: 연핑크

  // 반복 이벤트 규칙 처리
  let recurrence;
  if (gEvent.recurrence && gEvent.recurrence.length > 0) {
    recurrence = parseGoogleRecurrence(gEvent.recurrence[0], gEvent.summary);
  }

  return {
    id: `google_${gEvent.id || uuidv4()}`, // 구글 캘린더 이벤트 ID
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
 * 구글 RRULE 문자열을 앱 반복 규칙 형식으로 변환
 */
function parseGoogleRecurrence(rruleString: string, eventTitle?: string): any {
  try {
    if (!rruleString || !rruleString.startsWith('RRULE:')) {
      console.warn('잘못된 반복 규칙 형식:', rruleString);
      return undefined;
    }

    // rrule 라이브러리로 파싱
    const rule = rrulestr(rruleString);
    const options = rule.options;

    // 빈도(frequency) 매핑
    const freqMap: Record<number, "daily" | "weekly" | "monthly" | "yearly"> = {
      [RRule.DAILY]: 'daily',
      [RRule.WEEKLY]: 'weekly',
      [RRule.MONTHLY]: 'monthly',
      [RRule.YEARLY]: 'yearly'
    };

    const frequency = freqMap[options.freq];
    if (!frequency) {
      console.warn('알 수 없는 반복 빈도:', options.freq);
      return undefined;
    }

    // 기본 반복 규칙 필드
    const recurrence: any = {
      frequency,
      interval: options.interval || 1,
    };

    // COUNT: 반복 횟수 제한
    if (options.count) {
      recurrence.occurrences = options.count;
    }

    // UNTIL: 반복 종료 날짜
    if (options.until) {
      recurrence.endDate = options.until;
    }

    // BYDAY: 요일 지정
    // RRule 형식: 0=월요일, 1=화요일, ..., 6=일요일
    // RRule 형식 그대로 저장 (표시 시 변환)
    if (options.byweekday && options.byweekday.length > 0) {
      // RRule Weekday 객체를 숫자로 변환
      const weekdayArray = Array.isArray(options.byweekday)
        ? options.byweekday
        : [options.byweekday];

      recurrence.byweekday = weekdayArray.map(day => {
        // Weekday 객체인 경우 weekday 속성 추출
        if (typeof day === 'object' && day !== null && 'weekday' in day) {
          return (day as any).weekday;
        }
        return day;
      }).sort((a, b) => a - b);
    }

    // BYMONTHDAY: 월의 특정 일 지정 (예: 매월 15일)
    if (options.bymonthday) {
      recurrence.bymonthday = Array.isArray(options.bymonthday)
        ? options.bymonthday[0]
        : options.bymonthday;
    }

    // BYSETPOS: n번째 발생 지정 (예: 매월 세 번째 월요일)
    if (options.bysetpos) {
      recurrence.bysetpos = Array.isArray(options.bysetpos)
        ? options.bysetpos[0]
        : options.bysetpos;
    }

    // 원본 RRULE 문자열 저장 (정확한 재생성을 위해)
    recurrence._rrule = rruleString;

    return recurrence;
  } catch (error) {
    console.error('반복 규칙 파싱 실패:', rruleString, error);
    return undefined;
  }
}
