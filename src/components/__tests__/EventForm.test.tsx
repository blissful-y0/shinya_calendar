import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecoilRoot } from 'recoil';
import EventForm from '../Sidebar/EventForm';

const mockOnClose = vi.fn();

const renderWithRecoil = (component: React.ReactElement) => {
  return render(<RecoilRoot>{component}</RecoilRoot>);
};

describe('EventForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('새 이벤트 폼 렌더링', () => {
    const date = new Date('2024-01-15');
    renderWithRecoil(<EventForm date={date} onClose={mockOnClose} />);

    expect(screen.getByLabelText('이벤트 제목')).toBeInTheDocument();
    expect(screen.getByText('날짜')).toBeInTheDocument();
    expect(screen.getByText('저장')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('제목 입력 필수 검증', async () => {
    const date = new Date('2024-01-15');
    renderWithRecoil(<EventForm date={date} onClose={mockOnClose} />);

    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    // 제목이 비어있으면 폼이 제출되지 않음
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('이벤트 수정 모드', () => {
    const date = new Date('2024-01-15');
    const event = {
      id: 'test-1',
      title: '기존 이벤트',
      date: date,
      startTime: '10:00',
      endTime: '11:00',
      color: '#FFB6C1',
      description: '테스트 설명',
      tags: [],
    };

    renderWithRecoil(<EventForm date={date} event={event} onClose={mockOnClose} />);

    expect(screen.getByDisplayValue('기존 이벤트')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('11:00')).toBeInTheDocument();
    expect(screen.getByText('수정')).toBeInTheDocument();
  });

  it('하루 종일 체크박스 토글', async () => {
    const date = new Date('2024-01-15');
    renderWithRecoil(<EventForm date={date} onClose={mockOnClose} />);

    const allDayCheckbox = screen.getByLabelText('하루 종일');

    // 체크 전: 시간 입력 필드 표시
    expect(screen.getByLabelText('시작 시간')).toBeInTheDocument();
    expect(screen.getByLabelText('종료 시간')).toBeInTheDocument();

    // 체크 후: 시간 입력 필드 숨김
    fireEvent.click(allDayCheckbox);
    expect(screen.queryByLabelText('시작 시간')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('종료 시간')).not.toBeInTheDocument();
  });

  it('반복 이벤트 설정', () => {
    const date = new Date('2024-01-15');
    renderWithRecoil(<EventForm date={date} onClose={mockOnClose} />);

    const recurringCheckbox = screen.getByLabelText('반복 이벤트');
    fireEvent.click(recurringCheckbox);

    expect(screen.getByLabelText('반복 주기')).toBeInTheDocument();
    expect(screen.getByLabelText('반복 간격')).toBeInTheDocument();
    expect(screen.getByLabelText('반복 종료')).toBeInTheDocument();
  });

  it('종료 날짜 설정 시 반복 이벤트 비활성화', () => {
    const date = new Date('2024-01-15');
    renderWithRecoil(<EventForm date={date} onClose={mockOnClose} />);

    const multiDayCheckbox = screen.getByLabelText('종료 날짜 설정');
    fireEvent.click(multiDayCheckbox);

    const recurringCheckbox = screen.getByLabelText('반복 이벤트');
    expect(recurringCheckbox).toBeDisabled();
  });

  it('알림 설정', () => {
    const date = new Date('2024-01-15');
    renderWithRecoil(<EventForm date={date} onClose={mockOnClose} />);

    // 먼저 시간 설정
    const startTimeInput = screen.getByLabelText('시작 시간');
    fireEvent.change(startTimeInput, { target: { value: '10:00' } });

    const reminderCheckbox = screen.getByLabelText('알림 설정');
    fireEvent.click(reminderCheckbox);

    expect(screen.getByLabelText('알림 시간')).toBeInTheDocument();
  });

  it('색상 선택', () => {
    const date = new Date('2024-01-15');
    renderWithRecoil(<EventForm date={date} onClose={mockOnClose} />);

    const colorButtons = screen.getAllByRole('button').filter(btn =>
      btn.style.backgroundColor
    );

    expect(colorButtons.length).toBeGreaterThan(0);

    // 첫 번째 색상 선택
    fireEvent.click(colorButtons[0]);
    expect(colorButtons[0].className).toContain('selected');
  });

  it('취소 버튼 클릭', () => {
    const date = new Date('2024-01-15');
    renderWithRecoil(<EventForm date={date} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('성공적인 이벤트 저장', async () => {
    const user = userEvent.setup();
    const date = new Date('2024-01-15');
    renderWithRecoil(<EventForm date={date} onClose={mockOnClose} />);

    const titleInput = screen.getByLabelText('이벤트 제목');
    await user.type(titleInput, '새로운 이벤트');

    const startTimeInput = screen.getByLabelText('시작 시간');
    fireEvent.change(startTimeInput, { target: { value: '10:00' } });

    const endTimeInput = screen.getByLabelText('종료 시간');
    fireEvent.change(endTimeInput, { target: { value: '11:00' } });

    const descriptionInput = screen.getByLabelText('설명');
    await user.type(descriptionInput, '테스트 설명');

    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});