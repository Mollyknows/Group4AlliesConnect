import { useEffect, useState } from "react";
import { Alert, Badge, Button, Col, Form, Row, Table } from "react-bootstrap";
import { API_URL } from "./volunteerHelpers";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_SCHEDULE = DAYS.map((day) => ({
  day_of_week: day,
  available: false,
  start_time: "09:00",
  end_time: "17:00",
}));

function EditAvailabilityContent({ userId }) {
  // ── Weekly schedule state ──
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState(null);

  // ── Unavailable dates state ──
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [dateMsg, setDateMsg] = useState(null);

  // ── Fetch on mount ──
  useEffect(() => {
    if (!userId) return;
    fetchSchedule();
    fetchUnavailableDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Weekly availability helpers ──
  const fetchSchedule = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/volunteers/${userId}/availability`,
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Merge fetched data with default schedule so all 7 days are present
        const merged = DAYS.map((day) => {
          const found = data.find((d) => d.day_of_week === day);
          return found
            ? {
                day_of_week: day,
                available: !!found.available,
                start_time: found.start_time
                  ? found.start_time.substring(0, 5)
                  : "09:00",
                end_time: found.end_time
                  ? found.end_time.substring(0, 5)
                  : "17:00",
              }
            : {
                day_of_week: day,
                available: false,
                start_time: "09:00",
                end_time: "17:00",
              };
        });
        setSchedule(merged);
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
    }
  };

  const updateDay = (index, field, value) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    setScheduleMsg(null);
    try {
      const res = await fetch(
        `${API_URL}/api/volunteers/${userId}/availability`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedule }),
        },
      );
      if (res.ok) {
        setScheduleMsg({ type: "success", text: "Availability saved!" });
      } else {
        const err = await res.json();
        setScheduleMsg({
          type: "danger",
          text: err.error || "Failed to save.",
        });
      }
    } catch (err) {
      console.error("Error saving schedule:", err);
      setScheduleMsg({ type: "danger", text: "Network error." });
    } finally {
      setSavingSchedule(false);
    }
  };

  // ── Unavailable dates helpers ──
  const fetchUnavailableDates = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/volunteers/${userId}/unavailable-dates`,
      );
      const data = await res.json();
      setUnavailableDates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching unavailable dates:", err);
    }
  };

  const addUnavailableDate = async () => {
    if (!newDate) return;
    setDateMsg(null);
    try {
      const res = await fetch(
        `${API_URL}/api/volunteers/${userId}/unavailable-dates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unavailable_date: newDate,
            reason: newReason || null,
          }),
        },
      );
      if (res.ok) {
        const created = await res.json();
        setUnavailableDates((prev) =>
          [...prev, created].sort(
            (a, b) =>
              new Date(a.unavailable_date) - new Date(b.unavailable_date),
          ),
        );
        setNewDate("");
        setNewReason("");
      } else if (res.status === 409) {
        setDateMsg({ type: "warning", text: "That date is already listed." });
      } else {
        setDateMsg({ type: "danger", text: "Failed to add date." });
      }
    } catch (err) {
      console.error("Error adding unavailable date:", err);
      setDateMsg({ type: "danger", text: "Network error." });
    }
  };

  const removeUnavailableDate = async (id) => {
    try {
      const res = await fetch(
        `${API_URL}/api/volunteers/${userId}/unavailable-dates/${id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setUnavailableDates((prev) =>
          prev.filter((d) => d.unavailable_id !== id),
        );
      }
    } catch (err) {
      console.error("Error removing unavailable date:", err);
    }
  };

  // ── Render ──
  return (
    <>
      {/* ─── Weekly Schedule ─── */}
      <h5 className="mb-3">Weekly Availability</h5>
      <Table bordered hover size="sm" className="text-center align-middle">
        <thead>
          <tr>
            <th style={{ width: "20%" }}>Day</th>
            <th style={{ width: "15%" }}>Available</th>
            <th style={{ width: "30%" }}>Start Time</th>
            <th style={{ width: "30%" }}>End Time</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((slot, idx) => (
            <tr key={slot.day_of_week}>
              <td className="fw-semibold">{slot.day_of_week}</td>
              <td>
                <Form.Check
                  type="switch"
                  checked={slot.available}
                  onChange={(e) =>
                    updateDay(idx, "available", e.target.checked)
                  }
                  label={slot.available ? "Yes" : "No"}
                  className="d-flex justify-content-center gap-2"
                />
              </td>
              <td>
                <Form.Control
                  type="time"
                  size="sm"
                  disabled={!slot.available}
                  value={slot.start_time}
                  onChange={(e) => updateDay(idx, "start_time", e.target.value)}
                />
              </td>
              <td>
                <Form.Control
                  type="time"
                  size="sm"
                  disabled={!slot.available}
                  value={slot.end_time}
                  onChange={(e) => updateDay(idx, "end_time", e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {scheduleMsg && (
        <Alert
          variant={scheduleMsg.type}
          dismissible
          onClose={() => setScheduleMsg(null)}
        >
          {scheduleMsg.text}
        </Alert>
      )}

      <div className="d-flex justify-content-end mb-4">
        <Button
          variant="primary"
          onClick={saveSchedule}
          disabled={savingSchedule}
        >
          {savingSchedule ? "Saving…" : "Save Weekly Schedule"}
        </Button>
      </div>

      <hr />

      {/* ─── Unavailable Dates ─── */}
      <h5 className="mb-3">Specific Unavailable Dates</h5>
      <p className="text-muted" style={{ fontSize: "0.9rem" }}>
        Add specific calendar dates when you will not be available.
      </p>

      <Row className="g-2 mb-3 align-items-end">
        <Col xs={12} md={4}>
          <Form.Label>Date</Form.Label>
          <Form.Control
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </Col>
        <Col xs={12} md={5}>
          <Form.Label>Reason (optional)</Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g. Vacation, Doctor appointment"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
          />
        </Col>
        <Col xs={12} md={3}>
          <Button
            variant="outline-primary"
            className="w-100"
            disabled={!newDate}
            onClick={addUnavailableDate}
          >
            + Add Date
          </Button>
        </Col>
      </Row>

      {dateMsg && (
        <Alert
          variant={dateMsg.type}
          dismissible
          onClose={() => setDateMsg(null)}
        >
          {dateMsg.text}
        </Alert>
      )}

      {unavailableDates.length === 0 ? (
        <p className="text-muted text-center">No unavailable dates set.</p>
      ) : (
        <Table hover size="sm" className="text-center align-middle">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {unavailableDates.map((d) => (
              <tr key={d.unavailable_id}>
                <td>
                  {new Date(
                    d.unavailable_date.substring(0, 10) + "T00:00:00",
                  ).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td>
                  {d.reason ? d.reason : <Badge bg="secondary">None</Badge>}
                </td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeUnavailableDate(d.unavailable_id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

export default EditAvailabilityContent;
