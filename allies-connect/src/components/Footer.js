import { Col, Container, Row } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

function Footer({ user, setUser, role, setRole }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    setRole("");
    navigate("/");
  };

  const dashboardPath =
    role === "admin" ? "/admin" :
    role === "provider" ? "/provider" :
    "/volunteer";

  return (
    <footer className="mt-auto py-4 border-top" style={{ backgroundColor: "#f8f9fa" }}>
      <Container>
        <Row className="justify-content-center text-center">
          <Col md={3} className="mb-3">
            <h6 className="fw-bold mb-2">Resources</h6>
            <nav aria-label="Footer resources navigation">
              <ul className="list-unstyled mb-0">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/maps">Local Resources</Link></li>
                <li><Link to="/events">Events</Link></li>
                <li><Link to="/volunteer">Volunteer</Link></li>
              </ul>
            </nav>
          </Col>
          <Col md={3} className="mb-3">
            <h6 className="fw-bold mb-2">Account</h6>
            <nav aria-label="Footer account navigation">
              <ul className="list-unstyled mb-0">
                {user ? (
                  <>
                    <li><Link to={dashboardPath}>Dashboard</Link></li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="btn btn-link p-0"
                        style={{ textDecoration: "none" }}
                      >
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login">Login</Link></li>
                    <li><Link to="/register">Register</Link></li>
                  </>
                )}
              </ul>
            </nav>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col className="text-center text-muted">
            <small>&copy; {new Date().getFullYear()} Allies Connect. All rights reserved.</small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;