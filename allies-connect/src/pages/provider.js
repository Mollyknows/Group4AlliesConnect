import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Helmet } from "react-helmet";
import "../App.css";
import ProviderModal from "../components/provider/ProviderModal";
import { API_URL } from "../components/provider/providerHelpers";

function Provider({ user, setUser, role, setRole }) {
  const [modalType, setModalType] = useState("");
  const [providerName, setProviderName] = useState("");

  useEffect(() => {
    async function fetchProvider() {
      try {
        if (!user?.provider_id) return;
        const resp = await fetch(
          `${API_URL}/api/organizations/profile/${user.provider_id}`,
        );
        if (!resp.ok) return;
        const data = await resp.json();
        setProviderName(data?.name || "");
      } catch (err) {
        console.error("Error fetching provider profile:", err);
      }
    }

    fetchProvider();
  }, [user]);

  return (
    <>
      <Helmet>
        <title>Provider Dashboard | Allies Connect</title>
      </Helmet>
      <Container className="provider-container">
        <div className="text-container mt-5 mb-5">
          <h1>{providerName || "Provider"} Dashboard</h1>
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <strong>
              {user
                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                : ""}
            </strong>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="border-bottom pb-2 mb-3">Events</h3>
          <Row className="d-flex">
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("createEvent")}
              >
                Create Event
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => setModalType("editEvents")}
              >
                Edit Events
              </button>
            </Col>
          </Row>
        </div>
        <div className="mb-4">
          <h3 className="border-bottom pb-2 mb-3">Resources</h3>
          <Row className="d-flex">
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("createResource")}
              >
                Create Resource
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => setModalType("editResources")}
              >
                Edit Resource
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => setModalType("volunteerShifts")}
              >
                Volunteer Shift Management
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => setModalType("volunteerApproval")}
              >
                Volunteer Approval
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
                onClick={() => setModalType("exportHours")}
              >
                Export Volunteer Hours
              </button>
            </Col>
          </Row>
        </div>
        <div className="mb-4">
          <h3 className="border-bottom pb-2 mb-3">Organization Accounts</h3>
          <Row className="d-flex">
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("sendInvite")}
              >
                Send Invite
              </button>
            </Col>
          </Row>
        </div>
        <ProviderModal
          show={!!modalType}
          type={modalType}
          providerId={user?.provider_id}
          userId={user?.user_id}
          onHide={() => setModalType("")}
        />
      </Container>
    </>
  );
}

export default Provider;
