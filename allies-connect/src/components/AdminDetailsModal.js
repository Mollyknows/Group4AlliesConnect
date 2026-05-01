import axios from "axios";
import { useEffect, useState } from "react";
import { Button, Col, Modal, Row } from "react-bootstrap";
import "../App.css";
import { API_URL } from "../config";
import { getAuthHeaders } from "../utils/auth";

function EditableField({
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
}) {
  return (
    <Row className="text-start mb-3">
      <Col md={4} className="d-flex align-items-center">
        <h5>{label}:</h5>
      </Col>
      <Col md={8}>
        {readOnly ? (
          <p className="mb-0 pt-1">{value || "N/A"}</p>
        ) : (
          <input
            type={type}
            className="form-control"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </Col>
    </Row>
  );
}

function PendingOrgsContent({ data, onSave }) {
  const [form, setForm] = useState({});
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [denialReason, setDenialReason] = useState("");

  useEffect(() => {
    setForm(data || {});
  }, [data]);

  const handleApprove = async () => {
    if (
      !window.confirm(
        "Are you sure you want to approve this organization? This action cannot be undone.",
      )
    )
      return;
    try {
      await axios.patch(
        `${API_URL}/api/admin/providers/${form.provider_id}/approve`,
        {},
        { headers: getAuthHeaders() },
      );
      alert("Organization approved successfully.");
      onSave();
    } catch (error) {
      alert("Error approving organization.");
    }
  };

  const handleReject = async () => {
    if (!denialReason.trim()) {
      alert("Please provide a reason for denying this organization.");
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
        `${API_URL}/api/admin/providers/${form.provider_id}/deny`,
        { denial_reason: denialReason },
        { headers: getAuthHeaders() },
      );
      alert("Organization denied. The applicant will be notified by email.");
      onSave();
    } catch (error) {
      alert("Error denying organization.");
    }
  };

  return (
    <>
      <EditableField label="Organization Name" value={form.name} readOnly />
      <EditableField label="EIN" value={form.ein} readOnly />
      <EditableField label="Phone" value={form.phone_number} readOnly />
      <EditableField
        label="Registrant Email"
        value={form.registrant_email}
        readOnly
      />
      <EditableField
        label="Registrant Name"
        value={
          [form.registrant_first_name, form.registrant_last_name]
            .filter(Boolean)
            .join(" ") || null
        }
        readOnly
      />
      <EditableField
        label="Date Applied"
        value={form.application_date}
        readOnly
      />
      <EditableField label="Status" value={form.status} readOnly />
      {form.application_notes && (
        <Row className="text-start mb-3">
          <Col md={4} className="d-flex align-items-start pt-1">
            <h5>Application Notes:</h5>
          </Col>
          <Col md={8}>
            <p className="mb-0 pt-1" style={{ whiteSpace: "pre-wrap" }}>
              {form.application_notes}
            </p>
          </Col>
        </Row>
      )}
      {showDenyForm && (
        <Row className="text-start mb-3">
          <Col md={4} className="d-flex align-items-start pt-1">
            <h5>Denial Reason:</h5>
          </Col>
          <Col md={8}>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Provide a reason for denying this organization (will be emailed to the applicant)..."
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
            />
          </Col>
        </Row>
      )}
      <Row className="justify-content-end mt-3">
        <Col md={6} className="d-flex gap-2 justify-content-end">
          <Button className="btn-green" onClick={handleApprove}>
            Approve
          </Button>
          {showDenyForm ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDenyForm(false);
                  setDenialReason("");
                }}
              >
                Cancel
              </Button>
              <Button className="btn-red" onClick={handleReject}>
                Confirm Deny
              </Button>
            </>
          ) : (
            <Button className="btn-red" onClick={() => setShowDenyForm(true)}>
              Deny
            </Button>
          )}
        </Col>
      </Row>
    </>
  );
}

