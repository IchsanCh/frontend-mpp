import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

export default function TimePicker({
  value,
  onChange,
  placeholder = "08:00:00",
  disabled = false,
  error = null,
}) {
  return (
    <>
      <Flatpickr
        className={`input input-bordered w-full ${error ? "input-error" : ""}`}
        value={value}
        options={{
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i:S",
          time_24hr: true,
          enableSeconds: true,
        }}
        placeholder={placeholder}
        disabled={disabled}
        onChange={([date]) => {
          if (!date) return;

          const hh = date.getHours().toString().padStart(2, "0");
          const mm = date.getMinutes().toString().padStart(2, "0");
          const ss = date.getSeconds().toString().padStart(2, "0");

          onChange(`${hh}:${mm}:${ss}`);
        }}
      />

      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </>
  );
}
