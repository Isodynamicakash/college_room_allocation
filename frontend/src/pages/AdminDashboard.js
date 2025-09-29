import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext';

function AdminDashboard({ user, onLogout, onNavigateToBookings }) {
  const { t } = useTranslation();
  
  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">{t('welcomeAdmin')}</h2>
          <p>
            {t('helloAdmin', { name: user.name })}
          </p>
        </Col>
        <Col className="text-end">
          <Button variant="outline-danger" onClick={onLogout}>
            {t('logout')}
          </Button>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col md={8} lg={6} className="mb-3">
          <Card>
            <Card.Body className="text-center">
              <Card.Title>📊 {t('bookingManagement')}</Card.Title>
              <Card.Text>
                {t('bookingManagementDesc')}
              </Card.Text>
              <Button variant="primary" size="lg" onClick={onNavigateToBookings}>
                {t('openBookingManagement')}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard;