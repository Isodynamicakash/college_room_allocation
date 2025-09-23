
import React from 'react';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';

function AdminDashboard({ user, onLogout, onNavigateToBookings }) {
  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">Welcome to the Admin Dashboard</h2>
          <p>
            Hello, <strong>{user.name}</strong>. This is where you’ll manage Excel uploads and admin features.
          </p>
        </Col>
        <Col className="text-end">
          <Button variant="outline-danger" onClick={onLogout}>
            Logout
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>📥 Excel Upload</Card.Title>
              <Card.Text>
                Upload weekly timetables to auto-fill room bookings.
              </Card.Text>
              <Button variant="primary" disabled>
                Coming Soon
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>📊 Booking Management</Card.Title>
              <Card.Text>
                View, create, and manage room bookings across buildings and floors.
              </Card.Text>
              <Button variant="primary" onClick={onNavigateToBookings}>
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