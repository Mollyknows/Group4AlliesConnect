import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function MyNavbar() {
    const navigate = useNavigate();
    return (
        <Navbar className="navbar" expand="lg">
            <Container>
                <Navbar.Brand href="/" className="d-flex align-items-center">
                    <img src="/AllieConnectLogo.png" height="50" className="me-2" alt="Allies Connect logo" />
                    Allies Connect
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto">
                        <Button className="btn-outline-navbar btn-gold">Register</Button>
                        <Button className="btn-outline-navbar btn-white" onClick={() => navigate('/login')}>Login</Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default MyNavbar;