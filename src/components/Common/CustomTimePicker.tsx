import React, { useState, useEffect } from "react";
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
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Parse various time formats
  const parseTimeInput = (input: string): string | null => {
    if (!input) return null;

    // Remove all spaces and convert to lowercase
    const cleaned = input.replace(/\s+/g, '').toLowerCase();

    // Handle Korean AM/PM
    const isAM = cleaned.includes('오전') || cleaned.includes('am');
    const isPM = cleaned.includes('오후') || cleaned.includes('pm');

    // Remove AM/PM markers
    let timeStr = cleaned
      .replace('오전', '')
      .replace('오후', '')
      .replace('am', '')
      .replace('pm', '')
      .replace('시', ':')
      .replace('분', '');

    // Handle various formats: "11:30", "1130", "11시30분", etc.
    let hours: number;
    let minutes: number;

    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
    } else if (timeStr.length === 4) {
      hours = parseInt(timeStr.substring(0, 2)) || 0;
      minutes = parseInt(timeStr.substring(2, 4)) || 0;
    } else if (timeStr.length === 3) {
      hours = parseInt(timeStr.substring(0, 1)) || 0;
      minutes = parseInt(timeStr.substring(1, 3)) || 0;
    } else if (timeStr.length <= 2) {
      hours = parseInt(timeStr) || 0;
      minutes = 0;
    } else {
      return null;
    }

    // Convert 12-hour to 24-hour if needed
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }

    // Validate
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

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
      const timeString = `${hours}:${minutes}`;
      onChange(timeString);
      setInputValue(timeString);
    } else {
      onChange("");
      setInputValue("");
    }
  };

  // Handle manual input
  const handleInputChange = (event: any) => {
    const input = event.target?.value || event;
    if (typeof input === 'string') {
      setInputValue(input);
    }
  };

  // Process input when focus is lost
  const handleInputBlur = () => {
    const parsed = parseTimeInput(inputValue);
    if (parsed) {
      onChange(parsed);
      setInputValue(parsed);
    } else if (inputValue) {
      // If invalid, revert to previous valid value
      setInputValue(value);
    }
  };

  return (
    <div className={`${styles.timePickerWrapper} ${className}`}>
      <DatePicker
        selected={getDateFromTime(value)}
        onChange={handleTimeChange}
        onChangeRaw={handleInputChange}
        onBlur={handleInputBlur}
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
        value={inputValue}
      />
    </div>
  );
};

export default CustomTimePicker;
