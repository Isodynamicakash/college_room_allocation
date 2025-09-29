import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

function AuthPage({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        username: form.username,
        password: form.password
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user); // Pass user info to parent
    } catch (err) {
      setError(err.response?.data?.message || t('authenticationFailed'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f3f6fb]">
      <Container>
        <Card className="mx-auto shadow-lg rounded-lg border-0" style={{ maxWidth: 400, background: '#fff' }}>
          <Card.Body>
            <h2 className="text-2xl font-bold text-primary text-center mb-3">{t('login')}</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>{t('username')}</Form.Label>
                <Form.Control type="text" name="username" value={form.username} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t('password')}</Form.Label>
                <Form.Control type="password" name="password" value={form.password} onChange={handleChange} required />
              </Form.Group>
              {error && <div className="text-danger mb-2 text-center">{error}</div>}
              <Button variant="primary" type="submit" className="w-100">{t('login')}</Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default AuthPage;