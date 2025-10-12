import React, { useState, useEffect, useRef } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { categoriesState, googleCalendarSyncState, globalLoadingState } from "@store/atoms";
import { Category } from "@types";
import { v4 as uuidv4 } from "uuid";
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiCheck, FiX, FiUserPlus, FiChevronDown, FiShare2 } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { HexColorPicker } from "react-colorful";
import { googleCalendarService } from "@services/googleCalendarService";
import toast from "react-hot-toast";
import { COLOR_PALETTE, getColorByIndex } from "@constants/colors";
import styles from "./CategoryManager.module.scss";

type CategoryManagerProps = {
  onClose: () => void;
};

type Share = {
  id: string;
  role: string;
  scope: {
    type: string;
    value?: string;
  };
};

type GoogleCalendar = {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const [categories, setCategories] = useRecoilState(categoriesState);
  const googleSyncState = useRecoilValue(googleCalendarSyncState);
  const setGlobalLoading = useSetRecoilState(globalLoadingState);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // 폼 상태
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#FFB6C1");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [syncWithGoogle, setSyncWithGoogle] = useState(false);

  // 구글 캘린더 목록
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);

  // 공유 관련 상태
  const [sharingCategoryId, setSharingCategoryId] = useState<string | null>(null);
  const [shares, setShares] = useState<Record<string, Share[]>>({});
  const [showInviteForm, setShowInviteForm] = useState<Record<string, boolean>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "writer" | "reader">("writer");
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

  // 구글 캘린더 목록 로드
  useEffect(() => {
    if (googleSyncState.isConnected) {
      loadGoogleCalendars();
    } else {
      setGoogleCalendars([]);
    }
  }, [googleSyncState.isConnected]);

  const loadGoogleCalendars = async () => {
    try {
      const calendarList = await googleCalendarService.listCalendars();
      setGoogleCalendars(calendarList);

      // 구글 캘린더를 로컬 카테고리에 자동으로 동기화
      const newCategories: typeof categories = [];

      // 색상 인덱스 초기화 (현재 카테고리 개수부터 시작)
      let colorIndex = categories.length;

      for (const googleCalendar of calendarList) {
        // 이미 로컬 카테고리에 연결되어 있는지 확인
        const alreadyLinked = categories.some(
          (cat) => cat.googleCalendarId === googleCalendar.id
        );

        if (!alreadyLinked) {
          const newCategory = {
            id: uuidv4(),
            name: googleCalendar.summary,
            description: googleCalendar.description,
            color: getColorByIndex(colorIndex), // 순서대로 색상 할당
            googleCalendarId: googleCalendar.id,
            accessRole: googleCalendar.accessRole,
            createdInApp: false, // 자동 동기화된 캘린더는 공유받은 것
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          newCategories.push(newCategory);
          colorIndex++; // 다음 색상으로
        }
      }

      if (newCategories.length > 0) {
        setCategories([...categories, ...newCategories]);
        toast.success(`${newCategories.length}개의 구글 캘린더가 동기화되었습니다`);
      }
    } catch (error) {
      console.error("Failed to load Google calendars:", error);
      toast.error("구글 캘린더 목록을 불러오는데 실패했습니다");
    }
  };

  const handleCreateCategory = async () => {
    if (!formName.trim()) {
      toast.error("카테고리 이름을 입력해주세요");
      return;
    }

    let googleCalendarId: string | undefined = undefined;

    // 구글 캘린더와 연동하는 경우
    if (syncWithGoogle && googleSyncState.isConnected) {
      try {
        setGlobalLoading(true);
        googleCalendarId = await googleCalendarService.createCalendar(
          formName.trim(),
          formDescription.trim() || undefined
        );
        console.log("✅ 구글 캘린더 생성 완료:", googleCalendarId);

        // 캐시 무효화
        googleCalendarService.invalidateCalendarListCache();
      } catch (error: any) {
        console.error("❌ 구글 캘린더 생성 실패:", error);

        // 에러 메시지 개선
        let errorMessage = "구글 캘린더 생성에 실패했습니다";
        if (error?.message?.includes("403")) {
          errorMessage = "권한이 없습니다. 구글 캘린더 생성 권한을 확인해주세요";
        } else if (error?.message?.includes("409")) {
          errorMessage = "이미 같은 이름의 캘린더가 존재합니다";
        } else if (error?.message) {
          errorMessage = `구글 캘린더 생성 실패: ${error.message}`;
        }

        toast.error(errorMessage);
        setGlobalLoading(false);
        return;
      } finally {
        setGlobalLoading(false);
      }
    }

    const newCategory: Category = {
      id: uuidv4(),
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      color: formColor,
      googleCalendarId,
      accessRole: googleCalendarId ? "owner" : undefined, // 구글 캘린더 생성 시 owner
      createdInApp: googleCalendarId ? true : undefined, // 앱에서 생성한 구글 캘린더는 true
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCategories([...categories, newCategory]);

    if (googleCalendarId) {
      toast.success(`"${formName}" 카테고리가 구글 캘린더와 연동되어 생성되었습니다`);
      // 구글 캘린더 목록 새로고침
      loadGoogleCalendars();
    } else {
      toast.success(`"${formName}" 카테고리가 생성되었습니다`);
    }

    // 폼 초기화
    resetForm();
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    if (!formName.trim()) {
      toast.error("카테고리 이름을 입력해주세요");
      return;
    }

    const updatedCategories = categories.map((cat) =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: formName.trim(),
            description: formDescription.trim() || undefined,
            color: formColor,
            updatedAt: new Date(),
          }
        : cat
    );

    setCategories(updatedCategories);
    toast.success("카테고리가 수정되었습니다");

    // 폼 초기화
    resetForm();
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.isDefault) {
      toast.error("기본 카테고리는 삭제할 수 없습니다");
      return;
    }

    // 구글 연동 캘린더인 경우 추가 확인
    let confirmMessage = `"${category.name}" 카테고리를 삭제하시겠습니까?`;
    if (category.googleCalendarId) {
      confirmMessage += "\n\n⚠️ 구글 캘린더에서도 함께 삭제됩니다.";
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // 구글 캘린더 삭제 (연동된 경우)
      if (category.googleCalendarId && googleSyncState.isConnected) {
        setGlobalLoading(true);
        try {
          await googleCalendarService.deleteCalendar(category.googleCalendarId);
          console.log("✅ 구글 캘린더 삭제 완료:", category.googleCalendarId);

          // 캐시 무효화
          googleCalendarService.invalidateCalendarListCache();
        } catch (error: any) {
          console.error("❌ 구글 캘린더 삭제 실패:", error);

          // 에러 메시지 개선
          let errorMessage = "구글 캘린더 삭제에 실패했습니다";
          if (error?.message?.includes("403")) {
            errorMessage = "권한이 없습니다. 캘린더 소유자만 삭제할 수 있습니다";
          } else if (error?.message?.includes("404")) {
            errorMessage = "캘린더를 찾을 수 없습니다 (이미 삭제되었을 수 있습니다)";
          } else if (error?.message) {
            errorMessage = `구글 캘린더 삭제 실패: ${error.message}`;
          }

          toast.error(errorMessage);
          setGlobalLoading(false);
          return;
        } finally {
          setGlobalLoading(false);
        }
      }

      // 로컬 카테고리 삭제
      setCategories(categories.filter((cat) => cat.id !== category.id));

      // 공유 상태 정리
      setShares((prev) => {
        const newShares = { ...prev };
        delete newShares[category.id];
        return newShares;
      });

      // 공유 섹션이 열려있으면 닫기
      if (sharingCategoryId === category.id) {
        setSharingCategoryId(null);
      }

      // 구글 캘린더 목록 새로고침
      if (category.googleCalendarId && googleSyncState.isConnected) {
        loadGoogleCalendars();
      }

      toast.success("카테고리가 삭제되었습니다");
    } catch (error: any) {
      console.error("카테고리 삭제 중 오류:", error);
      const errorMessage = error?.message
        ? `카테고리 삭제 중 오류: ${error.message}`
        : "카테고리 삭제 중 오류가 발생했습니다";
      toast.error(errorMessage);
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setFormColor(category.color);
    setShowCreateForm(false);
    setSharingCategoryId(null); // 공유 섹션 닫기
  };

  const toggleShareSection = async (category: Category) => {
    if (sharingCategoryId === category.id) {
      // 닫기
      setSharingCategoryId(null);
      // 초대 폼 초기화
      setInviteEmail("");
      setInviteRole("writer");
      setShowInviteForm((prev) => ({ ...prev, [category.id]: false }));
    } else {
      // 열기
      setSharingCategoryId(category.id);
      setEditingCategory(null); // 수정 폼 닫기
      setShowCreateForm(false); // 생성 폼 닫기
      // 초대 폼 초기화 (다른 카테고리에서 사용한 값 제거)
      setInviteEmail("");
      setInviteRole("writer");
      setShowInviteForm((prev) => ({ ...prev, [category.id]: false }));
      // 공유 목록 로드
      if (category.googleCalendarId) {
        const success = await loadShares(category.id, category.googleCalendarId);
        // 로드 실패 시 섹션 닫기
        if (!success) {
          setSharingCategoryId(null);
        }
      }
    }
  };

  const loadShares = async (categoryId: string, googleCalendarId: string): Promise<boolean> => {
    try {
      setGlobalLoading(true);
      const shareList = await googleCalendarService.listCalendarShares(googleCalendarId);
      setShares((prev) => ({ ...prev, [categoryId]: shareList }));
      return true;
    } catch (error: any) {
      console.error("Failed to load shares:", error);

      // 에러 메시지 개선
      let errorMessage = "공유 목록을 불러오는데 실패했습니다";
      if (error?.message?.includes("403")) {
        errorMessage = "권한이 없습니다. 캘린더에 접근할 수 없습니다";
      } else if (error?.message?.includes("404")) {
        errorMessage = "캘린더를 찾을 수 없습니다";
      } else if (error?.message) {
        errorMessage = `공유 목록 로드 실패: ${error.message}`;
      }

      toast.error(errorMessage);
      // 에러 시 빈 배열로 초기화
      setShares((prev) => ({ ...prev, [categoryId]: [] }));
      return false;
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleInviteUser = async (category: Category) => {
    if (!category.googleCalendarId) {
      toast.error("구글 캘린더와 연동되지 않은 카테고리입니다");
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

    // 중복 초대 방지
    const existingShares = shares[category.id] || [];
    const isDuplicate = existingShares.some(
      (share) =>
        share.scope.type === "user" &&
        share.scope.value?.toLowerCase() === inviteEmail.toLowerCase()
    );
    if (isDuplicate) {
      toast.error("이미 초대된 사용자입니다");
      return;
    }

    try {
      setGlobalLoading(true);
      const aclRuleId = await googleCalendarService.shareCalendar(
        category.googleCalendarId,
        inviteEmail,
        inviteRole
      );
      toast.success(`${inviteEmail}님을 초대했습니다`);

      // 폼 초기화
      const email = inviteEmail;
      const role = inviteRole;
      setInviteEmail("");
      setInviteRole("writer");
      setShowInviteForm((prev) => ({ ...prev, [category.id]: false }));

      // 부분 업데이트: 새 공유만 목록에 추가
      const newShare: Share = {
        id: aclRuleId,
        role: role,
        scope: {
          type: "user",
          value: email,
        },
      };

      setShares((prev) => ({
        ...prev,
        [category.id]: [...(prev[category.id] || []), newShare],
      }));
    } catch (error: any) {
      console.error("Failed to invite user:", error);

      // 에러 메시지 개선
      let errorMessage = "사용자 초대에 실패했습니다";
      if (error?.message?.includes("403")) {
        errorMessage = "권한이 없습니다. 캘린더 소유자만 사용자를 초대할 수 있습니다";
      } else if (error?.message?.includes("404")) {
        errorMessage = "캘린더를 찾을 수 없습니다";
      } else if (error?.message?.includes("400")) {
        errorMessage = "잘못된 요청입니다. 이메일 주소를 확인해주세요";
      } else if (error?.message) {
        errorMessage = `사용자 초대 실패: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRemoveShare = async (
    category: Category,
    shareId: string,
    email?: string
  ) => {
    if (!category.googleCalendarId) return;

    const confirmMessage = email
      ? `${email}님의 접근 권한을 제거하시겠습니까?`
      : "이 공유를 제거하시겠습니까?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setGlobalLoading(true);
      await googleCalendarService.removeCalendarShare(
        category.googleCalendarId,
        shareId
      );
      toast.success("공유가 제거되었습니다");

      // 부분 업데이트: 해당 공유만 목록에서 제거
      setShares((prev) => ({
        ...prev,
        [category.id]: (prev[category.id] || []).filter(
          (share) => share.id !== shareId
        ),
      }));
    } catch (error: any) {
      console.error("Failed to remove share:", error);

      // 에러 메시지 개선
      let errorMessage = "공유 제거에 실패했습니다";
      if (error?.message?.includes("403")) {
        errorMessage = "권한이 없습니다. 캘린더 소유자만 공유를 제거할 수 있습니다";
      } else if (error?.message?.includes("404")) {
        errorMessage = "공유 정보를 찾을 수 없습니다";
      } else if (error?.message) {
        errorMessage = `공유 제거 실패: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setGlobalLoading(false);
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

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormColor("#FFB6C1");
    setSyncWithGoogle(false);
    setShowCreateForm(false);
    setEditingCategory(null);
    setShowColorPicker(false);
  };

  const handleClose = () => {
    // 모든 상태 초기화
    resetForm();
    setSharingCategoryId(null);
    setInviteEmail("");
    setInviteRole("writer");
    setShowInviteForm({});
    setShowRoleDropdown(false);
    onClose();
  };

  return (
    <div className={styles.modal}>
      <div className={styles.overlay} onClick={handleClose} />
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>
            <FiCalendar size={28} />
            카테고리 관리
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          {/* 구글 캘린더 동기화 상태 */}
          {googleSyncState.isConnected && (
            <div className={styles.syncNotice}>
              <p>
                <FiCheck size={16} />
                구글 캘린더 연동됨 - 카테고리는 구글 캘린더와 자동 동기화됩니다
              </p>
            </div>
          )}

          {/* 카테고리 목록 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>내 카테고리</h3>
              <button
                className={styles.addButton}
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setEditingCategory(null);
                  setFormName("");
                  setFormDescription("");
                  setFormColor("#FFB6C1");
                }}
              >
                <FiPlus /> 새 카테고리
              </button>
            </div>

            {/* 생성 폼 - 버튼 바로 밑에 표시 */}
            {showCreateForm && (
              <div className={styles.inlineForm}>
                <h3>새 카테고리 만들기</h3>

                <div className={styles.formGroup}>
                  <label>이름</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="카테고리 이름"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>설명 (선택사항)</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="카테고리 설명"
                    className={styles.textarea}
                    rows={2}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>색상</label>
                  <div className={styles.colorSection}>
                    <div className={styles.colorOptions}>
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`${styles.colorOption} ${
                            formColor === color ? styles.selected : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormColor(color)}
                        />
                      ))}
                      <button
                        type="button"
                        className={styles.customColorButton}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                      >
                        +
                      </button>
                    </div>

                    {showColorPicker && (
                      <div className={styles.colorPickerWrapper}>
                        <HexColorPicker color={formColor} onChange={setFormColor} />
                        <input
                          type="text"
                          value={formColor}
                          onChange={(e) => setFormColor(e.target.value)}
                          className={styles.hexInput}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 구글 캘린더 연동 옵션 */}
                {googleSyncState.isConnected && (
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={syncWithGoogle}
                        onChange={(e) => setSyncWithGoogle(e.target.checked)}
                        className={styles.checkbox}
                      />
                      <FcGoogle size={18} style={{ marginLeft: "8px", marginRight: "4px" }} />
                      <span>구글 캘린더와 연동</span>
                    </label>
                    <p className={styles.helperText}>
                      체크하면 구글 캘린더에도 동일한 이름의 캘린더가 생성됩니다
                    </p>
                  </div>
                )}

                <div className={styles.formActions}>
                  <button className={styles.cancelButton} onClick={resetForm}>
                    <FiX /> 취소
                  </button>
                  <button className={styles.saveButton} onClick={handleCreateCategory}>
                    <FiCheck /> 생성
                  </button>
                </div>
              </div>
            )}

            <div className={styles.categoryList}>
              {categories.map((category) => (
                <React.Fragment key={category.id}>
                  <div className={styles.categoryItem}>
                    <div className={styles.categoryInfo}>
                      <div
                        className={styles.colorDot}
                        style={{ backgroundColor: category.color }}
                      />
                      <div className={styles.categoryText}>
                        <strong>
                          {category.name}
                          {category.isDefault && (
                            <span className={styles.defaultBadge}>기본</span>
                          )}
                        </strong>
                        {category.description && (
                          <p className={styles.description}>{category.description}</p>
                        )}
                        {category.googleCalendarId && (
                          <span className={styles.syncBadge}>
                            <FiCheck size={12} /> 구글 연동됨
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.categoryActions}>
                      {category.googleCalendarId && googleSyncState.isConnected && category.accessRole && category.accessRole !== "reader" && (
                        <button
                          className={styles.shareButton}
                          onClick={() => toggleShareSection(category)}
                          title="공유 관리"
                        >
                          <FiShare2 />
                        </button>
                      )}
                      <button
                        className={styles.editButton}
                        onClick={() => startEdit(category)}
                        title="수정"
                      >
                        <FiEdit2 />
                      </button>
                      {!category.isDefault && (
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteCategory(category)}
                          title="삭제"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 공유 섹션 - 해당 카테고리 바로 밑에 표시 */}
                  {sharingCategoryId === category.id && category.googleCalendarId && googleSyncState.isConnected && (
                    <div className={styles.inlineForm}>
                      <h3>
                        <FiUserPlus style={{ display: "inline", marginRight: "8px" }} />
                        공유 설정
                      </h3>

                      {/* 사용자 초대 버튼 */}
                      {!showInviteForm[category.id] && (
                        <button
                          className={styles.addButton}
                          onClick={() =>
                            setShowInviteForm((prev) => ({
                              ...prev,
                              [category.id]: true,
                            }))
                          }
                          disabled={category.accessRole !== "owner"}
                          style={{ marginBottom: "16px" }}
                          title={
                            category.accessRole !== "owner"
                              ? "캘린더 소유자만 사용자를 초대할 수 있습니다"
                              : "사용자 초대"
                          }
                        >
                          <FiPlus /> 사용자 초대
                        </button>
                      )}

                      {/* 초대 폼 */}
                      {showInviteForm[category.id] && (
                        <div style={{ marginBottom: "16px" }}>
                          <div className={styles.formGroup}>
                            <label>이메일 주소</label>
                            <input
                              type="email"
                              placeholder="초대할 사용자의 이메일"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className={styles.input}
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label>권한</label>
                            {/* 커스텀 드롭다운 */}
                            <div className={styles.roleSelect} ref={roleDropdownRef}>
                              <button
                                type="button"
                                className={styles.roleButton}
                                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                              >
                                <span>{getRoleDisplayName(inviteRole)}</span>
                                <FiChevronDown
                                  className={showRoleDropdown ? styles.rotated : ""}
                                />
                              </button>
                              {showRoleDropdown && (
                                <div className={styles.roleDropdown}>
                                  <button
                                    type="button"
                                    className={`${styles.roleOption} ${
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
                                    className={`${styles.roleOption} ${
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
                                    className={`${styles.roleOption} ${
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
                          </div>

                          <div className={styles.formActions}>
                            <button
                              className={styles.cancelButton}
                              onClick={() =>
                                setShowInviteForm((prev) => ({
                                  ...prev,
                                  [category.id]: false,
                                }))
                              }
                            >
                              <FiX /> 취소
                            </button>
                            <button
                              className={styles.saveButton}
                              onClick={() => handleInviteUser(category)}
                            >
                              <FiCheck /> 초대
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 공유 사용자 목록 */}
                      <div className={styles.shareList}>
                        {shares[category.id]?.length === 0 ? (
                          <p className={styles.emptyMessage}>공유된 사용자가 없습니다</p>
                        ) : (
                          shares[category.id]?.map((share) => (
                            <div key={share.id} className={styles.shareItem}>
                              <div className={styles.shareInfo}>
                                <strong title={share.scope.value || share.scope.type}>
                                  {share.scope.value || share.scope.type}
                                </strong>
                                <span className={styles.shareRole}>
                                  {getRoleDisplayName(share.role)}
                                </span>
                              </div>
                              {share.scope.type === "user" && (
                                <button
                                  className={styles.deleteButton}
                                  onClick={() =>
                                    handleRemoveShare(category, share.id, share.scope.value)
                                  }
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

                  {/* 수정 폼 - 해당 카테고리 바로 밑에 표시 */}
                  {editingCategory?.id === category.id && (
                    <div className={styles.inlineForm}>
                      <h3>카테고리 수정</h3>

                      <div className={styles.formGroup}>
                        <label>이름</label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="카테고리 이름"
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>설명 (선택사항)</label>
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="카테고리 설명"
                          className={styles.textarea}
                          rows={2}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>색상</label>
                        <div className={styles.colorSection}>
                          <div className={styles.colorOptions}>
                            {COLOR_PALETTE.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`${styles.colorOption} ${
                                  formColor === color ? styles.selected : ""
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => setFormColor(color)}
                              />
                            ))}
                            <button
                              type="button"
                              className={styles.customColorButton}
                              onClick={() => setShowColorPicker(!showColorPicker)}
                            >
                              +
                            </button>
                          </div>

                          {showColorPicker && (
                            <div className={styles.colorPickerWrapper}>
                              <HexColorPicker color={formColor} onChange={setFormColor} />
                              <input
                                type="text"
                                value={formColor}
                                onChange={(e) => setFormColor(e.target.value)}
                                className={styles.hexInput}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.formActions}>
                        <button className={styles.cancelButton} onClick={resetForm}>
                          <FiX /> 취소
                        </button>
                        <button className={styles.saveButton} onClick={handleUpdateCategory}>
                          <FiCheck /> 수정
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
