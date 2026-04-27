import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Helmet } from "react-helmet";
import "../App.css";
import AdminModal from "../components/AdminModal";
import { API_URL } from "../config";

function Admin({ user, setUser, role, setRole }) {
  const [modalType, setModalType] = useState("");
  const [exportStatus, setExportStatus] = useState("");

  const exportToCSV = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await fetch(`${API_URL}/api/admin/logs`, {
        headers: { "x-user-id": user?.user_id },
      });
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setExportStatus("No log data available to export.");
        return;
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","), // Header row
        ...data.map((row) =>
          headers.map((header) => JSON.stringify(row[header] || "")).join(","),
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `log_data_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportStatus("Log data exported successfully.");
    } catch (error) {
      console.error("Error exporting log data:", error);
      setExportStatus("Failed to export log data. Please try again.");
    }
  };

  return (
    <>
      <Helmet><title>Admin Dashboard | Allies Connect</title></Helmet>
      <Container>
        <div className="text-container mt-5 mb-5">
          <h1>{user?.first_name || "Admin"} Dashboard</h1>
        </div>
        <div className="mb-4">
          <h3 className="border-bottom pb-2 mb-3">Accounts Management</h3>
          <Row className="d-flex">
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("pendingOrgs")}
              >
                Review Pending Organizations
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => setModalType("editAccounts")}
              >
                Edit Accounts
              </button>
            </Col>
          </Row>
        </div>
        <div className="mb-4">
          <h3 className="border-bottom pb-2 mb-3">Review Content</h3>
          <Row className="d-flex">
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("manageResources")}
              >
                Manage Resources
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("manageEvents")}
              >
                Manage Events
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("manageVolunteers")}
              >
                Manage Volunteers
              </button>
            </Col>
          </Row>
        </div>
        <div className="mb-4">
          <h3 className="border-bottom pb-2 mb-3">Reporting</h3>
          <Row className="d-flex">
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("reviewLogData")}
              >
                Review Log Data
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => exportToCSV()}
              >
                Export Log Data
              </button>
            </Col>
          </Row>
        </div>
        <AdminModal
          show={!!modalType}
          type={modalType}
          onHide={() => setModalType("")}
        />
        <div aria-live="polite" aria-atomic="true" className="visually-hidden">
          {exportStatus}
        </div>
      </Container>
    </>
  );
}

export default Admin;
