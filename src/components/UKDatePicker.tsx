import React from 'react';
import DatePicker from 'react-datepicker';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

interface UKDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export const UKDatePicker: React.FC<UKDatePickerProps> = ({ value, onChange, label, minDate, maxDate, disabled }) => {
  // Parse value from ISO string to Date
  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;

  return (
    <div>
      <label className="block font-semibold mb-1 flex items-center gap-1">{label}</label>
      <DatePicker
        selected={selectedDate}
        onChange={date => {
          if (date) {
            onChange(format(date as Date, 'yyyy-MM-dd'));
          } else {
            onChange('');
          }
        }}
        dateFormat="dd/MM/yyyy"
        className="w-full border p-2 mb-2 rounded focus:ring-2 focus:ring-indigo-400 transition-all duration-150"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        placeholderText="DD/MM/YYYY"
      />
    </div>
  );
};