function EditAccountsContent({ data, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    setForm(data || {});
  }, [data]);

  const set = (field) => (value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      await axios.put(
        `${API_URL}/api/users/profile/${form.user_id}`,
        {
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          zip_code: form.zip_code,
        },
        { headers: getAuthHeaders() },
      );
      alert("Account updated successfully.");
      onSave();
    } catch (error) {
      alert("Error updating account.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this account? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/accounts/${form.user_id}`, {
        headers: getAuthHeaders(),
      });
      alert("Account deleted successfully.");
      onSave();
    } catch (error) {
      alert("Error deleting account.");
    }
  };

  return (
    <>
      <EditableField label="Email" value={form.email} readOnly />
      <EditableField label="Roles" value={form.roles} readOnly />
      <EditableField
        label="First Name"
        value={form.first_name}
        onChange={set("first_name")}
      />
      <EditableField
        label="Last Name"
        value={form.last_name}
        onChange={set("last_name")}
      />
      <EditableField label="Phone" value={form.phone} onChange={set("phone")} />
      <EditableField
        label="ZIP Code"
        value={form.zip_code}
        onChange={set("zip_code")}
      />
      <Row className="justify-content-end mt-3">
        <Col md={4}>
          <Button
            variant="danger"
            className="w-100 mb-2"
            onClick={handleDelete}
          >
            Delete Account
          </Button>
          <Button className="btn-gold w-100" onClick={handleSave}>
            Save Changes
          </Button>
        </Col>
      </Row>
    </>
  );
}

