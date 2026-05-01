import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

/**
 * VolunteerApplicationModal
 *
 * Shown to a volunteer when they click "Volunteer With This Resource"
 * for the first time (or after being denied and re-applying).
 *
 * Props:
 *  show          - boolean
 *  onHide        - called when modal is dismissed
 *  promptText    - custom text set by the provider (may be empty)
 *  resourceName  - displayed in the modal title
 *  onSubmit(text) - called with the volunteer's typed response
 *  loading       - boolean, disables the submit button while the POST is in flight
 */
function VolunteerApplicationModal({
  show,
  onHide,
  promptText,
  resourceName,
  onSubmit,
  loading,
}) {
  const [applicationText, setApplicationText] = useState("");

  const handleSubmit = () => {
    onSubmit(applicationText);
  };

  const handleHide = () => {
    setApplicationText("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Volunteer Application — {resourceName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {promptText?.trim() ? (
          <p
            style={{ fontSize: "14px", color: "#333", whiteSpace: "pre-wrap" }}
          >
            {promptText}
          </p>
        ) : (
          <p style={{ fontSize: "14px", color: "#555" }}>
            Please tell us a little about yourself and why you'd like to
            volunteer with this resource.
          </p>
        )}
        <Form.Control
          as="textarea"
          rows={5}
          placeholder="Your response…"
          value={applicationText}
          onChange={(e) => setApplicationText(e.target.value)}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleHide} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="info"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: "#0097a7",
            borderColor: "#0097a7",
            color: "white",
          }}
        >
          {loading ? "Submitting…" : "Submit Application"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default VolunteerApplicationModal;
