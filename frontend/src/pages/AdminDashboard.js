import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

function AdminDashboard({ user, onLogout, onNavigateToBookings }) {
  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">Welcome to the Admin Dashboard</h2>
          <p>
            Hello, <strong>{user.name}</strong>. Manage room bookings and admin features.
          </p>
        </Col>
        <Col className="text-end">
          <Button variant="outline-danger" onClick={onLogout}>
            Logout
          </Button>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col md={8} lg={6} className="mb-3">
          <Card>
            <Card.Body className="text-center">
              <Card.Title>📊 Booking Management</Card.Title>
              <Card.Text>
                View, create, and manage room bookings across buildings and floors.
              </Card.Text>
              <Button variant="primary" size="lg" onClick={onNavigateToBookings}>
                Open Booking Management
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard;