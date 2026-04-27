import { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import "../../App.css";
import { API_URL, useTableDataProcessing } from "./providerHelpers";

function EditEventsContent({ onViewDetails, providerId }) {
  const [events, setEvents] = useState([]);
  const formatDateTime = (iso) => {
    if (!iso) return "";
    try {
      const normalized =
        typeof iso === "string" && iso.indexOf("T") === -1
          ? iso.replace(" ", "T")
          : iso;
      const d = new Date(normalized);
      if (isNaN(d)) return iso;
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
  };
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(events, "title");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();
      const providerEvents = Array.isArray(data)
        ? data.filter((e) => e.provider_id === providerId)
        : [];
      setEvents(providerEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    }
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by event title"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("title")}
              aria-label="Sort by title">
              Title {sortSymbol("title")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("start_datetime")}
              aria-label="Sort by start date">
              Start {sortSymbol("start_datetime")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("category_name")}
              aria-label="Sort by category">
              Category {sortSymbol("category_name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("city")}
              aria-label="Sort by location">
              Location {sortSymbol("city")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("attendance")}
              aria-label="Sort by attendance">
              Attendance {sortSymbol("attendance")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("capacity")}
              aria-label="Sort by capacity">
              Capacity {sortSymbol("capacity")}
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-muted">
                No events found.
              </td>
            </tr>
          ) : (
            sortedData.map((event) => (
              <tr key={event.event_id} className="text-center align-middle">
                <td>{event.title}</td>
                <td>{formatDateTime(event.start_datetime)}</td>
                <td>{event.category_name}</td>
                <td>
                  {event.city}, {event.state}
                </td>
                <td>{event.attendance ?? 0}</td>
                <td>{event.capacity ?? "—"}</td>
                <td>
                  <button
                    className="outline-warning me-2"
                    onClick={() => onViewDetails("editEvents", event)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );
}

export default EditEventsContent;