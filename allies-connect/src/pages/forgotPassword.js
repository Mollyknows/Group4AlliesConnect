import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import "../App.css";
import { API_URL } from "../config";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Error requesting password reset:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Password Reset | Allies Connect</title></Helmet>
      <Container className="login-container">
        <div className="text-container mb-5">
          <h1>Forgot Password</h1>
        </div>
        <div className="feature-box">
          {submitted ? (
            <div className="text-center">
              <h3 className="mb-3">Check Your Email</h3>
              <p>
                If an account with that email exists, we've sent a password reset
                link to <strong>{email}</strong>.
              </p>
              <p className="text-muted">
                The link will expire in 1 hour. Be sure to check your spam folder.
              </p>
              <Button
                className="btn-gold mt-3"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-container mb-4">
                <p>
                  Enter the email address associated with your account and we'll
                  send you a link to reset your password.
                </p>
                {error && <p className="text-danger">{error}</p>}
              </div>
              <Form onSubmit={handleSubmit}>
                <Row className="text-start mb-4 justify-content-center">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>
                        <h5>Email Address</h5>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="justify-content-center">
                  <Col md={4}>
                    <Button
                      className="btn-gold w-100"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Sending…" : "Send Reset Link"}
                    </Button>
                  </Col>
                </Row>
                <Row className="justify-content-center mt-3">
                  <Col md={4} className="text-center">
                    <Button variant="link" onClick={() => navigate("/login")}>
                      Back to Login
                    </Button>
                  </Col>
                </Row>
              </Form>
            </>
          )}
        </div>
      </Container>
    </>
  );
}

export default ForgotPassword;
