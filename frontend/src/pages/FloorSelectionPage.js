import React, { useEffect, useState } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { getFloors } from '../utils/api';

function FloorSelectionPage({ building, onSelectFloor, onBack }) {
  const [floors, setFloors] = useState([]);

  useEffect(() => {
    getFloors(building._id).then(setFloors);
  }, [building]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f3f6fb]">
      <Container>
        <Button variant="link" className="mb-3 text-primary" onClick={onBack}>
          &larr; Back to Buildings
        </Button>
        <h2 className="text-2xl font-bold text-primary text-center mb-2">{building.name}</h2>
        <p className="text-center text-gray-600 mb-4">Select a floor to view available rooms</p>
        {floors.map((floor) => (
          <Card key={floor._id} className="mb-3 shadow rounded-lg border-0" style={{ background: '#fff' }}>
            <Card.Body className="flex flex-row justify-between items-center">
              <div>
                <Card.Title className="text-lg font-semibold text-primary">Floor {floor.number}</Card.Title>
                <Card.Text className="text-gray-700">10 rooms available</Card.Text>
              </div>
              <Button variant="primary" onClick={() => onSelectFloor(floor)}>
                View Rooms &rarr;
              </Button>
            </Card.Body>
          </Card>
        ))}
      </Container>
    </div>
  );
}

export default FloorSelectionPage;