import React, { useState, useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { googleCalendarSyncState } from "@store/atoms";
import { FcGoogle } from "react-icons/fc";
import {
  FiPlus,
  FiUserPlus,
  FiTrash2,
  FiCalendar,
  FiChevronDown,
} from "react-icons/fi";
import { googleCalendarService } from "@services/googleCalendarService";
import toast from "react-hot-toast";
import styles from "./SharedCalendarManager.module.scss";

type SharedCalendarManagerProps = {
  onClose: () => void;
};

type Calendar = {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
};

type Share = {
  id: string;
  role: string;
  scope: {
    type: string;
    value?: string;
  };
};

export const SharedCalendarManager: React.FC<SharedCalendarManagerProps> = ({
  onClose,
}) => {
  const syncState = useRecoilValue(googleCalendarSyncState);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<Calendar | null>(
    null
  );
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);

  // 새 캘린더 생성 폼 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarDescription, setNewCalendarDescription] = useState("");

  // 사용자 초대 폼 상태
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "writer" | "reader">(
    "writer"
  );
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setShowRoleDropdown(false);
      }
    };

    if (showRoleDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRoleDropdown]);

  // 캘린더 목록 로드 (구글 연동 시에만)
  useEffect(() => {
    if (syncState.isConnected) {
      loadCalendars();
    }
  }, [syncState.isConnected]);

  // 선택된 캘린더의 공유 목록 로드
  useEffect(() => {
    if (selectedCalendar) {
      loadShares(selectedCalendar.id);
    }
  }, [selectedCalendar]);

  const loadCalendars = async () => {
    try {
      setLoading(true);
      const calendarList = await googleCalendarService.listCalendars();
      setCalendars(calendarList);
    } catch (error) {
      console.error("Failed to load calendars:", error);
      toast.error("캘린더 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const loadShares = async (calendarId: string) => {
    try {
      setLoading(true);
      const shareList = await googleCalendarService.listCalendarShares(
        calendarId
      );
      setShares(shareList);
    } catch (error) {
      console.error("Failed to load shares:", error);
      toast.error("공유 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalendar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCalendarName.trim()) {
      toast.error("캘린더 이름을 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      const calendarId = await googleCalendarService.createCalendar(
        newCalendarName,
        newCalendarDescription
      );
      toast.success(`캘린더 "${newCalendarName}"가 생성되었습니다`);

      // 캐시 무효화
      googleCalendarService.invalidateCalendarListCache();

      // 폼 초기화 및 닫기
      setNewCalendarName("");
      setNewCalendarDescription("");
      setShowCreateForm(false);

      // 부분 업데이트: 새 캘린더만 목록에 추가
      const newCalendar: Calendar = {
        id: calendarId,
        summary: newCalendarName,
        description: newCalendarDescription || undefined,
        accessRole: "owner",
      };

      setCalendars((prev) => [...prev, newCalendar]);
      setSelectedCalendar(newCalendar);
    } catch (error) {
      console.error("Failed to create calendar:", error);
      toast.error("캘린더 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCalendar) {
      toast.error("캘린더를 먼저 선택해주세요");
      return;
    }

    if (!inviteEmail.trim()) {
      toast.error("이메일을 입력해주세요");
      return;
    }

    // 간단한 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("유효한 이메일 주소를 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      const aclRuleId = await googleCalendarService.shareCalendar(
        selectedCalendar.id,
        inviteEmail,
        inviteRole
      );
      toast.success(`${inviteEmail}님을 초대했습니다`);

      // 폼 초기화 및 닫기
      const email = inviteEmail;
      const role = inviteRole;
      setInviteEmail("");
      setInviteRole("writer");
      setShowInviteForm(false);

      // 부분 업데이트: 새 공유만 목록에 추가
      const newShare: Share = {
        id: aclRuleId,
        role: role,
        scope: {
          type: "user",
          value: email,
        },
      };

      setShares((prev) => [...prev, newShare]);
    } catch (error) {
      console.error("Failed to invite user:", error);
      toast.error("사용자 초대에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string, email?: string) => {
    if (!selectedCalendar) return;

    const confirmMessage = email
      ? `${email}님의 접근 권한을 제거하시겠습니까?`
      : "이 공유를 제거하시겠습니까?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      await googleCalendarService.removeCalendarShare(
        selectedCalendar.id,
        shareId
      );
      toast.success("공유가 제거되었습니다");

      // 부분 업데이트: 해당 공유만 목록에서 제거
      setShares((prev) => prev.filter((share) => share.id !== shareId));
    } catch (error) {
      console.error("Failed to remove share:", error);
      toast.error("공유 제거에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "owner":
        return "소유자";
      case "writer":
        return "편집 가능";
      case "reader":
        return "읽기 전용";
      default:
        return role;
    }
  };

  // 구글 연동 안내 화면
  if (!syncState.isConnected) {
    return (
      <div className={styles.modal}>
        <div className={styles.overlay} onClick={onClose} />
        <div className={styles.content}>
          <div className={styles.header}>
            <h2>
              <FcGoogle size={32} />
              공유 캘린더 관리
            </h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.section}>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <FcGoogle size={64} style={{ marginBottom: "20px" }} />
                <h3 style={{ marginBottom: "12px", fontSize: "18px" }}>
                  구글 캘린더 연동이 필요합니다
                </h3>
                <p
                  style={{
                    color: "var(--color-text-secondary)",
                    marginBottom: "24px",
                  }}
                >
                  공유 캘린더 관리 기능을 사용하려면
                  <br />
                  먼저 구글 캘린더와 연동해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>
            <FcGoogle size={32} />
            공유 캘린더 관리
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          {/* 캘린더 생성 섹션 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>
                <FiCalendar /> 내 캘린더
              </h3>
              <button
                className={styles.addButton}
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={loading}
              >
                <FiPlus /> 새 캘린더
              </button>
            </div>

            {showCreateForm && (
              <form className={styles.form} onSubmit={handleCreateCalendar}>
                <input
                  type="text"
                  placeholder="캘린더 이름"
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                />
                <textarea
                  placeholder="설명 (선택사항)"
                  value={newCalendarDescription}
                  onChange={(e) => setNewCalendarDescription(e.target.value)}
                  className={styles.textarea}
                  disabled={loading}
                  rows={2}
                />
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    생성
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowCreateForm(false)}
                    disabled={loading}
                  >
                    취소
                  </button>
                </div>
              </form>
            )}

            {/* 캘린더 목록 */}
            <div className={styles.calendarList}>
              {loading && calendars.length === 0 ? (
                <p className={styles.loading}>로딩 중...</p>
              ) : calendars.length === 0 ? (
                <p className={styles.empty}>캘린더가 없습니다</p>
              ) : (
                calendars.map((calendar) => (
                  <div
                    key={calendar.id}
                    className={`${styles.calendarItem} ${
                      selectedCalendar?.id === calendar.id
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => setSelectedCalendar(calendar)}
                  >
                    <div className={styles.calendarInfo}>
                      <strong>{calendar.summary}</strong>
                      {calendar.description && (
                        <p className={styles.description}>
                          {calendar.description}
                        </p>
                      )}
                      {calendar.primary && (
                        <span className={styles.primaryBadge}>기본</span>
                      )}
                    </div>
                    <div className={styles.accessRole}>
                      {getRoleDisplayName(calendar.accessRole || "")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 사용자 초대 섹션 */}
          {selectedCalendar && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>
                  <FiUserPlus /> 공유 설정 - {selectedCalendar.summary}
                </h3>
                <button
                  className={styles.addButton}
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  disabled={loading}
                >
                  <FiPlus /> 사용자 초대
                </button>
              </div>

              {showInviteForm && (
                <form className={styles.form} onSubmit={handleInviteUser}>
                  <input
                    type="email"
                    placeholder="이메일 주소"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                  />

                  {/* 커스텀 드롭다운 */}
                  <div className={styles.customSelect} ref={roleDropdownRef}>
                    <button
                      type="button"
                      className={styles.selectButton}
                      onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      disabled={loading}
                    >
                      <span>{getRoleDisplayName(inviteRole)}</span>
                      <FiChevronDown
                        className={showRoleDropdown ? styles.rotated : ""}
                      />
                    </button>
                    {showRoleDropdown && (
                      <div className={styles.selectDropdown}>
                        <button
                          type="button"
                          className={`${styles.selectOption} ${
                            inviteRole === "reader" ? styles.selected : ""
                          }`}
                          onClick={() => {
                            setInviteRole("reader");
                            setShowRoleDropdown(false);
                          }}
                        >
                          읽기 전용
                        </button>
                        <button
                          type="button"
                          className={`${styles.selectOption} ${
                            inviteRole === "writer" ? styles.selected : ""
                          }`}
                          onClick={() => {
                            setInviteRole("writer");
                            setShowRoleDropdown(false);
                          }}
                        >
                          편집 가능
                        </button>
                        <button
                          type="button"
                          className={`${styles.selectOption} ${
                            inviteRole === "owner" ? styles.selected : ""
                          }`}
                          onClick={() => {
                            setInviteRole("owner");
                            setShowRoleDropdown(false);
                          }}
                        >
                          소유자
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={loading}
                    >
                      초대
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setShowInviteForm(false)}
                      disabled={loading}
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}

              {/* 공유 사용자 목록 */}
              <div className={styles.shareList}>
                {loading && shares.length === 0 ? (
                  <p className={styles.loading}>로딩 중...</p>
                ) : shares.length === 0 ? (
                  <p className={styles.empty}>공유된 사용자가 없습니다</p>
                ) : (
                  shares.map((share) => (
                    <div key={share.id} className={styles.shareItem}>
                      <div className={styles.shareInfo}>
                        <strong title={share.scope.value || share.scope.type}>
                          {share.scope.value || share.scope.type}
                        </strong>
                        <span className={styles.role}>
                          {getRoleDisplayName(share.role)}
                        </span>
                      </div>
                      {share.scope.type === "user" && (
                        <button
                          className={styles.removeButton}
                          onClick={() =>
                            handleRemoveShare(share.id, share.scope.value)
                          }
                          disabled={loading}
                          title="공유 제거"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
