import { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import "../../App.css";
import { API_URL, useTableDataProcessing } from "./providerHelpers";
 
function ExportHoursContent({ onViewDetails, userId }) {
  const [hours, setHours] = useState([]);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(hours, "title");
 
  useEffect(() => {
    fetchHours();
  }, []);
 
  const fetchHours = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/users/${userId}/volunteer-hours/export`,
      );
      const text = await response.text();
      // Parse CSV response into array
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
    }
  };
 
  const handleExportCSV = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/users/${userId}/volunteer-hours/export`,
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
 
  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <input
          type="text"
          className="form-control me-2"
          placeholder="Search by opportunity title"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="btn-gold" onClick={handleExportCSV}>
          Export CSV
        </button>
      </div>
      <Table hover className="text-center">
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("Opportunity")}
              aria-label="Sort by opportunity">
              Opportunity {sortSymbol("Opportunity")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("Provider")}
              aria-label="Sort by provider">
              Provider {sortSymbol("Provider")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("Start Time")}
              aria-label="Sort by start time">
              Start {sortSymbol("Start Time")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("End Time")}
              aria-label="Sort by end time">
              End {sortSymbol("End Time")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("Hours Worked")}
              aria-label="Sort by hours worked">
              Hours {sortSymbol("Hours Worked")}
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-muted">
                No volunteer hours found.
              </td>
            </tr>
          ) : (
            sortedData.map((entry, index) => (
              <tr key={index} className="text-center align-middle">
                <td>{entry.Opportunity || entry.title}</td>
                <td>{entry.Provider || entry.provider_name}</td>
                <td>{entry["Start Time"] || entry.start_datetime}</td>
                <td>{entry["End Time"] || entry.end_datetime}</td>
                <td>{entry["Hours Worked"] || entry.hours_worked}</td>
                <td>
                  <button
                    className="outline-warning me-2"
                    onClick={() => onViewDetails("exportHours", entry)}
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
 
export default ExportHoursContent;
