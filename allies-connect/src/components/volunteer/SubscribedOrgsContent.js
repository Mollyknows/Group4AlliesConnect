import { useEffect, useState } from "react";
import { Badge, Table } from "react-bootstrap";
import { API_URL, useTableDataProcessing } from "./volunteerHelpers";

function SubscribedOrgsContent({ onViewDetails, userId }) {
  const [connections, setConnections] = useState([]);
  const [togglingId, setTogglingId] = useState(null);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(connections, "resource_name");

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/users/${userId}/resource-connections`,
      );
      const data = await response.json();
      setConnections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching resource connections:", error);
      setConnections([]);
    }
  };

  const handleToggle = async (conn) => {
    setTogglingId(conn.connection_id);
    try {
      const action = conn.active ? "deactivate" : "activate";
      await fetch(
        `${API_URL}/api/resource-connections/${conn.connection_id}/${action}`,
        { method: "PUT" },
      );
      setConnections((prev) =>
        prev.map((c) =>
          c.connection_id === conn.connection_id
            ? { ...c, active: !c.active }
            : c,
        ),
      );
    } catch (error) {
      console.error("Error toggling volunteer status:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by resource name"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("resource_name")}
              aria-label="Sort by resource name"
            >
              Resource {sortSymbol("resource_name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("provider_name")}
              aria-label="Sort by organization"
            >
              Organization {sortSymbol("provider_name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("active")}
              aria-label="Sort by status"
            >
              Status {sortSymbol("active")}
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-muted">
                You haven't registered with any resources yet.
              </td>
            </tr>
          ) : (
            sortedData.map((conn) => (
              <tr key={conn.connection_id} className="text-center align-middle">
                <td>{conn.resource_name}</td>
                <td>{conn.provider_name}</td>
                <td>
                  {conn.status === "pending" ? (
                    <Badge bg="warning" text="dark">
                      Pending Approval
                    </Badge>
                  ) : conn.status === "denied" ? (
                    <Badge bg="danger">Denied</Badge>
                  ) : conn.active ? (
                    <Badge bg="success">Active</Badge>
                  ) : (
                    <Badge bg="secondary">Inactive</Badge>
                  )}
                </td>
                <td>
                  {conn.status === "pending" ? (
                    <span className="text-muted" style={{ fontSize: "13px" }}>
                      Awaiting review
                    </span>
                  ) : conn.status === "denied" ? (
                    <span className="text-muted" style={{ fontSize: "13px" }}>
                      Application denied
                    </span>
                  ) : (
                    <button
                      className={conn.active ? "outline-warning" : "btn-gold"}
                      disabled={togglingId === conn.connection_id}
                      onClick={() => handleToggle(conn)}
                    >
                      {togglingId === conn.connection_id
                        ? "Updating…"
                        : conn.active
                          ? "Stop Volunteering"
                          : "Resume Volunteering"}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );
}

export default SubscribedOrgsContent;
