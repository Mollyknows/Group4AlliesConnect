import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import "../App.css";
import { API_URL } from "../config";

const getPasswordErrors = (password) => {
  const errors = [];
  if (password.length <= 6) errors.push("Must be seven characters or longer");
  if (!/[A-Z]/.test(password))
    errors.push("Must include at least one capital letter");
  if (!/[!@#$%^&*()_+\-=[\]{}|;:',.<>?/~`]/.test(password))
    errors.push(
      "Must include at least one special character (!@#$%^&*()_+-=[]{}|;:',.<>?/~`)",
    );
  if (/\s/.test(password)) errors.push("Cannot contain spaces");
  return errors;
};

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordErrors = password ? getPasswordErrors(password) : [];
  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;
  const isValid =
    password &&
    confirmPassword &&
    passwordErrors.length === 0 &&
    passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValid) {
      setError("Please fix the password errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
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
          <h1>Reset Password</h1>
        </div>
        <div className="feature-box">
          {success ? (
            <div className="text-center">
              <h3 className="mb-3">Password Reset Successful!</h3>
              <p>
                Your password has been updated. You can now log in with your new
                password.
              </p>
              <Button
                className="btn-gold mt-3"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-container mb-4">
                <p>Enter your new password below.</p>
                {error && <p className="text-danger">{error}</p>}
              </div>
              <Form onSubmit={handleSubmit}>
                <Row className="text-start mb-3 justify-content-center">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>
                        <h5>New Password</h5>
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      {password && passwordErrors.length > 0 && (
                        <ul
                          className="text-danger mt-2 mb-0"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {passwordErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      )}
                      {password && passwordErrors.length === 0 && (
                        <small className="text-success">
                          ✓ Password meets requirements
                        </small>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="text-start mb-4 justify-content-center">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>
                        <h5>Confirm Password</h5>
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      {confirmPassword && !passwordsMatch && (
                        <small className="text-danger">
                          Passwords do not match
                        </small>
                      )}
                      {passwordsMatch && (
                        <small className="text-success">✓ Passwords match</small>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="justify-content-center">
                  <Col md={4}>
                    <Button
                      className="btn-gold w-100"
                      type="submit"
                      disabled={!isValid || loading}
                    >
                      {loading ? "Resetting…" : "Reset Password"}
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

export default ResetPassword;
