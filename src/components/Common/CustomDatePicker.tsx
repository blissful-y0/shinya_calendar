import React from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './CustomDatePicker.module.scss';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  timeIntervals?: number;
  dateFormat?: string;
  className?: string;
  disabled?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText = '날짜를 선택하세요',
  minDate,
  maxDate,
  showTimeSelect = false,
  timeIntervals = 30,
  dateFormat = showTimeSelect ? 'yyyy년 MM월 dd일 h:mm aa' : 'yyyy년 MM월 dd일',
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`${styles.datePickerWrapper} ${className}`}>
      <DatePicker
        selected={selected}
        onChange={onChange}
        locale={ko}
        dateFormat={dateFormat}
        placeholderText={placeholderText}
        minDate={minDate}
        maxDate={maxDate}
        showTimeSelect={showTimeSelect}
        timeIntervals={timeIntervals}
        disabled={disabled}
        className={styles.datePickerInput}
        calendarClassName={styles.datePickerCalendar}
        dayClassName={(date) =>
          date.getDay() === 0 ? styles.sunday :
          date.getDay() === 6 ? styles.saturday : ''
        }
        showPopperArrow={false}
        popperClassName={styles.datePickerPopper}
      />
    </div>
  );
};

export default CustomDatePicker;