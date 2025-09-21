import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';

function DateTimePicker({ date, time, onDateChange, onTimeChange }) {
  return (
    <Row className="mb-4 justify-content-center">
      <Col xs={12} sm={6} md={4} className="mb-2">
        <Form.Group>
          <Form.Label>Date</Form.Label>
          <Form.Control type="date" value={date} onChange={e => onDateChange(e.target.value)} />
        </Form.Group>
      </Col>
      <Col xs={12} sm={6} md={4} className="mb-2">
        <Form.Group>
          <Form.Label>Time</Form.Label>
          <Form.Control type="time" value={time} onChange={e => onTimeChange(e.target.value)} />
        </Form.Group>
      </Col>
    </Row>
  );
}

export default DateTimePicker;
