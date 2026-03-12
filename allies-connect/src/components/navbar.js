import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function MyNavbar({ user, setUser  }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate('/');
    };

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
                        {!user ? (
                            <>
                                <Button className="btn-outline-navbar btn-gold" onClick={() => navigate('/register')}>Register</Button>
                                <Button className="btn-outline-navbar btn-white" onClick={() => navigate('/login')}>Login</Button>
                            </>
                        ) : (
                            <>
                                <span className="navbar-username me-3">Hello, {user.first_name || user.email}!</span>
                                <Button className="btn-outline-navbar btn-white" onClick={handleLogout}>Logout</Button>
                            </>
                        )}

                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default MyNavbar;