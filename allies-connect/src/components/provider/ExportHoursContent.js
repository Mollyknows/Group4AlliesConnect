import { useEffect, useState } from "react";
import { Col, Form, Row, Spinner, Table } from "react-bootstrap";
import "../../App.css";
import { API_URL, useTableDataProcessing } from "./providerHelpers";

const formatDateTime = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

function ExportHoursContent({ onViewDetails, userId, providerId }) {
  const [hours, setHours] = useState([]);
  const [resources, setResources] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [selectedResource, setSelectedResource] = useState("");
  const [loading, setLoading] = useState(false);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(hours, "Volunteer");

  // 1. Fetch all resources for this provider on mount
  useEffect(() => {
    if (!providerId) return;
    fetch(`${API_URL}/api/resources`)
      .then((r) => r.json())
      .then((data) => {
        const providerResources = Array.isArray(data)
          ? data.filter((r) => r.provider_id === providerId)
          : [];
        setResources(providerResources);
      })
      .catch((err) => console.error("Error fetching resources:", err));
  }, [providerId]);

  // 2. When a resource is selected, fetch volunteers connected to it
  useEffect(() => {
    if (!selectedResource || !userId) {
      setVolunteers([]);
      return;
    }
    fetch(
      `${API_URL}/api/users/${userId}/provider-volunteers?resource_id=${selectedResource}`,
    )
      .then((r) => r.json())
      .then((data) => setVolunteers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching volunteers:", err));
  }, [selectedResource, userId]);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (selectedVolunteer) params.append("volunteer_id", selectedVolunteer);
    if (selectedResource) params.append("resource_id", selectedResource);
    return params.toString();
  };

  const fetchHours = async () => {
    if (!selectedResource) return;
    setLoading(true);
    try {
      const qs = buildParams();
      const response = await fetch(
        `${API_URL}/api/users/${userId}/volunteer-hours/export${qs ? `?${qs}` : ""}`,
      );
      const text = await response.text();
      const lines = text.trim().split("\n");
      if (lines.length <= 1) {
        setHours([]);
        return;
      }
      const headers = lines[0].split(",");
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.replace(/^"|"$/g, ""));
        const obj = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = values[i] || "";
        });
        return obj;
      });
      setHours(rows);
    } catch (error) {
      console.error("Error fetching volunteer hours:", error);
      setHours([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const qs = buildParams();
      const response = await fetch(
        `${API_URL}/api/users/${userId}/volunteer-hours/export${qs ? `?${qs}` : ""}`,
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `volunteer_hours_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting volunteer hours:", error);
      alert("Failed to export volunteer hours.");
    }
  };

  // Changing resource resets downstream state
  const handleResourceChange = (e) => {
    setSelectedResource(e.target.value);
    setSelectedVolunteer("");
    setHours([]);
  };

  // Changing volunteer clears results so user must re-search
  const handleVolunteerChange = (e) => {
    setSelectedVolunteer(e.target.value);
    setHours([]);
  };

  return (
    <>
      {/* Step 1: Pick a resource */}
      <Row className="mb-3 g-2 align-items-end">
        <Col md={4}>
          <Form.Label>
            <strong>
              Resource <span className="text-danger">*</span>
            </strong>
          </Form.Label>
          <Form.Select value={selectedResource} onChange={handleResourceChange}>
            <option value="">— Select a resource —</option>
            {resources.map((r) => (
              <option key={r.resource_id} value={r.resource_id}>
                {r.name}
              </option>
            ))}
          </Form.Select>
        </Col>

        {/* Step 2: Pick a volunteer (only active once a resource is chosen) */}
        <Col md={4}>
          <Form.Label>
            <strong>Volunteer</strong>
          </Form.Label>
          <Form.Select
            value={selectedVolunteer}
            onChange={handleVolunteerChange}
            disabled={!selectedResource}
          >
            <option value="">All Volunteers</option>
            {volunteers.map((v) => (
              <option key={v.user_id} value={v.user_id}>
                {v.first_name} {v.last_name}
              </option>
            ))}
          </Form.Select>
        </Col>

        <Col md={4} className="d-flex gap-2">
          <button
            className="btn-gold flex-grow-1"
            onClick={fetchHours}
            disabled={!selectedResource}
          >
            Search
          </button>
          <button
            className="btn-gold flex-grow-1"
            onClick={handleExportCSV}
            disabled={hours.length === 0}
          >
            Export CSV
          </button>
        </Col>
      </Row>

      {/* Search within results */}
      {hours.length > 0 && (
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Search by volunteer name or resource"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" /> Loading…
        </div>
      ) : !selectedResource ? (
        <p className="text-muted text-center">
          Select a resource to get started.
        </p>
      ) : (
        <Table hover className="text-center">
          <thead>
            <tr>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("Volunteer")}
              >
                Volunteer {sortSymbol("Volunteer")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("Resource")}
              >
                Resource {sortSymbol("Resource")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("Opportunity")}
              >
                Opportunity {sortSymbol("Opportunity")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("Start Time")}
              >
                Start {sortSymbol("Start Time")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("End Time")}
              >
                End {sortSymbol("End Time")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("Hours Worked")}
              >
                Hours {sortSymbol("Hours Worked")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-muted">
                  {hours.length === 0
                    ? "Select a volunteer (or leave blank for all) and click Search."
                    : "No results match your search."}
                </td>
              </tr>
            ) : (
              sortedData.map((entry, index) => (
                <tr key={index} className="text-center align-middle">
                  <td>{entry.Volunteer}</td>
                  <td>{entry.Resource}</td>
                  <td>{entry.Opportunity}</td>
                  <td>{formatDateTime(entry["Start Time"])}</td>
                  <td>{formatDateTime(entry["End Time"])}</td>
                  <td>{entry["Hours Worked"]}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </>
  );
}

export default ExportHoursContent;
