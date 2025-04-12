import React from 'react';
import { Navbar, Container, Button } from 'react-bootstrap';
import './header.css';

interface HeaderProps {
  onLogout: () => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onToggleSidebar }) => {
  return (
    <Navbar className="custom_navbar" bg="primary" variant="dark" expand="lg">
      <Container fluid>
        <Button
          variant="outline-light"
          className="me-2 border-0"
          onClick={onToggleSidebar}
        >
          ☰
        </Button>
        <Navbar.Brand>Beauty Care</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Button
            variant="outline-light"
            onClick={onLogout}
            className="border-0"
          >
            Salir
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;