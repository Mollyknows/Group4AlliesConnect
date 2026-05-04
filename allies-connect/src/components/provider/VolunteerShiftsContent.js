import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Spinner } from "react-bootstrap";
import "../../App.css";
import { API_URL, TIME_OPTIONS } from "./providerHelpers";

/* ── Map JS day index (0=Sun) to hours-JSON key ── */
const DAY_INDEX_TO_KEY = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/* ── Parse the resource "hours" JSON safely ── */
function parseResourceHours(resource) {
  if (!resource || !resource.hours) return null;
  try {
    const parsed =
      typeof resource.hours === "string"
        ? JSON.parse(resource.hours)
        : resource.hours;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/* ── Tiny inline calendar built with dayjs ── */
function MiniCalendar({
  selectedDate,
  onSelectDate,
  highlightedDates,
  closedDays,
}) {
  const [viewMonth, setViewMonth] = useState(dayjs(selectedDate));
  const highlighted = new Set(
    (highlightedDates || []).map((d) => dayjs(d).format("YYYY-MM-DD")),
  );
  const closed = closedDays || new Set();

  const startOfMonth = viewMonth.startOf("month");
  const startDay = startOfMonth.day(); // 0=Sun
  const daysInMonth = viewMonth.daysInMonth();

  const prevMonth = () => setViewMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setViewMonth((m) => m.add(1, "month"));

  const weeks = [];
  let day = 1 - startDay;
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++, day++) {
      if (day < 1 || day > daysInMonth) {
        week.push(null);
      } else {
        week.push(day);
      }
    }
    weeks.push(week);
    if (day > daysInMonth) break;
  }

  const today = dayjs().format("YYYY-MM-DD");
  const selected = dayjs(selectedDate).format("YYYY-MM-DD");

  return (
    <div style={{ minWidth: 240 }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={prevMonth}
        >
          ‹
        </button>
        <strong>{viewMonth.format("MMMM YYYY")}</strong>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={nextMonth}
        >
          ›
        </button>
      </div>
      <table
        className="table table-sm text-center mb-0"
        style={{ tableLayout: "fixed" }}
      >
        <thead>
          <tr>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <th key={d} style={{ padding: "2px", fontSize: "0.75rem" }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                if (d === null)
                  return <td key={di} style={{ padding: "2px" }} />;
                const dateStr = viewMonth.date(d).format("YYYY-MM-DD");
                const dayOfWeek = viewMonth.date(d).day(); // 0=Sun
                const isClosed = closed.has(dayOfWeek);
                const isToday = dateStr === today;
                const isSelected = dateStr === selected;
                const hasShifts = highlighted.has(dateStr);
                return (
                  <td
                    key={di}
                    style={{
                      padding: "2px",
                      cursor: isClosed ? "not-allowed" : "pointer",
                      borderRadius: "4px",
                      backgroundColor: isClosed
                        ? "#e9ecef"
                        : isSelected
                          ? "#c5a24d"
                          : hasShifts
                            ? "#fff3cd"
                            : "transparent",
                      color: isClosed
                        ? "#adb5bd"
                        : isSelected
                          ? "#fff"
                          : "inherit",
                      fontWeight: isToday ? "bold" : "normal",
                      border: isToday ? "2px solid #c5a24d" : "none",
                      textDecoration: isClosed ? "line-through" : "none",
                    }}
                    onClick={() => {
                      if (!isClosed)
                        onSelectDate(viewMonth.date(d).format("YYYY-MM-DD"));
                    }}
                    title={isClosed ? "Closed" : ""}
                  >
                    {d}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Helper: generate hour slot labels between open and close ── */
function generateHourSlots(openTime, closeTime) {
  if (!openTime || !closeTime) return [];
  const [openH] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  const endHour = closeM > 0 ? closeH + 1 : closeH; // include partial last hour
  const slots = [];
  for (let h = openH; h < endHour; h++) {
    const period = h < 12 ? "AM" : "PM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push({ hour24: h, label: `${hour12}:00 ${period}` });
  }
  return slots;
}

/* ── Helper: format 24h time string to 12h label ── */
function fmt12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/* ── Main component ── */
function VolunteerShiftsContent({ providerId }) {
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [loadingResources, setLoadingResources] = useState(false);

  // Calendar / date
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [highlightedDates, setHighlightedDates] = useState([]);

  // Shifts for selected resource + date
  const [shifts, setShifts] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Volunteers connected to the resource
  const [volunteers, setVolunteers] = useState([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);

  // Expanded shift management
  const [expandedShiftId, setExpandedShiftId] = useState(null);
  const [volunteersAvail, setVolunteersAvail] = useState([]); // volunteers + availability for selected date
  const [loadingAvail, setLoadingAvail] = useState(false);

  // New-shift form
  const [showNewShift, setShowNewShift] = useState(false);
  const [newShift, setNewShift] = useState({
    start: "",
    end: "",
    capacity: "",
  });
  const [savingShift, setSavingShift] = useState(false);

  // ── Selected resource object + parsed hours ──
  const selectedResource = useMemo(
    () => resources.find((r) => r.resource_id === selectedResourceId) || null,
    [resources, selectedResourceId],
  );
  const parsedHours = useMemo(
    () => parseResourceHours(selectedResource),
    [selectedResource],
  );

  // Closed days set (JS day index, 0=Sun … 6=Sat)
  const closedDays = useMemo(() => {
    if (!parsedHours) return new Set();
    const s = new Set();
    DAY_INDEX_TO_KEY.forEach((key, idx) => {
      if (parsedHours[key] && parsedHours[key].closed) s.add(idx);
    });
    return s;
  }, [parsedHours]);

  // Day hours for the selected date
  const dayHoursInfo = useMemo(() => {
    if (!parsedHours || !selectedDate) return null;
    const dayKey = DAY_INDEX_TO_KEY[dayjs(selectedDate).day()];
    const info = parsedHours[dayKey];
    if (!info || info.closed) return null;
    return info; // { open: "09:00", close: "17:00" }
  }, [parsedHours, selectedDate]);

  const hourSlots = useMemo(() => {
    if (!dayHoursInfo) return [];
    return generateHourSlots(dayHoursInfo.open, dayHoursInfo.close);
  }, [dayHoursInfo]);

  // Filter TIME_OPTIONS to resource hours for the new-shift form
  const availableTimeOptions = useMemo(() => {
    if (!dayHoursInfo) return TIME_OPTIONS;
    return TIME_OPTIONS.filter(
      (t) => t.value >= dayHoursInfo.open && t.value <= dayHoursInfo.close,
    );
  }, [dayHoursInfo]);

  // ── Fetch provider's resources ──
  useEffect(() => {
    if (!providerId) return;
    setLoadingResources(true);
    fetch(`${API_URL}/api/resources`)
      .then((r) => r.json())
      .then((data) => {
        const providerResources = Array.isArray(data)
          ? data.filter((r) => r.provider_id === providerId)
          : [];
        setResources(providerResources);
      })
      .catch((err) => console.error("Error fetching resources:", err))
      .finally(() => setLoadingResources(false));
  }, [providerId]);

  // ── When resource changes, fetch volunteers + shift dates ──
  useEffect(() => {
    if (!selectedResourceId) {
      setVolunteers([]);
      setHighlightedDates([]);
      setShifts([]);
      return;
    }

    setLoadingVolunteers(true);
    fetch(`${API_URL}/api/resources/${selectedResourceId}/volunteers`)
      .then((r) => r.json())
      .then((data) => setVolunteers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching volunteers:", err))
      .finally(() => setLoadingVolunteers(false));

    fetch(`${API_URL}/api/resources/${selectedResourceId}/shift-dates`)
      .then((r) => r.json())
      .then((data) => setHighlightedDates(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching shift dates:", err));
  }, [selectedResourceId]);

  // ── When resource or date changes, fetch shifts for that day ──
  const fetchDayShifts = useCallback(() => {
    if (!selectedResourceId || !selectedDate) {
      setShifts([]);
      return;
    }
    // Convert the selected local day to a UTC range so the backend
    // (which stores datetimes in UTC) returns the correct shifts even
    // when the local day spans two UTC dates.
    const pad = (n) => String(n).padStart(2, "0");
    const fmtUTC = (d) =>
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
    const utcStart = fmtUTC(new Date(`${selectedDate}T00:00:00`));
    const utcEnd = fmtUTC(new Date(`${selectedDate}T23:59:59`));
    setLoadingShifts(true);
    fetch(
      `${API_URL}/api/resources/${selectedResourceId}/shifts?utc_start=${encodeURIComponent(utcStart)}&utc_end=${encodeURIComponent(utcEnd)}`,
    )
      .then((r) => r.json())
      .then((data) => setShifts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching day shifts:", err))
      .finally(() => setLoadingShifts(false));
  }, [selectedResourceId, selectedDate]);

  useEffect(() => {
    fetchDayShifts();
  }, [fetchDayShifts]);

  const handleResourceChange = (e) => {
    setSelectedResourceId(e.target.value ? Number(e.target.value) : "");
    setShowNewShift(false);
    setExpandedShiftId(null);
  };

  // ── Fetch volunteers with availability when resource or date changes ──
  useEffect(() => {
    if (!selectedResourceId || !selectedDate) {
      setVolunteersAvail([]);
      return;
    }
    setLoadingAvail(true);
    fetch(
      `${API_URL}/api/resources/${selectedResourceId}/volunteers-availability?date=${selectedDate}`,
    )
      .then((r) => r.json())
      .then((data) => setVolunteersAvail(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching availability:", err))
      .finally(() => setLoadingAvail(false));
  }, [selectedResourceId, selectedDate]);

  // ── Refresh shift-dates too after a shift is created / deleted ──
  const refreshAfterShiftChange = () => {
    fetchDayShifts();
    fetch(`${API_URL}/api/resources/${selectedResourceId}/shift-dates`)
      .then((r) => r.json())
      .then((data) => setHighlightedDates(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  // ── Assign a volunteer to a shift ──
  const handleAssignVolunteer = async (shiftId, userId) => {
    // Check availability first
    const vol = volunteersAvail.find((v) => v.user_id === userId);
    if (vol && !vol.available) {
      const proceed = window.confirm(
        `${vol.first_name} ${vol.last_name} is marked as unavailable (${vol.unavailable_reason}). Assign anyway?`,
      );
      if (!proceed) return;
    }
    try {
      const resp = await fetch(`${API_URL}/api/volunteer-signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: shiftId,
          user_id: userId,
          scheduled_by_provider: true,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        alert(data.error || "Failed to assign volunteer.");
        return;
      }
      fetchDayShifts();
    } catch (err) {
      console.error("Error assigning volunteer:", err);
      alert("Failed to assign volunteer.");
    }
  };

  // ── Remove a volunteer from a shift ──
  const handleRemoveVolunteer = async (signupId, volunteerName) => {
    if (!window.confirm(`Remove ${volunteerName} from this shift?`)) return;
    try {
      const resp = await fetch(`${API_URL}/api/volunteer-signups/${signupId}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error();
      fetchDayShifts();
    } catch (err) {
      console.error("Error removing volunteer:", err);
      alert("Failed to remove volunteer.");
    }
  };

  // ── Delete a shift ──
  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm("Delete this shift? This cannot be undone.")) return;
    try {
      const resp = await fetch(`${API_URL}/api/shifts/${shiftId}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error();
      setExpandedShiftId(null);
      refreshAfterShiftChange();
    } catch (err) {
      console.error("Error deleting shift:", err);
      alert("Failed to delete shift.");
    }
  };

  // ── Save new shift ──
  const handleSaveNewShift = async () => {
    if (!newShift.start || !newShift.end) return;
    setSavingShift(true);

    // Convert a "YYYY-MM-DD" date + "HH:mm" time (local) to a UTC MySQL
    // datetime string so the backend (pool timezone "+00:00") stores it
    // correctly and returns it with a Z suffix for local display.
    const toUTCMysql = (date, time) => {
      const d = new Date(`${date}T${time}:00`);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
    };

    try {
      const startDT = toUTCMysql(selectedDate, newShift.start);
      const endDT = toUTCMysql(selectedDate, newShift.end);
      const resp = await fetch(
        `${API_URL}/api/resources/${selectedResourceId}/shifts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_datetime: startDT,
            end_datetime: endDT,
            capacity: newShift.capacity ? Number(newShift.capacity) : null,
          }),
        },
      );
      if (!resp.ok) throw new Error("Failed to create shift");
      setNewShift({ start: "", end: "", capacity: "" });
      setShowNewShift(false);
      refreshAfterShiftChange();
    } catch (err) {
      console.error("Error creating shift:", err);
      alert("Failed to create shift.");
    } finally {
      setSavingShift(false);
    }
  };

  // ── Determine which hour slots have shifts ──
  const shiftsByHour = useMemo(() => {
    const map = {}; // hour24 => [shift, ...]
    shifts.forEach((shift) => {
      const startH = dayjs(shift.start_datetime).hour();
      const endH = dayjs(shift.end_datetime).hour();
      const endM = dayjs(shift.end_datetime).minute();
      const lastHour = endM > 0 ? endH : endH - 1;
      for (let h = startH; h <= lastHour; h++) {
        if (!map[h]) map[h] = [];
        if (!map[h].find((s) => s.shift_id === shift.shift_id)) {
          map[h].push(shift);
        }
      }
    });
    return map;
  }, [shifts]);

  const isClosed =
    parsedHours &&
    selectedDate &&
    parsedHours[DAY_INDEX_TO_KEY[dayjs(selectedDate).day()]]?.closed;

  return (
    <div>
      {/* ── Resource Selector ── */}
      <div className="mb-3">
        <label className="form-label">
          <strong>Select a Resource</strong>
        </label>
        {loadingResources ? (
          <div className="text-center py-2">
            <Spinner animation="border" size="sm" />
          </div>
        ) : (
          <select
            className="form-select"
            value={selectedResourceId}
            onChange={handleResourceChange}
          >
            <option value="">-- Choose a resource --</option>
            {resources.map((r) => (
              <option key={r.resource_id} value={r.resource_id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Three-Column Layout ── */}
      {selectedResourceId && (
        <div className="row" style={{ minHeight: 380 }}>
          {/* LEFT: Calendar */}
          <div className="col-md-3">
            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              highlightedDates={highlightedDates}
              closedDays={closedDays}
            />
          </div>

          {/* MIDDLE: Hourly Schedule */}
          <div
            className="col-md-6"
            style={{
              borderLeft: "1px solid #dee2e6",
              borderRight: "1px solid #dee2e6",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                <strong>
                  {dayjs(selectedDate).format("dddd, MMMM D, YYYY")}
                </strong>
              </h6>
              <div className="d-flex align-items-center gap-2">
                {dayHoursInfo && !isClosed && (
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                    {fmt12(dayHoursInfo.open)} – {fmt12(dayHoursInfo.close)}
                  </span>
                )}
                {!isClosed && !showNewShift && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowNewShift(true)}
                  >
                    + New Shift
                  </button>
                )}
              </div>
            </div>
            {showNewShift && !isClosed && (
              <NewShiftForm
                newShift={newShift}
                setNewShift={setNewShift}
                timeOptions={dayHoursInfo ? availableTimeOptions : TIME_OPTIONS}
                savingShift={savingShift}
                onSave={handleSaveNewShift}
                onCancel={() => setShowNewShift(false)}
              />
            )}

            {loadingShifts ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" /> Loading shifts…
              </div>
            ) : isClosed ? (
              <div
                className="text-center py-5 text-muted"
                style={{ backgroundColor: "#f8f9fa", borderRadius: 8 }}
              >
                <strong>Closed</strong>
                <p className="mb-0" style={{ fontSize: "0.85rem" }}>
                  This resource is closed on{" "}
                  {dayjs(selectedDate).format("dddd")}s.
                </p>
              </div>
            ) : !parsedHours || !dayHoursInfo ? (
              /* No structured hours — show flat shift list like before */
              <>
                {shifts.length === 0 ? (
                  <p className="text-muted">
                    No shifts scheduled for this day.
                  </p>
                ) : (
                  shifts.map((shift) => (
                    <ShiftCard
                      key={shift.shift_id}
                      shift={shift}
                      isExpanded={expandedShiftId === shift.shift_id}
                      onToggle={() =>
                        setExpandedShiftId(
                          expandedShiftId === shift.shift_id
                            ? null
                            : shift.shift_id,
                        )
                      }
                      volunteersAvail={volunteersAvail}
                      loadingAvail={loadingAvail}
                      onAssign={handleAssignVolunteer}
                      onRemove={handleRemoveVolunteer}
                      onDelete={handleDeleteShift}
                    />
                  ))
                )}
              </>
            ) : (
              /* Hourly timeline based on resource hours */
              <div style={{ position: "relative" }}>
                {hourSlots.map(({ hour24, label }) => {
                  const slotShifts = shiftsByHour[hour24] || [];
                  return (
                    <div
                      key={hour24}
                      style={{
                        display: "flex",
                        borderBottom: "1px solid #eee",
                        minHeight: 54,
                      }}
                    >
                      {/* Time label */}
                      <div
                        style={{
                          width: 80,
                          flexShrink: 0,
                          fontSize: "0.75rem",
                          color: "#6c757d",
                          paddingTop: 4,
                          paddingRight: 8,
                          textAlign: "right",
                          borderRight: "2px solid #dee2e6",
                        }}
                      >
                        {label}
                      </div>
                      {/* Shift content area */}
                      <div style={{ flex: 1, padding: "4px 8px" }}>
                        {slotShifts.map((shift) => {
                          // Only render the card in the shift's start hour
                          if (dayjs(shift.start_datetime).hour() !== hour24)
                            return null;
                          return (
                            <ShiftCard
                              key={shift.shift_id}
                              shift={shift}
                              isExpanded={expandedShiftId === shift.shift_id}
                              onToggle={() =>
                                setExpandedShiftId(
                                  expandedShiftId === shift.shift_id
                                    ? null
                                    : shift.shift_id,
                                )
                              }
                              volunteersAvail={volunteersAvail}
                              loadingAvail={loadingAvail}
                              onAssign={handleAssignVolunteer}
                              onRemove={handleRemoveVolunteer}
                              onDelete={handleDeleteShift}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Resource Volunteers */}
          <div className="col-md-3">
            <h6 className="mb-3">
              <strong>Resource Volunteers</strong>
            </h6>
            {loadingVolunteers ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
              </div>
            ) : volunteers.length === 0 ? (
              <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                No volunteers signed up for this resource.
              </p>
            ) : (
              <ul className="list-unstyled">
                {volunteers.map((v) => (
                  <li
                    key={v.connection_id}
                    className="d-flex align-items-center py-2"
                    style={{ borderBottom: "1px solid #f0f0f0" }}
                  >
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle text-white me-2"
                      style={{
                        width: 32,
                        height: 32,
                        fontSize: "0.75rem",
                        backgroundColor: "#c5a24d",
                        flexShrink: 0,
                      }}
                    >
                      {(v.first_name?.[0] || "").toUpperCase()}
                      {(v.last_name?.[0] || "").toUpperCase()}
                    </span>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ fontWeight: 500 }}>
                        {v.first_name} {v.last_name}
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {v.email}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shift card displayed in timeline or flat list ── */
function ShiftCard({
  shift,
  isExpanded,
  onToggle,
  volunteersAvail,
  loadingAvail,
  onAssign,
  onRemove,
  onDelete,
}) {
  const signedUpIds = new Set(
    (shift.signups || [])
      .filter((s) => s.status !== "cancelled")
      .map((s) => s.user_id),
  );

  // Volunteers not yet signed up for this shift
  const assignable = (volunteersAvail || []).filter(
    (v) => !signedUpIds.has(v.user_id),
  );

  return (
    <div
      className="border rounded mb-2"
      style={{ backgroundColor: isExpanded ? "#fff8e1" : "#fff8e1" }}
    >
      {/* Header — clickable */}
      <div
        className="d-flex justify-content-between align-items-center p-2"
        style={{ cursor: "pointer" }}
        onClick={onToggle}
      >
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: "0.75rem", color: "#6c757d" }}>
            {isExpanded ? "▾" : "▸"}
          </span>
          <strong style={{ fontSize: "0.85rem" }}>
            {dayjs(shift.start_datetime).format("h:mm A")} –{" "}
            {dayjs(shift.end_datetime).format("h:mm A")}
          </strong>
        </div>
        <Badge bg="secondary" style={{ fontSize: "0.7rem" }}>
          {shift.signups?.length || 0}
          {shift.capacity != null && shift.capacity > 0
            ? ` / ${shift.capacity}`
            : ""}{" "}
          signed up
        </Badge>
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div className="px-3 pb-3" style={{ borderTop: "1px solid #eee" }}>
          {/* Signed-up volunteers with remove buttons */}
          <div className="mt-2 mb-2">
            <div
              className="text-muted mb-1"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              Assigned Volunteers
            </div>
            {shift.signups && shift.signups.length > 0 ? (
              <ul className="list-unstyled mb-0">
                {shift.signups.map((s) => (
                  <li
                    key={s.signup_id}
                    className="d-flex align-items-center justify-content-between py-1"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <div className="d-flex align-items-center">
                      <span
                        className="d-inline-block rounded-circle text-white text-center me-2"
                        style={{
                          width: 22,
                          height: 22,
                          lineHeight: "22px",
                          fontSize: "0.65rem",
                          backgroundColor: "#6c757d",
                        }}
                      >
                        {(s.first_name?.[0] || "").toUpperCase()}
                        {(s.last_name?.[0] || "").toUpperCase()}
                      </span>
                      {s.first_name} {s.last_name}
                      <span
                        className="text-muted ms-2"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {s.email}
                      </span>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger py-0 px-1"
                      style={{ fontSize: "0.7rem", lineHeight: 1.4 }}
                      title="Remove from shift"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(s.signup_id, `${s.first_name} ${s.last_name}`);
                      }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
                No volunteers assigned yet.
              </p>
            )}
          </div>

          {/* Assign volunteer dropdown */}
          <div className="mb-2">
            <div
              className="text-muted mb-1"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              Add Volunteer
            </div>
            {loadingAvail ? (
              <Spinner animation="border" size="sm" />
            ) : assignable.length === 0 ? (
              <p className="text-muted mb-0" style={{ fontSize: "0.8rem" }}>
                {(volunteersAvail || []).length === 0
                  ? "No resource volunteers to assign."
                  : "All resource volunteers are already assigned."}
              </p>
            ) : (
              <div
                style={{
                  maxHeight: 180,
                  overflowY: "auto",
                  border: "1px solid #dee2e6",
                  borderRadius: 4,
                }}
              >
                {assignable.map((v) => (
                  <div
                    key={v.user_id}
                    className="d-flex align-items-center justify-content-between px-2 py-1"
                    style={{
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #f0f0f0",
                      opacity: v.available ? 1 : 0.5,
                      backgroundColor: v.available ? "transparent" : "#f8f9fa",
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <span
                        className="d-inline-block rounded-circle text-white text-center me-2"
                        style={{
                          width: 22,
                          height: 22,
                          lineHeight: "22px",
                          fontSize: "0.65rem",
                          backgroundColor: v.available ? "#c5a24d" : "#adb5bd",
                        }}
                      >
                        {(v.first_name?.[0] || "").toUpperCase()}
                        {(v.last_name?.[0] || "").toUpperCase()}
                      </span>
                      <span>
                        {v.first_name} {v.last_name}
                      </span>
                      {!v.available && (
                        <span
                          className="text-danger ms-2"
                          style={{ fontSize: "0.7rem" }}
                          title={v.unavailable_reason}
                        >
                          ({v.unavailable_reason})
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-primary py-0 px-1"
                      style={{ fontSize: "0.7rem", lineHeight: 1.4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssign(shift.shift_id, v.user_id);
                      }}
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete shift */}
          <div className="text-end">
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(shift.shift_id);
              }}
            >
              🗑 Delete Shift
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Inline form for creating a new shift ── */
function NewShiftForm({
  newShift,
  setNewShift,
  timeOptions,
  savingShift,
  onSave,
  onCancel,
}) {
  return (
    <div
      className="border rounded p-3 mt-2"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <h6 className="mb-2" style={{ fontSize: "0.9rem" }}>
        <strong>Create New Shift</strong>
      </h6>
      <div className="row g-2 align-items-end">
        <div className="col">
          <label className="form-label mb-1" style={{ fontSize: "0.8rem" }}>
            Start
          </label>
          <select
            className="form-select form-select-sm"
            value={newShift.start}
            onChange={(e) =>
              setNewShift((s) => ({ ...s, start: e.target.value }))
            }
          >
            <option value="">--</option>
            {timeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <label className="form-label mb-1" style={{ fontSize: "0.8rem" }}>
            End
          </label>
          <select
            className="form-select form-select-sm"
            value={newShift.end}
            onChange={(e) =>
              setNewShift((s) => ({ ...s, end: e.target.value }))
            }
          >
            <option value="">--</option>
            {timeOptions
              .filter((t) => !newShift.start || t.value > newShift.start)
              .map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
          </select>
        </div>
        <div className="col-3">
          <label className="form-label mb-1" style={{ fontSize: "0.8rem" }}>
            Capacity
          </label>
          <input
            type="number"
            className="form-control form-control-sm"
            min="1"
            placeholder="--"
            value={newShift.capacity}
            onChange={(e) =>
              setNewShift((s) => ({ ...s, capacity: e.target.value }))
            }
          />
        </div>
        <div className="col-auto">
          <button
            className="btn btn-sm btn-primary me-1"
            disabled={!newShift.start || !newShift.end || savingShift}
            onClick={onSave}
          >
            {savingShift ? <Spinner animation="border" size="sm" /> : "Save"}
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onCancel}
            disabled={savingShift}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default VolunteerShiftsContent;
