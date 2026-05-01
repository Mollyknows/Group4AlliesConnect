import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Tab,
  Tabs,
} from "react-bootstrap";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { API_URL } from "../config";
import {
  formatEIN,
  formatPhone,
  formatZip,
  getPasswordErrors,
  hasNineDigits,
  isValidEINFormat,
  isValidEmailFormat,
  isValidPasswordFormat,
  isValidPhoneFormat,
  isValidUsernameFormat,
} from "../utils/validation";

function Register() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  // Volunteer form state
  const [volFormData, setVolFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    zip: "",
  });

  // Organization form state
  const [orgFormData, setOrgFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    name: "",
    phone: "",
    zip: "",
    ein: "",
  });

  // EIN verification state
  const [einVerified, setEinVerified] = useState(false);
  const [einOrgData, setEinOrgData] = useState(null);
  const [einLoading, setEinLoading] = useState(false);
  const [einError, setEinError] = useState("");

  // Verify EIN against ProPublica when fully entered
  const verifyEIN = useCallback(async (ein) => {
    const digits = ein.replace(/\D/g, "");
    if (digits.length !== 9) return;

    setEinLoading(true);
    setEinError("");
    setEinOrgData(null);
    setEinVerified(false);

    try {
      const response = await fetch(
        `${API_URL}/api/organizations/verify-ein/${digits}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          setEinError(
            "No organization found with that EIN. Please check the number and try again.",
          );
        } else {
          setEinError(
            "Unable to verify EIN at this time. Please try again later.",
          );
        }
        return;
      }

      const data = await response.json();
      setEinOrgData(data);
    } catch (err) {
      console.error("Error verifying EIN:", err);
      setEinError("Unable to verify EIN at this time. Please try again later.");
    } finally {
      setEinLoading(false);
    }
  }, []);

  // Trigger EIN verification when the EIN field reaches 9 digits
  useEffect(() => {
    const digits = orgFormData.ein.replace(/\D/g, "");
    if (digits.length === 9 && isValidEINFormat(orgFormData.ein)) {
      verifyEIN(orgFormData.ein);
    } else {
      // Reset verification state if EIN changes
      setEinVerified(false);
      setEinOrgData(null);
      setEinError("");
    }
  }, [orgFormData.ein, verifyEIN]);

  // Handle volunteer form changes
  const handleVolChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setVolFormData((prev) => ({ ...prev, [name]: formatPhone(value) }));
    } else if (name === "zip") {
      setVolFormData((prev) => ({ ...prev, [name]: formatZip(value) }));
    } else {
      setVolFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle organization form changes
  const handleOrgChange = (e) => {
    const { name, value } = e.target;
    // Auto-format EIN, phone, and zip as user types
    if (name === "ein") {
      setOrgFormData((prev) => ({ ...prev, [name]: formatEIN(value) }));
    } else if (name === "phone") {
      setOrgFormData((prev) => ({ ...prev, [name]: formatPhone(value) }));
    } else if (name === "zip") {
      setOrgFormData((prev) => ({ ...prev, [name]: formatZip(value) }));
    } else {
      setOrgFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Computed form validity
  const isVolFormValid =
    volFormData.username &&
    isValidUsernameFormat(volFormData.username) &&
    volFormData.email &&
    isValidEmailFormat(volFormData.email) &&
    volFormData.password &&
    isValidPasswordFormat(volFormData.password) &&
    volFormData.confirmPassword &&
    volFormData.password === volFormData.confirmPassword &&
    volFormData.firstName &&
    volFormData.lastName &&
    volFormData.phone &&
    isValidPhoneFormat(volFormData.phone) &&
    volFormData.zip;

  const isOrgFormValid =
    orgFormData.username &&
    isValidUsernameFormat(orgFormData.username) &&
    orgFormData.email &&
    isValidEmailFormat(orgFormData.email) &&
    orgFormData.password &&
    isValidPasswordFormat(orgFormData.password) &&
    orgFormData.confirmPassword &&
    orgFormData.password === orgFormData.confirmPassword &&
    orgFormData.firstName &&
    orgFormData.lastName &&
    orgFormData.name &&
    orgFormData.phone &&
    isValidPhoneFormat(orgFormData.phone) &&
    orgFormData.zip &&
    orgFormData.ein &&
    isValidEINFormat(orgFormData.ein) &&
    einVerified;

  // Handle volunteer registration
  const handleVolunteerRegister = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (
      !volFormData.username ||
      !volFormData.email ||
      !volFormData.password ||
      !volFormData.confirmPassword ||
      !volFormData.firstName ||
      !volFormData.lastName ||
      !volFormData.phone ||
      !volFormData.zip
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (!isValidEmailFormat(volFormData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!isValidUsernameFormat(volFormData.username)) {
      alert(
        "Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens (no spaces)",
      );
      return;
    }

    if (!isValidPhoneFormat(volFormData.phone)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    if (!isValidPasswordFormat(volFormData.password)) {
      alert(
        "Password requirements not met:\n" +
          getPasswordErrors(volFormData.password).join("\n"),
      );
      return;
    }

    if (volFormData.password !== volFormData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: volFormData.username,
          email: volFormData.email,
          password: volFormData.password,
          first_name: volFormData.firstName,
          last_name: volFormData.lastName,
          phone: volFormData.phone.replace(/\D/g, ""),
          zip_code: volFormData.zip,
          role: "volunteer",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Registration failed: " + data.error);
        return;
      }

      alert("Registration successful! You can now log in.");
      // Reset form
      setVolFormData({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        zip: "",
      });
    } catch (err) {
      console.error("Error registering volunteer:", err);
      alert("An error occurred during registration");
    }
  };

  // Handle organization registration
  const handleOrganizationRegister = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (
      !orgFormData.username ||
      !orgFormData.email ||
      !orgFormData.password ||
      !orgFormData.confirmPassword ||
      !orgFormData.firstName ||
      !orgFormData.lastName ||
      !orgFormData.name ||
      !orgFormData.phone ||
      !orgFormData.zip ||
      !orgFormData.ein
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (!isValidEmailFormat(orgFormData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!isValidUsernameFormat(orgFormData.username)) {
      alert(
        "Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens (no spaces)",
      );
      return;
    }

    if (!isValidPhoneFormat(orgFormData.phone)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    if (!isValidPasswordFormat(orgFormData.password)) {
      alert(
        "Password requirements not met:\n" +
          getPasswordErrors(orgFormData.password).join("\n"),
      );
      return;
    }

    if (orgFormData.password !== orgFormData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!isValidEINFormat(orgFormData.ein)) {
      alert("Please enter a valid EIN number in the format XX-XXXXXXX");
      return;
    }

    if (!einVerified) {
      alert(
        "Please verify your EIN and confirm your organization before registering.",
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/organizations/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: orgFormData.username,
          email: orgFormData.email,
          password: orgFormData.password,
          organization_name: orgFormData.name,
          phone_number: orgFormData.phone.replace(/\D/g, ""),
          first_name: orgFormData.firstName,
          last_name: orgFormData.lastName,
          zip_code: orgFormData.zip,
          ein: orgFormData.ein,
          verification_method: "ein",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Registration failed: " + data.error);
        return;
      }

      alert(
        "Registration successful! Please complete your application on the next page.",
      );
      navigate("/provider-application", {
        state: { provider_id: data.provider_id },
      });
    } catch (err) {
      console.error("Error registering organization:", err);
      alert("An error occurred during registration");
    }
  };

  if (user) {
    return (
      <Container className="login-container">
        <div className="text-container mb-5">
          <h1>You are already logged in.</h1>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>Register | Allies Connect</title>
      </Helmet>
      <Container className="register-container">
        <div className="text-container mb-5">
          <h1>Create Your Account!</h1>
        </div>
        <div className="feature-box">
          <div className="text-container mb-5">
            <h2>Register</h2>
            <p>Select a tab to begin creating your desired account type.</p>
          </div>
          <Tabs defaultActiveKey="volunteer" className="mb-3">
            <Tab eventKey="volunteer" title="Volunteer">
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
                        value={volFormData.username}
                        onChange={handleVolChange}
                        required
                        isInvalid={
                          volFormData.username &&
                          !isValidUsernameFormat(volFormData.username)
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        Username must be 3-50 characters and contain only
                        letters, numbers, underscores, and hyphens (no spaces)
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
                        value={volFormData.password}
                        onChange={handleVolChange}
                        required
                        isInvalid={
                          volFormData.password &&
                          !isValidPasswordFormat(volFormData.password)
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {getPasswordErrors(volFormData.password).map(
                          (err, i) => (
                            <div key={i}>{err}</div>
                          ),
                        )}
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
                        value={volFormData.confirmPassword}
                        onChange={handleVolChange}
                        required
                        isInvalid={
                          volFormData.confirmPassword &&
                          volFormData.password !== volFormData.confirmPassword
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
                        value={volFormData.email}
                        onChange={handleVolChange}
                        required
                        isInvalid={
                          volFormData.email &&
                          !isValidEmailFormat(volFormData.email)
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
                      value={volFormData.firstName}
                      onChange={handleVolChange}
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
                      value={volFormData.lastName}
                      onChange={handleVolChange}
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
                        type="tel"
                        placeholder="(XXX) XXX-XXXX"
                        value={volFormData.phone}
                        onChange={handleVolChange}
                        required
                        maxLength="14"
                        isInvalid={
                          volFormData.phone &&
                          !isValidPhoneFormat(volFormData.phone)
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        Phone number must be a valid 10-digit format
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="text-start mb-3">
                  <Col md={3} className="d-flex align-items-center">
                    <h5>
                      ZIP Code: <span className="text-danger">*</span>
                    </h5>
                  </Col>
                  <Col className="d-flex align-items-center">
                    <Form.Control
                      name="zip"
                      type="tel"
                      placeholder="XXXXX"
                      value={volFormData.zip}
                      onChange={handleVolChange}
                      required
                      maxLength="5"
                    />
                  </Col>
                </Row>
              </Form>
              <Row className="justify-content-end">
                <Col md={4}>
                  <Button
                    className="btn-gold"
                    onClick={handleVolunteerRegister}
                    disabled={!isVolFormValid}
                    style={{ opacity: isVolFormValid ? 1 : 0.5 }}
                  >
                    Register
                  </Button>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="organization" title="Organization">
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
                        value={orgFormData.username}
                        onChange={handleOrgChange}
                        required
                        isInvalid={
                          orgFormData.username &&
                          !isValidUsernameFormat(orgFormData.username)
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        Username must be 3-50 characters and contain only
                        letters, numbers, underscores, and hyphens (no spaces)
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
                        value={orgFormData.password}
                        onChange={handleOrgChange}
                        required
                        isInvalid={
                          orgFormData.password &&
                          !isValidPasswordFormat(orgFormData.password)
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {getPasswordErrors(orgFormData.password).map(
                          (err, i) => (
                            <div key={i}>{err}</div>
                          ),
                        )}
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
                        value={orgFormData.confirmPassword}
                        onChange={handleOrgChange}
                        required
                        isInvalid={
                          orgFormData.confirmPassword &&
                          orgFormData.password !== orgFormData.confirmPassword
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
                        value={orgFormData.email}
                        onChange={handleOrgChange}
                        required
                        isInvalid={
                          orgFormData.email &&
                          !isValidEmailFormat(orgFormData.email)
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
                      value={orgFormData.firstName}
                      onChange={handleOrgChange}
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
                      value={orgFormData.lastName}
                      onChange={handleOrgChange}
                      required
                    />
                  </Col>
                </Row>
                <Row className="text-start mb-3">
                  <Col md={3} className="d-flex align-items-center">
                    <h5>
                      Organization Name: <span className="text-danger">*</span>
                    </h5>
                  </Col>
                  <Col className="d-flex align-items-center">
                    <Form.Control
                      name="name"
                      type="text"
                      placeholder="Enter organization name"
                      value={orgFormData.name}
                      onChange={handleOrgChange}
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
                        type="tel"
                        placeholder="(XXX) XXX-XXXX"
                        value={orgFormData.phone}
                        onChange={handleOrgChange}
                        required
                        maxLength="14"
                        isInvalid={
                          orgFormData.phone &&
                          !isValidPhoneFormat(orgFormData.phone)
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        Phone number must be a valid 10-digit format
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="text-start mb-3">
                  <Col md={3} className="d-flex align-items-center">
                    <h5>
                      ZIP Code: <span className="text-danger">*</span>
                    </h5>
                  </Col>
                  <Col className="d-flex align-items-center">
                    <Form.Control
                      name="zip"
                      type="tel"
                      placeholder="XXXXX"
                      value={orgFormData.zip}
                      onChange={handleOrgChange}
                      required
                      maxLength="5"
                    />
                  </Col>
                </Row>
                <div
                  style={{
                    border: "2px solid #ccc",
                    borderRadius: "10px",
                    padding: "20px",
                    marginBottom: "1rem",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <h5
                    className="text-center mb-3"
                    style={{ fontWeight: "bold" }}
                  >
                    EIN Verification
                  </h5>
                  <Row className="text-start mb-3">
                    <Col md={3} className="d-flex align-items-center">
                      <h5>
                        EIN Number: <span className="text-danger">*</span>
                      </h5>
                    </Col>
                    <Col className="d-flex align-items-center">
                      <Form.Group className="w-100">
                        <Form.Control
                          name="ein"
                          type="tel"
                          placeholder="Enter EIN number (XX-XXXXXXX)"
                          value={orgFormData.ein}
                          onChange={handleOrgChange}
                          required
                          isInvalid={
                            orgFormData.ein &&
                            hasNineDigits(orgFormData.ein) &&
                            !isValidEINFormat(orgFormData.ein)
                          }
                          isValid={einVerified}
                          maxLength="11"
                        />
                        <Form.Control.Feedback type="invalid">
                          EIN must be in the format XX-XXXXXXX (9 digits)
                        </Form.Control.Feedback>
                        {einVerified && (
                          <Form.Control.Feedback type="valid">
                            EIN verified ✓
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {einLoading && (
                    <div className="text-center my-3">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Verifying EIN...
                    </div>
                  )}

                  {einError && (
                    <Alert variant="danger" className="mt-2">
                      {einError}
                    </Alert>
                  )}

                  {einOrgData && !einVerified && (
                    <Alert variant="info" className="mt-3">
                      <h6 style={{ fontWeight: "bold" }}>
                        Is this your organization?
                      </h6>
                      <p className="mb-1">
                        <strong>Name:</strong> {einOrgData.name}
                      </p>
                      {einOrgData.address && (
                        <p className="mb-1">
                          <strong>Address:</strong> {einOrgData.address}
                        </p>
                      )}
                      <p className="mb-3">
                        <strong>Location:</strong> {einOrgData.city},{" "}
                        {einOrgData.state} {einOrgData.zipcode}
                      </p>
                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setEinVerified(true)}
                        >
                          Yes, this is my organization
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setEinOrgData(null);
                            setOrgFormData((prev) => ({ ...prev, ein: "" }));
                          }}
                        >
                          No, try a different EIN
                        </Button>
                      </div>
                    </Alert>
                  )}

                  {einVerified && einOrgData && (
                    <Alert variant="success" className="mt-2">
                      <strong>Verified:</strong> {einOrgData.name} —{" "}
                      {einOrgData.city}, {einOrgData.state}
                    </Alert>
                  )}
                </div>
              </Form>
              <Row className="justify-content-end">
                <Col md={4}>
                  <Button
                    className="btn-gold"
                    onClick={handleOrganizationRegister}
                    disabled={!isOrgFormValid}
                    style={{ opacity: isOrgFormValid ? 1 : 0.5 }}
                  >
                    Register
                  </Button>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </div>
      </Container>
    </>
  );
}

export default Register;
