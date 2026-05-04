import "../../App.css";

const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins) => {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
};

const formatTime = (time24) => {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${mStr} ${period}`;
};

function ShiftBuilder({
  startTime,
  endTime,
  shifts,
  onShiftsChange,
  shiftVolunteers = {},
  shiftIds = [],
}) {
  const disabled = !startTime || !endTime || endTime <= startTime;

  // Check if we can add more shifts (longest shift must be > 30 min to split)
  const canAddShift =
    !disabled &&
    (shifts.length === 0 ||
      shifts.some((s) => timeToMinutes(s.end) - timeToMinutes(s.start) > 30));

  const handleAddShift = () => {
    // No shifts yet — create the first one spanning the full event time
    if (shifts.length === 0) {
      onShiftsChange([{ start: startTime, end: endTime, capacity: "" }]);
      return;
    }

    const newShifts = [...shifts];

    // Find the longest shift to split
    let longestIdx = 0;
    let longestDuration = 0;
    newShifts.forEach((s, i) => {
      const duration = timeToMinutes(s.end) - timeToMinutes(s.start);
      if (duration > longestDuration) {
        longestDuration = duration;
        longestIdx = i;
      }
    });

    if (longestDuration <= 30) return;

    const shiftToSplit = newShifts[longestIdx];
    const startMins = timeToMinutes(shiftToSplit.start);
    const endMins = timeToMinutes(shiftToSplit.end);
    let midMins = Math.round((startMins + endMins) / 2 / 30) * 30;

    if (midMins <= startMins) midMins = startMins + 30;
    if (midMins >= endMins) midMins = endMins - 30;
    if (midMins <= startMins || midMins >= endMins) return;

    const midTime = minutesToTime(midMins);
    newShifts.splice(
      longestIdx,
      1,
      {
        start: shiftToSplit.start,
        end: midTime,
        capacity: "",
      },
      {
        start: midTime,
        end: shiftToSplit.end,
        capacity: "",
      },
    );

    onShiftsChange(newShifts);
  };

  const handleCapacityChange = (index, value) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], capacity: value };
    onShiftsChange(newShifts);
  };

  const handleRemoveShift = (index) => {
    if (shifts.length <= 1) return;
    const newShifts = [...shifts];

    // Merge the removed shift's time range into its neighbor
    if (index === newShifts.length - 1) {
      // Last shift: merge into previous
      newShifts[index - 1] = {
        ...newShifts[index - 1],
        end: newShifts[index].end,
      };
    } else {
      // Otherwise: merge into next
      newShifts[index + 1] = {
        ...newShifts[index + 1],
        start: newShifts[index].start,
      };
    }
    newShifts.splice(index, 1);
    onShiftsChange(newShifts);
  };

  const handleShiftEndChange = (index, newEnd) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], end: newEnd };
    // Keep shifts contiguous: next shift starts where this one ends
    if (index < newShifts.length - 1) {
      newShifts[index + 1] = { ...newShifts[index + 1], start: newEnd };
    }
    onShiftsChange(newShifts);
  };

  // Build the valid end-time dropdown options for a given shift index.
  // The end must be at least 30 min after this shift's start AND leave
  // at least 30 min for the next shift (if any).
  const getEndTimeOptions = (index) => {
    const shift = shifts[index];
    const minMins = timeToMinutes(shift.start) + 30;
    const nextEnd = index < shifts.length - 1 ? shifts[index + 1].end : endTime;
    const maxMins = timeToMinutes(nextEnd) - 30;

    const options = [];
    for (let m = minMins; m <= maxMins; m += 30) {
      const t = minutesToTime(m);
      options.push({ value: t, label: formatTime(t) });
    }
    return options;
  };

  if (disabled) {
    return (
      <div className="mb-3">
        <label className="form-label">
          <strong>Volunteer Shifts</strong>
        </label>
        <div
          className="form-control text-muted"
          style={{
            backgroundColor: "#e9ecef",
            pointerEvents: "none",
            opacity: 0.65,
          }}
        >
          Select valid start and end times to configure shifts.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="form-label">
        <strong>Volunteer Shifts</strong>
      </label>
      {shifts.map((shift, i) => {
        const isLast = i === shifts.length - 1;
        const onlyOneShift = shifts.length === 1;
        const endOptions = !isLast && !onlyOneShift ? getEndTimeOptions(i) : [];
        const vols =
          shiftIds[i] != null ? (shiftVolunteers[shiftIds[i]] ?? null) : null;

        return (
          <div key={i}>
            <div className="d-flex align-items-center gap-2 mb-1 p-2 border rounded">
              <span
                className="fw-bold text-nowrap"
                style={{ minWidth: "55px" }}
              >
                Shift {i + 1}
              </span>
              <span className="text-nowrap">{formatTime(shift.start)}</span>
              <span>–</span>
              {isLast || onlyOneShift ? (
                <span className="text-nowrap">{formatTime(shift.end)}</span>
              ) : (
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={shift.end}
                  onChange={(e) => handleShiftEndChange(i, e.target.value)}
                >
                  {endOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              <span className="text-nowrap text-muted small">Capacity:</span>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ width: "80px" }}
                placeholder="Required"
                min="1"
                required
                value={shift.capacity ?? ""}
                onChange={(e) => handleCapacityChange(i, e.target.value)}
                title="Volunteer capacity (minimum 1)"
              />
              {shifts.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-auto"
                  onClick={() => handleRemoveShift(i)}
                  title="Remove shift"
                >
                  ✕
                </button>
              )}
            </div>
            {vols !== null && (
              <div className="ms-3 mb-2 ps-2 border-start">
                {vols.length === 0 ? (
                  <span className="text-muted small fst-italic">
                    No volunteers signed up.
                  </span>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {vols.map((v) => (
                      <li key={v.signup_id} className="small text-secondary">
                        👤 {v.first_name} {v.last_name}
                        <span className="text-muted ms-1">({v.email})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary mt-1"
        onClick={handleAddShift}
        disabled={!canAddShift}
      >
        + Add Shift
      </button>
    </div>
  );
}

export default ShiftBuilder;
