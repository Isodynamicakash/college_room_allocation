import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

function LandingPage({ onSelectBuilding }) {
  const [buildings, setBuildings] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBuildings = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/buildings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBuildings(res.data);
    };
    fetchBuildings();
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f3f6fb]">
      <Container>
        <h2 className="text-3xl font-bold text-primary text-center mb-2">{t('selectBuilding')}</h2>
        <p className="text-center text-gray-600 mb-4">{t('chooseBuildings')}</p>
        <Row className="justify-content-center">
          {buildings.map((b) => (
            <Col key={b._id} xs={12} sm={6} md={4} className="mb-4 d-flex justify-content-center">
              <Card className="shadow-lg rounded-lg border-0" style={{ width: '18rem', background: '#fff' }}>
                <Card.Body className="flex flex-col items-center">
                  <Card.Title className="text-xl font-semibold text-primary text-center">{b.name}</Card.Title>
                  <Button variant="link" className="text-primary font-medium" onClick={() => onSelectBuilding(b)}>
                    {t('viewFloors')} &rarr;
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
}

export default LandingPage;