function ManageResourcesContent({ data, onSave }) {
  const [form, setForm] = useState({});
  // For hours editing
  const [hours, setHours] = useState(() => ({}));

  useEffect(() => {
    setForm(data || {});
    // Parse hours for editing
    let h = data?.hours;
    if (typeof h === "string") {
      try {
        h = JSON.parse(h);
      } catch {
        h = {};
      }
    }
    setHours(h || {});
  }, [data]);

  const set = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "hours") {
      let h = value;
      if (typeof h === "string") {
        try {
          h = JSON.parse(h);
        } catch {
          h = {};
        }
      }
      setHours(h || {});
    }
  };

  // Handle per-day hours change
  const handleHoursChange = (day, field, value) => {
    setHours((prev) => {
      const updated = { ...prev, [day]: { ...prev[day], [field]: value } };
      setForm((f) => ({ ...f, hours: updated }));
      return updated;
    });
  };
  const handleClosedToggle = (day) => {
    setHours((prev) => {
      const updated = {
        ...prev,
        [day]: { ...prev[day], closed: !prev[day]?.closed },
      };
      setForm((f) => ({ ...f, hours: updated }));
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `${API_URL}/api/resources/${form.resource_id}`,
        {
          category_id: form.category_id,
          location_id: form.location_id,
          name: form.name,
          description: form.description,
          hours: JSON.stringify(hours),
          image_url: form.image_url,
          eligibility_requirements: form.eligibility_requirements,
        },
        { headers: getAuthHeaders() },
      );
      alert("Resource updated successfully.");
      onSave();
    } catch (error) {
      alert("Error updating resource.");
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate this resource?")) return;
    try {
      await axios.patch(
        `${API_URL}/api/admin/content/resource/${form.resource_id}`,
        {},
        { headers: getAuthHeaders() },
      );
      alert("Resource deactivated.");
      onSave();
    } catch (error) {
      alert("Error deactivating resource.");
    }
  };

  return (
    <>
      <EditableField label="Resource ID" value={form.resource_id} readOnly />
      <EditableField label="Provider" value={form.provider_name} readOnly />
      <EditableField label="Name" value={form.name} onChange={set("name")} />
      <EditableField
        label="Description"
        value={form.description}
        onChange={set("description")}
      />
      {/* Editable hours table */}
      <div className="mb-3">
        <strong>Hours of Operation</strong>
        <table className="table table-sm mt-2">
          <thead>
            <tr>
              <th>Day</th>
              <th>Closed</th>
              <th>Open</th>
              <th>Close</th>
            </tr>
          </thead>
          <tbody>
            {[
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ].map((day) => {
              const d = hours?.[day] || {};
              return (
                <tr key={day}>
                  <td>{day.charAt(0).toUpperCase() + day.slice(1, 3)}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!d.closed}
                      onChange={() => handleClosedToggle(day)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={d.open || ""}
                      disabled={!!d.closed}
                      onChange={(e) =>
                        handleHoursChange(day, "open", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={d.close || ""}
                      disabled={!!d.closed}
                      onChange={(e) =>
                        handleHoursChange(day, "close", e.target.value)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <EditableField label="Category" value={form.category_name} readOnly />
      <EditableField
        label="Eligibility Requirements"
        value={form.eligibility_requirements}
        onChange={set("eligibility_requirements")}
      />
      <EditableField
        label="Street Address"
        value={`${form.street_address_1 || ""} ${form.street_address_2 || ""}`.trim()}
        readOnly
      />
      <EditableField label="City" value={form.city} readOnly />
      <EditableField label="State" value={form.state} readOnly />
      <EditableField label="ZIP" value={form.zip} readOnly />
      <EditableField
        label="Image URL"
        value={form.image_url}
        onChange={set("image_url")}
      />
      <Row className="justify-content-end mt-3">
        <Col md={4}>
          <Button
            variant="danger"
            className="w-100 mb-2"
            onClick={handleDeactivate}
          >
            Deactivate
          </Button>
          <Button className="btn-gold w-100" onClick={handleSave}>
            Save Changes
          </Button>
        </Col>
      </Row>
    </>
  );
}

function ManageEventsContent({ data, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    setForm(data || {});
  }, [data]);

  const set = (field) => (value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      // Events don't have a PUT route yet — using admin content patch to deactivate
      // Add a PUT /api/events/:id route to your backend for full edits
      alert(
        "Event save not yet implemented — add PUT /api/events/:id to your backend.",
      );
    } catch (error) {
      alert("Error updating event.");
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate this event?")) return;
    try {
      await axios.patch(
        `${API_URL}/api/admin/content/event/${form.event_id}`,
        {},
        { headers: getAuthHeaders() },
      );
      alert("Event deactivated.");
      onSave();
    } catch (error) {
      alert("Error deactivating event.");
    }
  };

  const toDateTimeLocal = (value) => {
    if (!value) return "";
    return value.slice(0, 16); // trims to "yyyy-MM-ddThh:mm"
  };

  return (
    <>
      <EditableField label="Event ID" value={form.event_id} readOnly />
      <EditableField label="Provider" value={form.provider_name} readOnly />
      <EditableField label="Title" value={form.title} onChange={set("title")} />
      <EditableField
        label="Description"
        value={form.description}
        onChange={set("description")}
      />
      <EditableField
        label="Start Date/Time"
        value={toDateTimeLocal(form.start_datetime)}
        onChange={set("start_datetime")}
        type="datetime-local"
      />
      <EditableField
        label="End Date/Time"
        value={toDateTimeLocal(form.end_datetime)}
        onChange={set("end_datetime")}
        type="datetime-local"
      />
      <EditableField label="Category" value={form.category_name} readOnly />
      <EditableField
        label="Registration Required"
        value={form.registration_required}
        onChange={set("registration_required")}
      />
      <EditableField
        label="Special Instructions"
        value={form.special_instructions}
        onChange={set("special_instructions")}
      />
      <EditableField
        label="Street Address"
        value={`${form.street_address_1 || ""} ${form.street_address_2 || ""}`.trim()}
        readOnly
      />
      <EditableField label="City" value={form.city} readOnly />
      <EditableField label="State" value={form.state} readOnly />
      <EditableField label="ZIP" value={form.zip} readOnly />
      <EditableField
        label="Image URL"
        value={form.image_url}
        onChange={set("image_url")}
      />
      <EditableField
        label="Flyer URL"
        value={form.flyer_url}
        onChange={set("flyer_url")}
      />
      <Row className="justify-content-end mt-3">
        <Col md={4}>
          <Button
            variant="danger"
            className="w-100 mb-2"
            onClick={handleDeactivate}
          >
            Deactivate
          </Button>
          <Button className="btn-gold w-100" onClick={handleSave}>
            Save Changes
          </Button>
        </Col>
      </Row>
    </>
  );
}

function ManageVolunteersContent({ data, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    setForm(data || {});
  }, [data]);

  const set = (field) => (value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      await axios.put(
        `${API_URL}/api/volunteer-opportunities/${form.opportunity_id}`,
        {
          location_id: form.location_id,
          event_id: form.event_id,
          resource_id: form.resource_id,
          title: form.title,
          status: form.status,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
        },
        { headers: getAuthHeaders() },
      );
      alert("Volunteer opportunity updated successfully.");
      onSave();
    } catch (error) {
      alert("Error updating volunteer opportunity.");
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate this volunteer opportunity?")) return;
    try {
      await axios.patch(
        `${API_URL}/api/admin/content/opportunity/${form.opportunity_id}`,
        {},
        { headers: getAuthHeaders() },
      );
      alert("Volunteer opportunity deactivated.");
      onSave();
    } catch (error) {
      alert("Error deactivating volunteer opportunity.");
    }
  };

  return (
    <>
      <EditableField
        label="Opportunity ID"
        value={form.opportunity_id}
        readOnly
      />
      <EditableField label="Provider" value={form.provider_name} readOnly />
      <EditableField label="Title" value={form.title} onChange={set("title")} />
      <EditableField
        label="Status"
        value={form.status}
        onChange={set("status")}
      />
      <EditableField
        label="Contact Name"
        value={form.contact_name}
        onChange={set("contact_name")}
      />
      <EditableField
        label="Contact Email"
        value={form.contact_email}
        onChange={set("contact_email")}
      />
      <EditableField
        label="Contact Phone"
        value={form.contact_phone}
        onChange={set("contact_phone")}
      />
      <EditableField label="City" value={form.city} readOnly />
      <EditableField label="State" value={form.state} readOnly />
      <EditableField label="Created At" value={form.created_at} readOnly />
      <Row className="justify-content-end mt-3">
        <Col md={4}>
          <Button className="btn-red mb-2" onClick={handleDeactivate}>
            Deactivate
          </Button>
          <Button className="btn-gold" onClick={handleSave}>
            Save Changes
          </Button>
        </Col>
      </Row>
    </>
  );
}

function ReviewLogDataContent({ data }) {
  if (!data) return <p>No data available.</p>;
  return (
    <>
      <EditableField label="Log ID" value={data.log_id} readOnly />
      <EditableField label="Action" value={data.action} readOnly />
      <EditableField
        label="Actor User ID"
        value={data.actor_user_id}
        readOnly
      />
      <EditableField label="Entity ID" value={data.entity_id} readOnly />
      <EditableField label="Entity Type" value={data.entity_type} readOnly />
      <EditableField label="Occurred At" value={data.occured_at} readOnly />
    </>
  );
}
const MODAL_TYPE = {
  pendingOrgs: {
    title: "Pending Organization Details",
    Content: PendingOrgsContent,
  },
  editAccounts: {
    title: "Edit Account Details",
    Content: EditAccountsContent,
  },
  manageResources: {
    title: "Manage Resource Details",
    Content: ManageResourcesContent,
  },
  manageEvents: {
    title: "Manage Event Details",
    Content: ManageEventsContent,
  },
  manageVolunteers: {
    title: "Manage Volunteer Details",
    Content: ManageVolunteersContent,
  },
  reviewLogData: {
    title: "Log Data Details",
    Content: ReviewLogDataContent,
  },
};

function AdminDetailsModal({ show, onHide, type, data, onRefresh }) {
  const config = MODAL_TYPE[type];

  const handleSave = () => {
    onHide();
    if (onRefresh) onRefresh();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{config?.title || ""}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {config && <config.Content data={data} onSave={handleSave} />}
      </Modal.Body>
    </Modal>
  );
}

export default AdminDetailsModal;
