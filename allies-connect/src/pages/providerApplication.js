import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import { API_URL } from "../config";

function ProviderApplication() {
  const location = useLocation();
  const navigate = useNavigate();
  const providerId = location.state?.provider_id;

  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // If we landed here without a provider_id (e.g. direct navigation), redirect away
  if (!providerId) {
    return (
      <Container className="login-container">
        <div className="text-container mb-5">
          <h1>Nothing to see here.</h1>
          <p>
            Please <a href="/register">register</a> your organization first.
          </p>
        </div>
      </Container>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(
        `${API_URL}/api/organizations/${providerId}/application-notes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ application_notes: notes }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting application notes:", err);
      setError("An error occurred. Please try again.");
    }
  };

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Application Submitted | Allies Connect</title>
        </Helmet>
        <Container className="login-container">
          <div className="text-container mb-5">
            <h1>Application Submitted!</h1>
          </div>
          <div className="feature-box text-center">
            <p className="mb-4" style={{ fontSize: "1.1rem" }}>
              Thank you for your interest in being hosted on Allies Connect.
              Once your organization has been approved you will receive an
              email, notifying you that you can start using the service.
            </p>
            <Button className="btn-gold" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Complete Your Application | Allies Connect</title>
      </Helmet>
      <Container className="register-container">
        <div className="text-container mb-5">
          <h1>Complete Your Application</h1>
        </div>
        <div className="feature-box">
          <div className="text-container mb-4">
            <h2>Tell Us About Your Organization</h2>
            <p>
              Your account has been created. Before we can activate it, please
              tell us a bit about yourself and why you would like to use Allies
              Connect. An administrator will review your application and notify
              you by email once it has been approved.
            </p>
          </div>
          <Form onSubmit={handleSubmit}>
            <Row className="text-start mb-4">
              <Col>
                <Form.Group>
                  <Form.Label>
                    <h5>
                      About Your Organization &amp; Why You&apos;d Like to Use
                      Allies Connect
                    </h5>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    placeholder="Please describe your organization's mission, the services you provide, and how Allies Connect will help you connect with volunteers..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            {error && <p className="text-danger mb-3">{error}</p>}
            <Row className="justify-content-end">
              <Col md={4}>
                <Button
                  type="submit"
                  className="btn-gold w-100"
                  disabled={!notes.trim()}
                >
                  Submit Application
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </Container>
    </>
  );
}

export default ProviderApplication;
