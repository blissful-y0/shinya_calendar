import React from "react";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import { parse, format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./CustomTimePicker.module.scss";

interface CustomTimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  placeholderText?: string;
  minTime?: Date;
  maxTime?: Date;
  className?: string;
  disabled?: boolean;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  placeholderText = "시간을 선택하세요",
  minTime,
  maxTime,
  className = "",
  disabled = false,
}) => {
  // Convert HH:mm string to Date object for DatePicker
  const getDateFromTime = (timeStr: string): Date | null => {
    if (!timeStr) return null;
    const today = new Date();
    const [hours, minutes] = timeStr.split(":").map(Number);
    today.setHours(hours, minutes, 0, 0);
    return today;
  };

  // Convert Date object back to HH:mm string
  const handleTimeChange = (date: Date | null) => {
    if (date) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      onChange(`${hours}:${minutes}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className={`${styles.timePickerWrapper} ${className}`}>
      <DatePicker
        selected={getDateFromTime(value)}
        onChange={handleTimeChange}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={5}
        timeCaption="시간"
        dateFormat="aa h:mm"
        locale={ko}
        placeholderText={placeholderText}
        minTime={minTime}
        maxTime={maxTime}
        disabled={disabled}
        className={styles.timePickerInput}
        calendarClassName={styles.timePickerCalendar}
        showPopperArrow={false}
        popperClassName={styles.timePickerPopper}
      />
    </div>
  );
};

export default CustomTimePicker;
