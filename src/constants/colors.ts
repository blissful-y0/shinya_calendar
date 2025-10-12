/**
 * 애플리케이션 전체에서 사용하는 색상 팔레트
 * EventForm, CategoryManager, GoogleCalendarSync 등에서 공통으로 사용
 */
export const COLOR_PALETTE = [
  "#FFB6C1", // 핑크
  "#FFC0CB", // 연핑크
  "#FFE4B5", // 베이지
  "#E6E6FA", // 라벤더
  "#B0E0E6", // 하늘
  "#98FB98", // 민트
  "#F0E68C", // 노랑
  "#DDA0DD", // 자주
  "#FF6B6B", // 빨강
  "#4ECDC4", // 청록
  "#45B7D1", // 파랑
  "#FFA07A", // 연주황
];

/**
 * 인덱스로 색상 가져오기 (순환)
 * @param index 색상 인덱스 (음수도 처리 가능)
 * @returns 색상 값
 */
export function getColorByIndex(index: number): string {
  // 음수 인덱스 처리: JavaScript의 % 연산자는 음수를 음수로 반환하므로 추가 처리 필요
  const normalizedIndex = ((index % COLOR_PALETTE.length) + COLOR_PALETTE.length) % COLOR_PALETTE.length;
  return COLOR_PALETTE[normalizedIndex];
}
