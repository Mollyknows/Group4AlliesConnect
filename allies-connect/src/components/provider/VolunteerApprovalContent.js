import axios from "axios";
import { useEffect, useState } from "react";
import { Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import "../../App.css";
import { API_URL } from "./providerHelpers";

/**
 * VolunteerApprovalContent
 *
 * Shown inside the ProviderModal under the "Volunteer Approval" section.
 * Lets the provider:
 *  - Pick one of their resources
 *  - View the volunteer application queue (pending applications)
 *  - View each applicant's details and approve or deny them
 *  - Edit the custom application prompt volunteers see when applying
 */
function VolunteerApprovalContent({ providerId, userId }) {
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [queue, setQueue] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // connection_id being acted on

  // Detail modal state
  const [detailApplicant, setDetailApplicant] = useState(null);

  // Prompt editor modal state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptMsg, setPromptMsg] = useState("");

  // ── Load provider's resources ──────────────────────────────────────
  useEffect(() => {
    if (!providerId) return;
    setLoadingResources(true);
    axios
      .get(`${API_URL}/api/resources`, { params: { provider_id: providerId } })
      .then((res) => {
        // Filter to only this provider's resources
        const mine = (res.data || []).filter(
          (r) => String(r.provider_id) === String(providerId),
        );
        setResources(mine);
      })
      .catch((err) => console.error("Error fetching resources:", err))
      .finally(() => setLoadingResources(false));
  }, [providerId]);

  // ── Load volunteer queue when resource changes ─────────────────────
  useEffect(() => {
    if (!selectedResourceId) {
      setQueue([]);
      return;
    }
    fetchQueue(selectedResourceId);
  }, [selectedResourceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchQueue = async (resourceId) => {
    setLoadingQueue(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/resources/${resourceId}/volunteer-queue`,
        { headers: { "x-user-id": userId } },
      );
      setQueue(res.data || []);
    } catch (err) {
      console.error("Error fetching volunteer queue:", err);
    } finally {
      setLoadingQueue(false);
    }
  };

  // ── Approve ────────────────────────────────────────────────────────
  const handleApprove = async (connectionId) => {
    setActionLoading(connectionId);
    try {
      await axios.put(
        `${API_URL}/api/resource-connections/${connectionId}/approve`,
        {},
        { headers: { "x-user-id": userId } },
      );
      setQueue((prev) => prev.filter((a) => a.connection_id !== connectionId));
      if (detailApplicant?.connection_id === connectionId)
        setDetailApplicant(null);
    } catch (err) {
      console.error("Error approving volunteer:", err);
      alert("Failed to approve volunteer. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Deny ───────────────────────────────────────────────────────────
  const handleDeny = async (connectionId) => {
    setActionLoading(connectionId);
    try {
      await axios.put(
        `${API_URL}/api/resource-connections/${connectionId}/deny`,
        {},
        { headers: { "x-user-id": userId } },
      );
      setQueue((prev) => prev.filter((a) => a.connection_id !== connectionId));
      if (detailApplicant?.connection_id === connectionId)
        setDetailApplicant(null);
    } catch (err) {
      console.error("Error denying volunteer:", err);
      alert("Failed to deny volunteer. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Open prompt editor ─────────────────────────────────────────────
  const handleOpenPromptEditor = async () => {
    if (!selectedResourceId) return;
    setPromptMsg("");
    try {
      const res = await axios.get(
        `${API_URL}/api/resources/${selectedResourceId}/application-prompt`,
      );
      setPromptText(res.data.prompt || "");
    } catch {
      setPromptText("");
    }
    setShowPromptModal(true);
  };

  const handleSavePrompt = async () => {
    setPromptSaving(true);
    setPromptMsg("");
    try {
      await axios.put(
        `${API_URL}/api/resources/${selectedResourceId}/application-prompt`,
        { prompt: promptText },
        { headers: { "x-user-id": userId } },
      );
      setPromptMsg("Prompt saved successfully.");
    } catch (err) {
      console.error("Error saving prompt:", err);
      setPromptMsg("Failed to save. Please try again.");
    } finally {
      setPromptSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (loadingResources) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <p className="text-muted mt-3">
        You have no resources yet. Create a resource first.
      </p>
    );
  }

  return (
    <div>
      {/* Resource selector */}
      <Form.Group className="mb-3">
        <Form.Label>
          <strong>Select Resource</strong>
        </Form.Label>
        <Form.Select
          value={selectedResourceId}
          onChange={(e) => setSelectedResourceId(e.target.value)}
        >
          <option value="">— Choose a resource —</option>
          {resources.map((r) => (
            <option key={r.resource_id} value={r.resource_id}>
              {r.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {selectedResourceId && (
        <>
          {/* Edit Application Prompt button */}
          <div className="d-flex justify-content-end mb-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleOpenPromptEditor}
            >
              ✏️ Edit Application Prompt
            </Button>
          </div>

          {/* Volunteer queue table */}
          {loadingQueue ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Loading queue…</span>
            </div>
          ) : queue.length === 0 ? (
            <p className="text-muted">
              No pending volunteer applications for this resource.
            </p>
          ) : (
            <Table bordered hover responsive size="sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Applied</th>
                  <th style={{ width: "100px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((applicant) => (
                  <tr key={applicant.connection_id}>
                    <td>
                      {applicant.first_name} {applicant.last_name}
                    </td>
                    <td>{applicant.username}</td>
                    <td>{applicant.email}</td>
                    <td>
                      {new Date(applicant.date_changed).toLocaleDateString()}
                    </td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => setDetailApplicant(applicant)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}

      {/* ── Applicant detail modal ─────────────────────────────────── */}
      <Modal
        show={!!detailApplicant}
        onHide={() => setDetailApplicant(null)}
        centered
        size="lg"
      >
        {detailApplicant && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                Volunteer Application — {detailApplicant.first_name}{" "}
                {detailApplicant.last_name}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <dl className="row" style={{ fontSize: "14px" }}>
                <dt className="col-sm-3">Name</dt>
                <dd className="col-sm-9">
                  {detailApplicant.first_name} {detailApplicant.last_name}
                </dd>

                <dt className="col-sm-3">Username</dt>
                <dd className="col-sm-9">{detailApplicant.username}</dd>

                <dt className="col-sm-3">Email</dt>
                <dd className="col-sm-9">{detailApplicant.email}</dd>

                <dt className="col-sm-3">Phone</dt>
                <dd className="col-sm-9">{detailApplicant.phone || "—"}</dd>

                <dt className="col-sm-3">ZIP Code</dt>
                <dd className="col-sm-9">{detailApplicant.zip_code || "—"}</dd>

                <dt className="col-sm-3">Applied On</dt>
                <dd className="col-sm-9">
                  {new Date(detailApplicant.date_changed).toLocaleString()}
                </dd>
              </dl>

              <hr />

              <h6>Application Response</h6>
              <div
                style={{
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  padding: "12px",
                  fontSize: "14px",
                  whiteSpace: "pre-wrap",
                  minHeight: "80px",
                }}
              >
                {detailApplicant.application_text?.trim() ? (
                  detailApplicant.application_text
                ) : (
                  <em style={{ color: "#888" }}>No response provided.</em>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setDetailApplicant(null)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                disabled={actionLoading === detailApplicant.connection_id}
                onClick={() => handleDeny(detailApplicant.connection_id)}
              >
                {actionLoading === detailApplicant.connection_id
                  ? "Processing…"
                  : "Deny"}
              </Button>
              <Button
                variant="success"
                disabled={actionLoading === detailApplicant.connection_id}
                onClick={() => handleApprove(detailApplicant.connection_id)}
              >
                {actionLoading === detailApplicant.connection_id
                  ? "Processing…"
                  : "Approve"}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ── Application prompt editor modal ───────────────────────── */}
      <Modal
        show={showPromptModal}
        onHide={() => setShowPromptModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Application Prompt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: "13px", color: "#555" }}>
            This text is shown to volunteers when they click "Volunteer With
            This Resource" for the first time. Use it to tell them what
            information to provide in their application.
          </p>
          <Form.Control
            as="textarea"
            rows={5}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="e.g. Please describe any relevant experience you have and your available days."
          />
          {promptMsg && (
            <p
              className="mt-2 mb-0"
              style={{
                fontSize: "13px",
                color: promptMsg.startsWith("Failed") ? "red" : "green",
              }}
            >
              {promptMsg}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPromptModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleSavePrompt}
            disabled={promptSaving}
          >
            {promptSaving ? "Saving…" : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default VolunteerApprovalContent;
