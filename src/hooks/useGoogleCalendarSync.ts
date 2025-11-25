import { useState, useCallback } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  eventsState,
  googleCalendarSyncState,
  categoriesState,
  globalLoadingState,
} from "@store/atoms";
import { googleCalendarService } from "@/services/googleCalendarService";
import { Event, GoogleCalendarEvent as OriginalGoogleCalendarEvent } from "@types";

// GoogleCalendarEvent 타입 확장: extendedProperties를 선택적으로 추가
type GoogleCalendarEvent = OriginalGoogleCalendarEvent & {
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  organizer?: {
    email?: string;
    [key: string]: any;
  };
};
import { electronStore } from "@utils/electronStore";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { RRule, rrulestr } from "rrule";
import { getColorByIndex } from "@constants/colors";

export const useGoogleCalendarSync = () => {
  const [events, setEvents] = useRecoilState(eventsState);
  const [syncState, setSyncState] = useRecoilState(googleCalendarSyncState);
  const [categories, setCategories] = useRecoilState(categoriesState);
  const setGlobalLoading = useSetRecoilState(globalLoadingState);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * 구글 캘린더 이름으로 로컬 카테고리 찾기 또는 생성
   * @param calendarName 캘린더 이름
   * @param calendarId 구글 캘린더 ID
   * @param currentCategories 현재 카테고리 목록 (최신 상태)
   * @param colorIndex 색상 인덱스
   * @returns 카테고리 객체 (id, color, isNew 포함)
   */
  const findOrCreateCategory = useCallback(
    (
      calendarName: string | undefined,
      calendarId: string | undefined,
      currentCategories: typeof categories,
      colorIndex: number
    ): { id: string; color: string; category?: any; isNew: boolean } => {
      const defaultCategory = currentCategories.find((c) => c.isDefault);
      if (!calendarName) {
        return defaultCategory
          ? { id: defaultCategory.id, color: defaultCategory.color, isNew: false }
          : { id: '', color: getColorByIndex(0), isNew: false };
      }

      // "[Shinya]" 접두사 제거
      const cleanName = calendarName.replace(/^\[Shinya\]\s*/, "").trim();

      // 1. 정확한 이름 매칭
      let matchedCategory = currentCategories.find(
        (c) => c.name.toLowerCase() === cleanName.toLowerCase()
      );

      // 2. 없으면 부분 매칭
      if (!matchedCategory) {
        matchedCategory = currentCategories.find(
          (c) =>
            c.name.toLowerCase().includes(cleanName.toLowerCase()) ||
            cleanName.toLowerCase().includes(c.name.toLowerCase())
        );
      }

      // 3. 매칭되는 카테고리가 있으면 해당 정보 반환
      if (matchedCategory) {
        return { id: matchedCategory.id, color: matchedCategory.color, isNew: false };
      }

      // 4. 매칭되는 카테고리가 없으면 새 카테고리 객체 생성 (상태 업데이트는 나중에 일괄 처리)
      const newCategory = {
        id: uuidv4(),
        name: cleanName,
        description: `${calendarName}에서 자동으로 생성됨`,
        color: getColorByIndex(colorIndex),
        googleCalendarId: calendarId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        id: newCategory.id,
        color: newCategory.color,
        category: newCategory,
        isNew: true
      };
    },
    [setCategories]
  );

  /**
   * 구글 캘린더에서 이벤트 가져오기
   * @param timeMin 시작 날짜 (선택사항)
   * @param timeMax 종료 날짜 (선택사항)
   * @param calendarIds 가져올 캘린더 ID 배열 (선택사항)
   */
  const importFromGoogle = useCallback(
    async (timeMin?: Date, timeMax?: Date, calendarIds?: string[]) => {
      if (!syncState.isConnected) {
        toast.error("구글 캘린더에 먼저 연동해주세요");
        return;
      }

      setIsSyncing(true);
      setGlobalLoading(true);
      try {
        const { events: googleEvents, deletedEventIds } =
          await googleCalendarService.fetchEvents(
            timeMin,
            timeMax,
            calendarIds
          );

        // 선택된 캘린더 정보 가져오기
        const selectedCalendarsInfo = await electronStore.get("selectedGoogleCalendarsInfo") as any[] || [];
        const selectedCalendarIds = calendarIds || selectedCalendarsInfo.map((cal: any) => cal.id);

        // 각 이벤트를 순차적으로 처리
        const importedEvents: Event[] = [];

        // 이번 import 세션에서 처리한 캘린더 이름을 캐싱하여 중복 생성 방지
        const processedCalendars = new Map<
          string,
          { id: string; color: string }
        >();

        // 새로 생성할 카테고리 목록
        const newCategoriesToCreate: any[] = [];

        // 현재 카테고리 목록 (루프 중에 변경되지 않는 스냅샷)
        let currentCategories = categories;

        // 1단계: 선택된 캘린더를 먼저 카테고리로 생성 (이벤트가 없는 캘린더 대응)
        for (const calendarInfo of selectedCalendarsInfo) {
          if (!selectedCalendarIds.includes(calendarInfo.id)) {
            continue; // 선택되지 않은 캘린더는 건너뛰기
          }

          // 이미 카테고리로 등록되어 있는지 확인
          const existingCategory = currentCategories.find(
            (cat) => cat.googleCalendarId === calendarInfo.id
          );

          if (!existingCategory) {
            // 새 카테고리 생성
            const colorIndex = currentCategories.length + newCategoriesToCreate.length;
            const newCategory = {
              id: uuidv4(),
              name: calendarInfo.summary,
              description: calendarInfo.description,
              color: getColorByIndex(colorIndex),
              googleCalendarId: calendarInfo.id,
              accessRole: calendarInfo.accessRole,
              createdInApp: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            newCategoriesToCreate.push(newCategory);
            currentCategories = [...currentCategories, newCategory];

            // 캐시에도 추가
            processedCalendars.set(calendarInfo.summary || "", {
              id: newCategory.id,
              color: newCategory.color,
            });
          } else {
            // 기존 카테고리 캐시에 추가
            processedCalendars.set(calendarInfo.summary || "", {
              id: existingCategory.id,
              color: existingCategory.color,
            });
          }
        }

        // 2단계: 이벤트 처리
        for (const gEvent of googleEvents) {
          const event = convertGoogleEventToAppEvent(gEvent);

          // 캐시에서 먼저 확인
          const calendarKey = gEvent.calendarName || "";
          let categoryInfo = processedCalendars.get(calendarKey);

          // 캐시에 없으면 찾기 (1단계에서 이미 생성했으므로 여기서는 생성하지 않음)
          if (!categoryInfo) {
            // 기존 카테고리에서 찾기
            const existingCategory = currentCategories.find(
              (cat) => cat.googleCalendarId === gEvent.calendarId
            );

            if (existingCategory) {
              categoryInfo = {
                id: existingCategory.id,
                color: existingCategory.color,
              };
              processedCalendars.set(calendarKey, categoryInfo);
            } else {
              // 선택되지 않은 캘린더의 이벤트인 경우 기본 카테고리 사용
              const defaultCategory = currentCategories.find((c) => c.isDefault);
              categoryInfo = defaultCategory
                ? { id: defaultCategory.id, color: defaultCategory.color }
                : { id: '', color: getColorByIndex(0) };
            }
          }

          // 카테고리 색상을 이벤트 색상으로 적용
          const eventColor = categoryInfo ? categoryInfo.color : event.color;

          importedEvents.push({
            ...event,
            categoryId: categoryInfo?.id,
            color: eventColor,
          });
        }

        // 3단계: 새 카테고리 일괄 생성 (선택된 캘린더, 이벤트 유무 무관)
        if (newCategoriesToCreate.length > 0) {
          setCategories((prev) => [...prev, ...newCategoriesToCreate]);
          toast.success(`${newCategoriesToCreate.length}개의 카테고리가 생성되었습니다`);
        }

        // 로컬 이벤트 처리 준비
        const localGoogleEvents = events.filter((e) => e.googleEventId); // 구글 연동된 로컬 이벤트
        const localOnlyEvents = events.filter((e) => !e.googleEventId); // 구글 미연동 로컬 이벤트

        // 삭제된 이벤트 ID 집합
        const deletedEventIdsSet = new Set(deletedEventIds);

        // 기존 로컬 이벤트 맵: id -> event, googleId -> event
        const existingEventsMapById = new Map(events.map((e) => [e.id, e]));
        const existingEventsMapByGoogleId = new Map(
          events.filter((e) => e.googleEventId).map((e) => [String(e.googleEventId), e])
        );

        const newEvents: Event[] = [];
        const updatedEvents: Event[] = [];
        const eventsToDelete: Event[] = [];

        // helper: 콘텐츠 기반 matching (제목+date+startTime)
        const findByContent = (candidate: Event) => {
          return events.find((le) => {
            if (le.title !== candidate.title) return false;
            const sameDate = le.date?.toString() === candidate.date?.toString();
            const sameStart = (le.startTime || "") === (candidate.startTime || "");
            return sameDate && sameStart;
          });
        };

        // 실제 처리 루프: importedEvents는 convertGoogleEventToAppEvent로 이미 변환된 로컬 형태
        for (const importedEvent of importedEvents) {
          // 1) shinya_local_id 우선 검사
          const shinyaLocalId =
            (importedEvent as any).id && String(importedEvent.id).startsWith("google_") === false
              ? importedEvent.id
              : (importedEvent as any).__shinya_local_id ?? null;

          let matchedLocal: Event | undefined;

          if (shinyaLocalId && existingEventsMapById.has(String(shinyaLocalId))) {
            matchedLocal = existingEventsMapById.get(String(shinyaLocalId));
            console.log("[sync] matched by shinya_local_id:", importedEvent.title, shinyaLocalId);
          }

          // 2) 구글 이벤트 ID로 매칭
          if (!matchedLocal && importedEvent.googleEventId) {
            matchedLocal = existingEventsMapByGoogleId.get(String(importedEvent.googleEventId));
            if (matchedLocal) {
              console.log("[sync] matched by googleEventId:", importedEvent.title, importedEvent.googleEventId);
            }
          }

          // 3) 콘텐츠 기반 매칭(제목+날짜+시작시간) - 마지막 수단
          if (!matchedLocal) {
            const byContent = findByContent(importedEvent);
            if (byContent) {
              matchedLocal = byContent;
              console.log("[sync] matched by content:", importedEvent.title);
            }
          }

          if (matchedLocal) {
            // 기존 로컬 이벤트가 있으면 병합(로컬 ID 유지)
            const merged: Event = {
              ...matchedLocal,
              ...importedEvent,
              id: matchedLocal.id,
              // 보장: googleEventId는 구글 고유 ID로 덮어쓰거나 유지
              googleEventId: importedEvent.googleEventId || matchedLocal.googleEventId,
              googleCalendarId: importedEvent.googleCalendarId || matchedLocal.googleCalendarId,
            };
            updatedEvents.push(merged);
            existingEventsMapById.set(merged.id, merged);
            if (merged.googleEventId) {
              existingEventsMapByGoogleId.set(String(merged.googleEventId), merged);
            }
          } else {
            // 신규 이벤트 추가
            newEvents.push(importedEvent);
            existingEventsMapById.set(importedEvent.id, importedEvent);
            if (importedEvent.googleEventId) {
              existingEventsMapByGoogleId.set(String(importedEvent.googleEventId), importedEvent);
            }
          }
        }

        // 삭제 처리: 로컬에 googleEventId로 존재하는 이벤트 중 삭제 목록에 있는 것 제거
        for (const localEv of localGoogleEvents) {
          if (deletedEventIdsSet.has(String(localEv.googleEventId || localEv.id))) {
            eventsToDelete.push(localEv);
            existingEventsMapById.delete(localEv.id);
            if (localEv.googleEventId) existingEventsMapByGoogleId.delete(String(localEv.googleEventId));
            console.log("[sync] marked deleted:", localEv.title, localEv.googleEventId || localEv.id);
          }
        }

        // 최종 이벤트 목록 적용
        const finalEvents = Array.from(existingEventsMapById.values());
        setEvents(finalEvents);
        // 상태 업데이트, 토스트 등은 기존 로직 유지
        setSyncState({
          ...syncState,
          lastSyncTime: new Date(),
        });

        // 결과 메시지
        const messages = [];
        if (newEvents.length > 0) messages.push(`${newEvents.length}개 추가`);
        if (updatedEvents.length > 0) messages.push(`${updatedEvents.length}개 수정`);
        if (eventsToDelete.length > 0) messages.push(`${eventsToDelete.length}개 삭제`);
        if (messages.length === 0) {
          toast.success("이미 최신 상태입니다");
        } else {
          toast.success(`동기화 완료: ${messages.join(", ")}`);
        }

        return newEvents;
      } catch (error) {
        console.error("Failed to import events from Google:", error);
        toast.error("이벤트 가져오기 실패");
        throw error;
      } finally {
        setIsSyncing(false);
        setGlobalLoading(false);
      }
    },
    [
      events,
      setEvents,
      syncState,
      setSyncState,
      categories,
      findOrCreateCategory,
      setGlobalLoading,
      setCategories,
    ]
  );

  /**
   * 구글 캘린더로 이벤트 보내기 (단일)
   * @returns googleEventId와 googleCalendarId를 포함한 객체
   */
  const exportToGoogle = useCallback(
    async (
      event: Event
    ): Promise<
      { googleEventId: string; googleCalendarId: string } | undefined
    > => {
      if (!syncState.isConnected) {
        toast.error("구글 캘린더에 먼저 연동해주세요");
        return undefined;
      }

      setGlobalLoading(true);
      try {
        // 이벤트의 카테고리 찾기
        const category = categories.find((c) => c.id === event.categoryId);

        // 카테고리가 있으면 해당 카테고리의 구글 캘린더 ID 가져오기 또는 생성
        let calendarId = "primary";
        if (category && !category.isDefault) {
          // 카테고리가 이미 구글 캘린더와 연동된 경우 해당 ID 사용
          if (category.googleCalendarId) {
            calendarId = category.googleCalendarId;
          } else {
            // 연동되지 않은 경우 새로 생성
            calendarId =
              await googleCalendarService.getOrCreateCalendarForCategory(
                category.id,
                category.name,
                category.description
              );
          }
        }

        const googleEventId = await googleCalendarService.createEvent(
          event,
          calendarId
        );
        toast.success(`"${event.title}" 이벤트를 구글 캘린더로 보냈습니다`);
        return { googleEventId, googleCalendarId: calendarId };
      } catch (error) {
        console.error("Failed to export event to Google:", error);
        toast.error("이벤트 보내기 실패");
        throw error;
      } finally {
        setGlobalLoading(false);
      }
    },
    [syncState, categories, setGlobalLoading]
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
      setGlobalLoading(true);
      try {
        let successCount = 0;
        let failCount = 0;

        for (const event of eventsToExport) {
          try {
            // 이벤트의 카테고리 찾기
            const category = categories.find((c) => c.id === event.categoryId);

            // 카테고리가 있으면 해당 카테고리의 구글 캘린더 ID 가져오기 또는 생성
            let calendarId = "primary";
            if (category && !category.isDefault) {
              // 카테고리가 이미 구글 캘린더와 연동된 경우 해당 ID 사용
              if (category.googleCalendarId) {
                calendarId = category.googleCalendarId;
              } else {
                // 연동되지 않은 경우 새로 생성
                calendarId =
                  await googleCalendarService.getOrCreateCalendarForCategory(
                    category.id,
                    category.name,
                    category.description
                  );
              }
            }

            await googleCalendarService.createEvent(event, calendarId);
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
        setGlobalLoading(false);
      }
    },
    [syncState, setSyncState, categories, setGlobalLoading]
  );

  /**
   * 구글 캘린더 이벤트 업데이트
   * @returns 업데이트 성공 여부
   */
  const updateGoogleEvent = useCallback(
    async (event: Event): Promise<boolean> => {
      if (!syncState.isConnected) {
        toast.error("구글 캘린더에 먼저 연동해주세요");
        return false;
      }

      if (!event.googleEventId || !event.googleCalendarId) {
        console.warn("구글 이벤트 정보가 없습니다. 업데이트를 건너뜁니다.");
        return false;
      }

      setGlobalLoading(true);
      try {
        await googleCalendarService.updateEvent(
          event.googleEventId,
          event,
          event.googleCalendarId
        );
        console.log("✅ 구글 캘린더 이벤트가 업데이트되었습니다:", event.title);
        return true;
      } catch (error) {
        console.error("❌ 구글 캘린더 업데이트 실패:", error);
        toast.error("구글 캘린더 업데이트 실패");
        return false;
      } finally {
        setGlobalLoading(false);
      }
    },
    [syncState, setGlobalLoading]
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
    setGlobalLoading(true);
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
      setGlobalLoading(false);
    }
  }, [syncState, importFromGoogle, setGlobalLoading]);

  return {
    importFromGoogle,
    exportToGoogle,
    exportMultipleToGoogle,
    updateGoogleEvent,
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
    const [year, month, day] = gEvent.start.date!.split("-").map(Number);
    date = new Date(Date.UTC(year, month - 1, day));

    if (gEvent.end.date) {
      const [eYear, eMonth, eDay] = gEvent.end.date.split("-").map(Number);
      endDate = new Date(Date.UTC(eYear, eMonth - 1, eDay));
      // 구글 캘린더의 종일 이벤트는 종료일이 다음날로 설정되므로 하루 빼기
      endDate.setUTCDate(endDate.getUTCDate() - 1);
    }

    // 종일 이벤트는 시간 정보를 명시적으로 undefined로 설정
    startTime = undefined;
    endTime = undefined;
  } else {
    // 시간 지정 이벤트: 로컬 타임존 기준으로 날짜 추출
    const startDateTime = new Date(gEvent.start.dateTime!);
    const endDateTime = new Date(gEvent.end.dateTime!);

    // 날짜는 UTC로 저장 (로컬 날짜 기준)
    date = new Date(
      Date.UTC(
        startDateTime.getFullYear(),
        startDateTime.getMonth(),
        startDateTime.getDate()
      )
    );
    startTime = formatTime(startDateTime);
    endTime = formatTime(endDateTime);

    // 종료일이 시작일과 다른 경우 endDate 설정 (로컬 타임존 기준으로 비교)
    if (
      startDateTime.getDate() !== endDateTime.getDate() ||
      startDateTime.getMonth() !== endDateTime.getMonth() ||
      startDateTime.getFullYear() !== endDateTime.getFullYear()
    ) {
      endDate = new Date(
        Date.UTC(
          endDateTime.getFullYear(),
          endDateTime.getMonth(),
          endDateTime.getDate()
        )
      );
    }
  }

  // 색상 매핑: 구글 캘린더 색상 -> 앱 색상 팔레트
  // 앱 색상: #FFB6C1(핑크), #FFC0CB(연핑크), #FFE4B5(베이지), #E6E6FA(라벤더),
  //         #B0E0E6(하늘), #98FB98(민트), #F0E68C(노랑), #DDA0DD(자주)
  const colorMap: Record<string, string> = {
    "1": "#B0E0E6", // 구글 연한 파란색 → 하늘색
    "2": "#98FB98", // 구글 민트색 → 민트
    "3": "#DDA0DD", // 구글 연한 보라색 → 자주
    "4": "#FFB6C1", // 구글 연한 빨간색 → 핑크
    "5": "#F0E68C", // 구글 노란색 → 노랑
    "6": "#FFE4B5", // 구글 오렌지색 → 베이지
    "7": "#B0E0E6", // 구글 청록색 → 하늘색
    "8": "#E6E6FA", // 구글 회색 → 라벤더
    "9": "#B0E0E6", // 구글 파란색 → 하늘색
    "10": "#98FB98", // 구글 초록색 → 민트
    "11": "#FFB6C1", // 구글 빨간색 → 핑크
  };

  const color = gEvent.colorId
    ? colorMap[gEvent.colorId] || "#FFC0CB"
    : "#FFC0CB"; // 기본값: 연핑크

  // 반복 이벤트 규칙 처리 (RRULE, EXDATE 등)
  let recurrence;
  if (gEvent.recurrence && gEvent.recurrence.length > 0) {
    recurrence = parseGoogleRecurrence(gEvent.recurrence, gEvent.summary);
  }

  // 핵심 변화: 구글 이벤트에 저장된 로컬 ID가 있으면 그것을 로컬 이벤트 id로 사용
  const injectedLocalId =
    (gEvent as any).__shinya_local_id ??
    gEvent.extendedProperties?.private?.shinya_local_id ??
    gEvent.extendedProperties?.shared?.shinya_local_id ??
    null;

  const localId = injectedLocalId ? String(injectedLocalId) : `google_${gEvent.id || uuidv4()}`;

  return {
    id: localId,
    title: gEvent.summary,
    date,
    endDate,
    startTime,
    endTime,
    color,
    description: gEvent.description,
    isAllDay,
    recurrence,
    // googleEventId는 구글의 고유 ID -> 동기 시 구글 항목 확인용으로 사용
    googleEventId: gEvent.originalEventId || gEvent.id,
    googleCalendarId: (gEvent as any).calendarId || gEvent.organizer?.email || undefined,
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
 * @param recurrenceArray 구글 캘린더의 recurrence 배열 (RRULE, EXDATE 등 포함)
 */
function parseGoogleRecurrence(
  recurrenceArray: string[],
  eventTitle?: string
): any {
  try {
    // RRULE 찾기
    const rruleString = recurrenceArray.find((r) => r.startsWith("RRULE:"));
    if (!rruleString) {
      console.warn("RRULE이 없는 반복 규칙:", recurrenceArray);
      return undefined;
    }

    // rrule 라이브러리로 파싱
    const rule = rrulestr(rruleString);
    const options = rule.options;

    // 빈도(frequency) 매핑
    const freqMap: Record<number, "daily" | "weekly" | "monthly" | "yearly"> = {
      [RRule.DAILY]: "daily",
      [RRule.WEEKLY]: "weekly",
      [RRule.MONTHLY]: "monthly",
      [RRule.YEARLY]: "yearly",
    };

    const frequency = freqMap[options.freq];
    if (!frequency) {
      console.warn("알 수 없는 반복 빈도:", options.freq);
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

      recurrence.byweekday = weekdayArray
        .map((day) => {
          // Weekday 객체인 경우 weekday 속성 추출
          if (typeof day === "object" && day !== null && "weekday" in day) {
            return (day as any).weekday;
          }
          return day;
        })
        .sort((a, b) => a - b);
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

    // EXDATE: 제외할 날짜 파싱
    const exdateStrings = recurrenceArray.filter((r) => r.startsWith("EXDATE"));
    if (exdateStrings.length > 0) {
      const excludeDates: string[] = [];

      for (const exdateString of exdateStrings) {
        // EXDATE;TZID=America/New_York:20250115T090000,20250120T090000
        // 또는 EXDATE:20250115T090000Z,20250120T090000Z
        const parts = exdateString.split(":");
        if (parts.length < 2) continue;

        const dates = parts[parts.length - 1].split(",");

        for (const dateStr of dates) {
          try {
            // 날짜 문자열 파싱
            // 형식: 20250115T090000Z 또는 20250115T090000
            const cleanDateStr = dateStr.trim();

            // ISO 형식으로 변환
            // 20250115T090000Z → 2025-01-15T09:00:00.000Z
            const year = cleanDateStr.substring(0, 4);
            const month = cleanDateStr.substring(4, 6);
            const day = cleanDateStr.substring(6, 8);

            // 날짜만 저장 (시간 무시)
            const isoDate = `${year}-${month}-${day}`;
            excludeDates.push(isoDate);
          } catch (error) {
            console.warn("EXDATE 파싱 실패:", dateStr, error);
          }
        }
      }

      if (excludeDates.length > 0) {
        recurrence.excludeDates = excludeDates;
        console.log(
          `📅 Parsed ${excludeDates.length} excluded dates for "${eventTitle}"`
        );
      }
    }

    // 원본 RRULE 문자열 저장 (정확한 재생성을 위해)
    recurrence._rrule = rruleString;

    return recurrence;
  } catch (error) {
    console.error("반복 규칙 파싱 실패:", recurrenceArray, error);
    return undefined;
  }
}

/**
 * Google 이벤트에서 앱이 붙인 로컬 ID(shinya_local_id)를 안전하게 추출
 */
type GCalEventWithExtended = GoogleCalendarEvent & {
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
};

function extractShinyaLocalId(gEvent: GoogleCalendarEvent): string | null {
  const ev = gEvent as GCalEventWithExtended;
  // 우선순위: extendedProperties.private -> extendedProperties.shared -> 내부 주입 필드(__shinya_local_id)
  return (
    ev.extendedProperties?.private?.shinya_local_id ??
    ev.extendedProperties?.shared?.shinya_local_id ??
    ((gEvent as any).__shinya_local_id ?? null)
  );
}

// 가정: fetchedEvents는 googleCalendarService.fetchEvents()에서 온 배열
// 반환값: Map<googleEventId, shinya_local_id>
function handleFetchedGoogleEvents(
  fetchedEvents: GoogleCalendarEvent[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const gEvent of fetchedEvents) {
    const gid = gEvent.id ?? gEvent.originalEventId ?? "";
    if (!gid) continue;
    const shinyaId = extractShinyaLocalId(gEvent);
    if (shinyaId) {
      map.set(gid, String(shinyaId));
    }
  }
  return map;
}