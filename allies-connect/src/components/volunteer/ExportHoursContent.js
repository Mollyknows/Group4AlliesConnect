import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Alert, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import "../../App.css";
import { API_URL } from "./volunteerHelpers";

function ExportHoursContent({ userId }) {
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  /* Fetch only resources the user has volunteer hours with */
  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/api/volunteers/${userId}/resources`)
      .then((res) => res.json())
      .then((data) => setResources(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching resources:", err));
  }, [userId]);

  /* Fetch hours based on selected filters */
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (selectedResource) params.append("resource_id", selectedResource);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const res = await fetch(
        `${API_URL}/api/volunteers/${userId}/hours?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch hours");
      const data = await res.json();
      setHours(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching volunteer hours:", err);
      setError("Failed to fetch volunteer hours. Please try again.");
      setHours([]);
    } finally {
      setLoading(false);
    }
  };

  /* Build and download CSV */
  const handleExportCSV = () => {
    if (hours.length === 0) {
      alert("No data to export.");
      return;
    }

    const csvHeaders = [
      "Type",
      "Resource / Event",
      "Shift Date",
      "Start Time",
      "End Time",
      "Hours Worked",
    ];

    const csvRows = hours.map((row) => [
      `"${row.shift_type || ""}"`,
      `"${row.resource_name || row.opportunity_title || ""}"`,
      `"${dayjs(row.shift_date).format("YYYY-MM-DD")}"`,
      `"${dayjs(row.start_datetime).format("h:mm A")}"`,
      `"${dayjs(row.end_datetime).format("h:mm A")}"`,
      `"${row.hours_worked}"`,
    ]);

    const csv = [csvHeaders.join(","), ...csvRows.map((r) => r.join(","))].join(
      "\n",
    );

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `volunteer_hours_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* Total hours */
  const totalHours = hours
    .reduce((sum, row) => sum + (parseFloat(row.hours_worked) || 0), 0)
    .toFixed(2);

  return (
    <>
      <h5 className="mb-3">Export Volunteer Hours</h5>

      {/* Filters */}
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <Row className="mb-3 align-items-end g-2">
          <Col md={4}>
            <Form.Group>
              <Form.Label>
                <strong>Resource</strong>
              </Form.Label>
              <Form.Select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
              >
                <option value="">All Resources and Events</option>
                {resources.map((r) => (
                  <option key={r.resource_id} value={r.resource_id}>
                    {r.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>
                <strong>From</strong>
              </Form.Label>
              <Form.Control
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>
                <strong>To</strong>
              </Form.Label>
              <Form.Control
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <button type="submit" className="btn-gold w-100">
              Search
            </button>
          </Col>
        </Row>
      </Form>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" /> Loading hours…
        </div>
      ) : searched ? (
        hours.length === 0 ? (
          <p className="text-muted text-center">
            No completed shifts found for the selected filters.
          </p>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>
                <strong>Total Hours:</strong> {totalHours}
              </span>
              <button className="btn-gold" onClick={handleExportCSV}>
                Export CSV
              </button>
            </div>
            <Table
              bordered
              hover
              size="sm"
              className="text-center align-middle"
            >
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Resource / Event</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {hours.map((row, idx) => (
                  <tr key={row.shift_id || idx}>
                    <td>{row.shift_type || "—"}</td>
                    <td>{row.resource_name || row.opportunity_title || "—"}</td>
                    <td>{dayjs(row.shift_date).format("MMM D, YYYY")}</td>
                    <td>{dayjs(row.start_datetime).format("h:mm A")}</td>
                    <td>{dayjs(row.end_datetime).format("h:mm A")}</td>
                    <td>{row.hours_worked}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )
      ) : (
        <p className="text-muted text-center">
          Select filters above and click Search to view your volunteer hours.
        </p>
      )}
    </>
  );
}

export default ExportHoursContent;
