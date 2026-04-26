import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";
import { API_URL } from "../config";
import {
  formatPhone,
  formatZip,
  getPasswordErrors,
  isValidEmailFormat,
  isValidPasswordFormat,
  isValidPhoneFormat,
  isValidUsernameFormat,
} from "../utils/validation";

function AdminInviteRegister() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [inviteData, setInviteData] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    zip: "",
  });

  const fetchInvite = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/invite/${token}`);
      if (!response.ok) {
        setInviteError(
          "This admin invitation link is invalid or has expired. Please request a new invite.",
        );
        return;
      }

      const data = await response.json();
      setInviteData(data);
      setFormData((prev) => ({
        ...prev,
        email: data.email || "",
      }));
    } catch (err) {
      console.error("Error fetching admin invite:", err);
      setInviteError("Unable to load invitation. Please try again later.");
    } finally {
      setLoadingInvite(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvite();
  }, [fetchInvite]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: formatPhone(value) }));
    } else if (name === "zip") {
      setFormData((prev) => ({ ...prev, [name]: formatZip(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const isFormValid =
    formData.username &&
    isValidUsernameFormat(formData.username) &&
    formData.email &&
    isValidEmailFormat(formData.email) &&
    formData.password &&
    isValidPasswordFormat(formData.password) &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    formData.firstName &&
    formData.lastName &&
    formData.phone &&
    isValidPhoneFormat(formData.phone) &&
    formData.zip;

  const getFormErrors = () => {
    const errors = [];
    if (!formData.username) errors.push("Username is required");
    else if (!isValidUsernameFormat(formData.username)) {
      errors.push(
        "Username must be 3-50 characters with only letters, numbers, underscores, and hyphens",
      );
    }
    if (!formData.email) errors.push("Email is required");
    else if (!isValidEmailFormat(formData.email)) {
      errors.push("Email must be in a valid format (e.g., user@example.com)");
    }
    if (!formData.password) errors.push("Password is required");
    else if (!isValidPasswordFormat(formData.password)) {
      errors.push("Password does not meet requirements");
    }
    if (!formData.confirmPassword) errors.push("Confirm Password is required");
    else if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }
    if (!formData.firstName) errors.push("First Name is required");
    if (!formData.lastName) errors.push("Last Name is required");
    if (!formData.phone) errors.push("Phone Number is required");
    else if (!isValidPhoneFormat(formData.phone)) {
      errors.push("Phone number must be a valid 10-digit format");
    }
    if (!formData.zip) errors.push("ZIP Code is required");
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const formErrors = getFormErrors();
    if (formErrors.length > 0) {
      alert("Please correct the following:\n\n• " + formErrors.join("\n• "));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/invite-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phone.replace(/\D/g, ""),
          zip_code: formData.zip,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Registration failed: " + data.error);
        return;
      }

      alert("Admin account created successfully! You can now log in.");
      navigate("/login");
    } catch (err) {
      console.error("Error registering admin via invite:", err);
      alert("An error occurred during registration.");
    }
  };

  if (loadingInvite) {
    return (
      <Container className="register-container">
        <div className="text-center mt-5">
          <Spinner animation="border" className="me-2" />
          Loading invitation...
        </div>
      </Container>
    );
  }

  if (inviteError) {
    return (
      <Container className="register-container">
        <div className="text-container mb-5">
          <h1>Welcome to Allies Connect</h1>
        </div>
        <Alert variant="danger" className="text-center">
          {inviteError}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet><title>Register | Allies Connect</title></Helmet>
      <Container className="register-container">
        <div className="text-container mb-3">
          <h1>Welcome to Allies Connect</h1>
        </div>
        <div className="text-container mb-5">
          <h2>Admin Account Invitation</h2>
          <p>
            You&apos;ve been invited to create an admin account. Fill out the form
            below to continue.
          </p>
        </div>

        <div className="feature-box">
          <div className="text-container mb-4">
            <h3>Create Your Admin Account</h3>
          </div>
          <Form>
            <Row className="text-start mb-3">
              <Col md={3} className="d-flex align-items-center">
                <h5>
                  Username: <span className="text-danger">*</span>
                </h5>
              </Col>
              <Col className="d-flex align-items-center">
                <Form.Group className="w-100">
                  <Form.Control
                    name="username"
                    type="text"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    isInvalid={
                      formData.username &&
                      !isValidUsernameFormat(formData.username)
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    Username must be 3-50 characters and contain only letters,
                    numbers, underscores, and hyphens (no spaces)
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="text-start mb-3">
              <Col md={3} className="d-flex align-items-center">
                <h5>
                  Password: <span className="text-danger">*</span>
                </h5>
              </Col>
              <Col className="d-flex align-items-center">
                <Form.Group className="w-100">
                  <Form.Control
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    isInvalid={
                      formData.password &&
                      !isValidPasswordFormat(formData.password)
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    {getPasswordErrors(formData.password).map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="text-start mb-3">
              <Col md={3} className="d-flex align-items-center">
                <h5>
                  Confirm Password: <span className="text-danger">*</span>
                </h5>
              </Col>
              <Col className="d-flex align-items-center">
                <Form.Group className="w-100">
                  <Form.Control
                    name="confirmPassword"
                    type="password"
                    placeholder="Enter password again"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    isInvalid={
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    Passwords do not match
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="text-start mb-3">
              <Col md={3} className="d-flex align-items-center">
                <h5>
                  Email: <span className="text-danger">*</span>
                </h5>
              </Col>
              <Col className="d-flex align-items-center">
                <Form.Group className="w-100">
                  <Form.Control
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    isInvalid={
                      formData.email && !isValidEmailFormat(formData.email)
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    Email must be in a valid format (e.g., user@example.com)
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="text-start mb-3">
              <Col md={3} className="d-flex align-items-center">
                <h5>
                  First Name: <span className="text-danger">*</span>
                </h5>
              </Col>
              <Col className="d-flex align-items-center">
                <Form.Control
                  name="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </Col>
            </Row>

            <Row className="text-start mb-3">
              <Col md={3} className="d-flex align-items-center">
                <h5>
                  Last Name: <span className="text-danger">*</span>
                </h5>
              </Col>
              <Col className="d-flex align-items-center">
                <Form.Control
                  name="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </Col>
            </Row>

            <Row className="text-start mb-3">
              <Col md={3} className="d-flex align-items-center">
                <h5>
                  Phone Number: <span className="text-danger">*</span>
                </h5>
              </Col>
              <Col className="d-flex align-items-center">
                <Form.Group className="w-100">
                  <Form.Control
                    name="phone"
                    type="text"
                    placeholder="(###) ###-####"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    isInvalid={
                      formData.phone && !isValidPhoneFormat(formData.phone)
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    Phone number must be a valid 10-digit format
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="text-start mb-4">
              <Col md={3} className="d-flex align-items-center">
                <h5>
                  ZIP Code: <span className="text-danger">*</span>
                </h5>
              </Col>
              <Col className="d-flex align-items-center">
                <Form.Control
                  name="zip"
                  type="text"
                  placeholder="Enter ZIP code"
                  value={formData.zip}
                  onChange={handleChange}
                  required
                />
              </Col>
            </Row>

            <div className="text-center mt-4">
              <Button
                variant="primary"
                className="btn-green"
                disabled={!isFormValid}
                onClick={handleRegister}
              >
                Create Admin Account
              </Button>
            </div>
          </Form>
        </div>
      </Container>
    </>
  );
}

export default AdminInviteRegister;
