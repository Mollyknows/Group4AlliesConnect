import axios from "axios";
import { useEffect, useState } from "react";
import { Modal, Table } from "react-bootstrap";
import "../App.css";
import { API_URL } from "../config";
import { getAuthHeaders } from "../utils/auth";
import AdminDetailsModal from "./AdminDetailsModal";

function useTableDataProcessing(data, searchFields) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const sortSymbol = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? " ▲" : " ▼";
    }
    return "  ";
  };

  const sortedData = [...data]
    .filter((item) =>
      searchFields.some((field) =>
        String(item[field] ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      ),
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      return sortConfig.direction === "asc"
        ? String(a[sortConfig.key] ?? "").localeCompare(
            String(b[sortConfig.key] ?? ""),
          )
        : String(b[sortConfig.key] ?? "").localeCompare(
            String(a[sortConfig.key] ?? ""),
          );
    });

  return { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery };
}

function PendingOrgsContent({ onViewDetails }) {
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(pendingOrgs, [
      "name",
      "registrant_email",
      "application_date",
      "ein",
    ]);

  useEffect(() => {
    fetchPendingOrgs();
  }, []);

  const fetchPendingOrgs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pending-providers`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setPendingOrgs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching pending organizations:", error);
      alert("Error fetching pending organizations.");
      setPendingOrgs([]);
    }
  };

  const handleApprove = async (orgId) => {
    if (
      !window.confirm(
        "Are you sure you want to approve this organization? This action cannot be undone.",
      )
    )
      return;
    try {
      await axios.patch(
        `${API_URL}/api/admin/providers/${orgId}/approve`,
        {},
        { headers: getAuthHeaders() },
      );
      alert("Organization approved successfully.");
      fetchPendingOrgs();
    } catch (error) {
      console.error("Error approving organization:", error);
      alert("Error approving organization.");
    }
  };

  const handleReject = async (orgId) => {
    const reason = window.prompt(
      "Please provide a reason for denying this organization (will be emailed to the applicant):",
    );
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert("A denial reason is required.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to deny this organization? This action cannot be undone.",
      )
    )
      return;
    try {
      await axios.patch(
        `${API_URL}/api/admin/providers/${orgId}/deny`,
        { denial_reason: reason },
        { headers: getAuthHeaders() },
      );
      alert("Organization denied. The applicant will be notified by email.");
      fetchPendingOrgs();
    } catch (error) {
      console.error("Error denying organization:", error);
      alert("Error denying organization.");
    }
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by name, email, date, or EIN"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr className="text-center">
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("name")}
              aria-label="Sort by organization name"
            >
              Organization {sortSymbol("name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("registrant_email")}
              aria-label="Sort by email"
            >
              Registrant Email {sortSymbol("registrant_email")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("application_date")}
              aria-label="Sort by application date"
            >
              Application Date {sortSymbol("application_date")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("ein")}
              aria-label="Sort by EIN"
            >
              EIN {sortSymbol("ein")}
            </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((org) => (
            <tr key={org.provider_id} className="text-center align-middle">
              <td>{org.name || "N/A"}</td>
              <td>{org.registrant_email || "N/A"}</td>
              <td>{org.application_date || "N/A"}</td>
              <td>{org.ein || "N/A"}</td>
              <td>
                <button
                  className="outline-warning me-2"
                  onClick={() => onViewDetails("pendingOrgs", org)}
                >
                  View Full Application
                </button>
                <button
                  className="btn-green me-2"
                  onClick={() => handleApprove(org.provider_id)}
                >
                  Approve
                </button>
                <button
                  className="btn-red"
                  onClick={() => handleReject(org.provider_id)}
                >
                  Deny
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

function EditAccountsContent({ onViewDetails }) {
  const [accounts, setAccounts] = useState([]);
  const [inviteMode, setInviteMode] = useState("");
  const [providerInvite, setProviderInvite] = useState({
    email: "",
    ein: "",
  });
  const [adminInviteEmail, setAdminInviteEmail] = useState("");
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(accounts, ["name", "email", "roles"]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const isValidEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidEINFormat = (ein) => {
    const einRegex = /^\d{2}-\d{7}$/;
    return einRegex.test(ein);
  };

  const hasNineDigits = (ein) => {
    const digits = ein.replace(/\D/g, "");
    return digits.length === 9;
  };

  const formatEIN = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/accounts`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `Failed with status ${response.status}`,
        );
      }
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      alert(`Error fetching accounts: ${error.message || "Unknown error"}`);
      setAccounts([]);
    }
  };

  const sendProviderInvite = async () => {
    if (!providerInvite.email || !providerInvite.ein) {
      alert("Email and EIN are required.");
      return;
    }
    if (!isValidEmailFormat(providerInvite.email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!isValidEINFormat(providerInvite.ein)) {
      alert("Please enter EIN in the format XX-XXXXXXX.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/provider-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          email: providerInvite.email,
          ein: providerInvite.ein,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to send provider invite.");
        return;
      }

      alert("Provider invite sent successfully.");
      setProviderInvite({ email: "", ein: "" });
      setInviteMode("");
    } catch (error) {
      console.error("Error sending provider invite:", error);
      alert("Failed to send provider invite.");
    }
  };

  const sendAdminInvite = async () => {
    if (!adminInviteEmail) {
      alert("Email is required.");
      return;
    }
    if (!isValidEmailFormat(adminInviteEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/admin-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ email: adminInviteEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to send admin invite.");
        return;
      }

      alert("Admin invite sent successfully.");
      setAdminInviteEmail("");
      setInviteMode("");
    } catch (error) {
      console.error("Error sending admin invite:", error);
      alert("Failed to send admin invite.");
    }
  };

  const providerInviteEinIsValid = isValidEINFormat(providerInvite.ein);
  const providerInviteEinHasNineDigits = hasNineDigits(providerInvite.ein);

  return (
    <>
      <div className="mb-3 d-flex gap-2">
        <button
          className="outline-warning"
          onClick={() =>
            setInviteMode((prev) =>
              prev === "providerInvite" ? "" : "providerInvite",
            )
          }
        >
          Provider Invite
        </button>
        <button
          className="outline-warning"
          onClick={() =>
            setInviteMode((prev) =>
              prev === "adminInvite" ? "" : "adminInvite",
            )
          }
        >
          Admin Invite
        </button>
      </div>

      {inviteMode === "providerInvite" && (
        <div className="p-3 border rounded mb-3">
          <h5 className="mb-3">Send Provider Invite</h5>
          <div className="row g-2">
            <div className="col-md-5">
              <input
                type="email"
                className="form-control"
                placeholder="Invitee email"
                value={providerInvite.email}
                onChange={(e) =>
                  setProviderInvite((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className={`form-control ${
                  providerInviteEinIsValid
                    ? "is-valid"
                    : providerInvite.ein && providerInviteEinHasNineDigits
                      ? "is-invalid"
                      : ""
                }`}
                placeholder="EIN (XX-XXXXXXX)"
                value={providerInvite.ein}
                onChange={(e) =>
                  setProviderInvite((prev) => ({
                    ...prev,
                    ein: formatEIN(e.target.value),
                  }))
                }
              />
              {providerInviteEinIsValid && (
                <div className="text-success small mt-1">
                  EIN format valid ✓
                </div>
              )}
              {providerInvite.ein &&
                providerInviteEinHasNineDigits &&
                !providerInviteEinIsValid && (
                  <div className="text-danger small mt-1">
                    EIN must be in the format XX-XXXXXXX (9 digits)
                  </div>
                )}
            </div>
            <div className="col-md-3 d-grid">
              <button
                className={
                  providerInviteEinIsValid ? "btn-green" : "btn-secondary"
                }
                onClick={sendProviderInvite}
                disabled={!providerInviteEinIsValid}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteMode === "adminInvite" && (
        <div className="p-3 border rounded mb-3">
          <h5 className="mb-3">Send Admin Invite</h5>
          <div className="row g-2">
            <div className="col-md-9">
              <input
                type="email"
                className="form-control"
                placeholder="Invitee email"
                value={adminInviteEmail}
                onChange={(e) => setAdminInviteEmail(e.target.value)}
              />
            </div>
            <div className="col-md-3 d-grid">
              <button className="btn-green" onClick={sendAdminInvite}>
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by name, email, or roles"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr className="text-center">
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("name")}
              aria-label="Sort by organization name"
            >
              Name {sortSymbol("name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("email")}
              aria-label="Sort by email"
            >
              Email {sortSymbol("email")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("roles")}
              aria-label="Sort by roles"
            >
              Roles {sortSymbol("roles")}
            </th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((account) => (
            <tr key={account.username} className="text-center align-middle">
              <td>{account.name || "N/A"}</td>
              <td>{account.email || "N/A"}</td>
              <td>{account.roles || "N/A"}</td>
              <td>
                <button
                  className="outline-warning me-2"
                  onClick={() => onViewDetails("editAccounts", account)}
                >
                  View Account Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

function ManageResourcesContent({ onViewDetails }) {
  const [resources, setResources] = useState([]);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(resources, [
      "name",
      "provider_name",
      "category_name",
      "city",
      "state",
    ]);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_URL}/api/resources`);
      const data = await response.json();
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      alert("Error fetching resources.");
      setResources([]);
    }
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by name, location, or organization"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr className="text-center">
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("name")}
              aria-label="Sort by organization name"
            >
              Name {sortSymbol("name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("zip")}
              aria-label="Sort by zip code"
            >
              Zip Code {sortSymbol("zip")}
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
              onClick={() => handleSort("category_name")}
              aria-label="Sort by category"
            >
              Category {sortSymbol("category_name")}
            </th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={6}>No results found.</td>
            </tr>
          ) : (
            sortedData.map((resource) => (
              <tr key={resource.resource_id} className="align-middle">
                <td>{resource.name}</td>
                <td>{resource.zip}</td>
                <td>{resource.provider_name}</td>
                <td>{resource.category_name}</td>
                <td>
                  <button
                    className="outline-warning me-2"
                    onClick={() => onViewDetails("manageResources", resource)}
                  >
                    View Resource Details
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

function ManageEventsContent({ onViewDetails }) {
  const [events, setEvents] = useState([]);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(events, [
      "title",
      "provider_name",
      "category_name",
      "city",
    ]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching events:", error);
      alert("Error fetching events.");
      setEvents([]);
    }
  };

  const formatDisplayDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleString("en-US", {
      timeZone: "UTC",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by name, location, or organization"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr className="text-center">
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("title")}
              aria-label="Sort by title"
            >
              Title {sortSymbol("title")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("zip")}
              aria-label="Sort by zip code"
            >
              Zip Code {sortSymbol("zip")}
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
              onClick={() => handleSort("start_datetime")}
              aria-label="Sort by start time"
            >
              Start Time {sortSymbol("start_datetime")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("category_name")}
              aria-label="Sort by category"
            >
              Category {sortSymbol("category_name")}
            </th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={6}>No results found.</td>
            </tr>
          ) : (
            sortedData.map((event) => (
              <tr key={event.event_id} className="align-middle">
                <td>{event.title}</td>
                <td>{event.provider_name}</td>
                <td>{event.category_name}</td>
                <td>{formatDisplayDateTime(event.start_datetime)}</td>
                <td>{event.category_name}</td>
                <td>
                  <button
                    className="outline-warning me-2"
                    onClick={() => onViewDetails("manageEvents", event)}
                  >
                    View Event Details
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

function ManageVolunteersContent({ onViewDetails }) {
  const [volunteers, setVolunteers] = useState([]);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(volunteers, [
      "title",
      "provider_name",
      "status",
      "contact_name",
      "contact_email",
    ]);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/volunteer-opportunities`);
      const data = await response.json();
      setVolunteers(Array.isArray(data) ? data : []);
    } catch (error) {
      setVolunteers([]);
    }
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by title, provider, or status"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("title")}
              aria-label="Sort by title"
            >
              Title {sortSymbol("title")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("provider_name")}
              aria-label="Sort by organization"
            >
              Provider {sortSymbol("provider_name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("status")}
              aria-label="Sort by status"
            >
              Status {sortSymbol("status")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("contact_name")}
              aria-label="Sort by contact"
            >
              Contact {sortSymbol("contact_name")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("contact_email")}
              aria-label="Sort by email"
            >
              Email {sortSymbol("contact_email")}
            </th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={6}>No results found.</td>
            </tr>
          ) : (
            sortedData.map((volunteer) => (
              <tr key={volunteer.opportunity_id} className="align-middle">
                <td>{volunteer.title}</td>
                <td>{volunteer.provider_name}</td>
                <td>{volunteer.status}</td>
                <td>{volunteer.contact_name}</td>
                <td>{volunteer.contact_email}</td>
                <td>
                  <button
                    className="outline-warning me-2"
                    onClick={() => onViewDetails("manageVolunteers", volunteer)}
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

function ReviewLogDataContent({ onViewDetails }) {
  const [logs, setLogs] = useState([]);
  const { sortedData, handleSort, sortSymbol, searchQuery, setSearchQuery } =
    useTableDataProcessing(logs, [
      "action",
      "entity_type",
      "actor_user_id",
      "occured_at",
    ]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/logs`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
      console.log("Fetched resources:", data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      alert("Error fetching logs.");
      setLogs([]);
    }
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by name, email, date, or message"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Table hover className="text-center">
        <thead>
          <tr className="text-center">
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("log_id")}
              aria-label="Sort by log ID"
            >
              Log ID {sortSymbol("log_id")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("action")}
              aria-label="Sort by action"
            >
              Action {sortSymbol("action")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("actor_user_id")}
              aria-label="Sort by actor user ID"
            >
              Actor User ID {sortSymbol("actor_user_id")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("entity_type")}
              aria-label="Sort by entity type"
            >
              Entity Type {sortSymbol("entity_type")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => handleSort("occured_at")}
              aria-label="Sort by date"
            >
              Date {sortSymbol("occured_at")}
            </th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((log) => (
            <tr key={log.log_id} className="text-center align-middle">
              <td>{log.log_id || "N/A"}</td>
              <td>{log.action || "N/A"}</td>
              <td>{log.actor_user_id || "N/A"}</td>
              <td>{log.entity_type || "N/A"}</td>
              <td>{log.occured_at || "N/A"}</td>
              <td>
                <button
                  className="outline-warning me-2"
                  onClick={() => onViewDetails("reviewLogData", log)}
                >
                  View Log Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

const MODAL_TYPE = {
  pendingOrgs: {
    title: "Pending Organizations",
    Content: PendingOrgsContent,
  },
  editAccounts: {
    title: "Edit Accounts",
    Content: EditAccountsContent,
  },
  manageResources: {
    title: "Manage Resources",
    Content: ManageResourcesContent,
  },
  manageEvents: {
    title: "Manage Events",
    Content: ManageEventsContent,
  },
  manageVolunteers: {
    title: "Manage Volunteers",
    Content: ManageVolunteersContent,
  },
  reviewLogData: {
    title: "Review Log Data",
    Content: ReviewLogDataContent,
  },
};

function AdminModal({ show, onHide, type }) {
  const [detailModalType, setDetailModalType] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const [refreshCallback, setRefreshCallback] = useState({ fn: null });
  const config = MODAL_TYPE[type];

  const handleViewDetails = (detailType, data, onRefresh) => {
    setSelectedData(data);
    setDetailModalType(detailType);
    setRefreshCallback({ fn: onRefresh });
  };

  return (
    <Modal show={show} className="modal-wide" onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{config?.title || ""}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {config && <config.Content onViewDetails={handleViewDetails} />}
      </Modal.Body>
      <AdminDetailsModal
        show={!!detailModalType}
        type={detailModalType}
        data={selectedData}
        onRefresh={refreshCallback.fn}
        onHide={() => {
          setDetailModalType("");
          setSelectedData(null);
        }}
      />
    </Modal>
  );
}

export default AdminModal;
