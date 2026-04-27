import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import "../App.css";
import VolunteerModal from "../components/volunteer/VolunteerModal";

function Volunteer({ user, setUser, role, setRole }) {
  const [modalType, setModalType] = useState("");
  const navigate = useNavigate();

  return (
    <>
      <Helmet><title>Volunteer Dashboard | Allies Connect</title></Helmet>
      <Container className="volunteer-container">
        <div className="text-container mt-5 mb-5">
          <h1>{user?.first_name || "Volunteer"} Dashboard</h1>
        </div>
        <div className="mb-4">
          <h3 className="border-bottom pb-2 mb-3">Manage Volunteer Status</h3>
          <Row className="d-flex">
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("subscribedOrgs")}
              >
                Manage Subscribed Organizations
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => setModalType("editAvailability")}
              >
                Edit Availability
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => setModalType("contactInfo")}
              >
                Contact Information
              </button>
            </Col>
          </Row>
        </div>
        <div className="mb-4">
          <h3 className="border-bottom pb-2 mb-3">Signup Management</h3>
          <Row className="d-flex">
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-gold flex-grow-1"
                onClick={() => setModalType("reviewSignups")}
              >
                Review Event Signups
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => setModalType("viewShifts")}
              >
                View Shifts
              </button>
            </Col>
            <Col md={5} className="d-flex mb-2">
              <button
                className="btn-white flex-grow-1"
                onClick={() => navigate("/events")}
              >
                View Volunteer Opportunities
              </button>
            </Col>
          </Row>
        </div>
        <div className="mb-4">
          <h3 className="border-bottom pb-2 mb-3">Export Volunteer Data</h3>
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
        <VolunteerModal
          show={!!modalType}
          type={modalType}
          userId={user?.user_id}
          onHide={() => setModalType("")}
        />
      </Container>
    </>
  );
}

export default Volunteer;
