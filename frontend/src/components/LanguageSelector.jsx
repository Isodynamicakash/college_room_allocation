import React from 'react';
import { Form } from 'react-bootstrap';
import { useTranslation } from '../contexts/LanguageContext';

function LanguageSelector({ className = '' }) {
  const { currentLanguage, changeLanguage, supportedLanguages, t } = useTranslation();

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div className={`language-selector ${className}`} style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 1000,
      background: 'white',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minWidth: '200px'
    }}>
      <Form.Group>
        <Form.Label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>
          {t('selectLanguage')}
        </Form.Label>
        <Form.Select
          size="sm"
          value={currentLanguage}
          onChange={handleLanguageChange}
          style={{ fontSize: '0.9rem' }}
        >
          {supportedLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    </div>
  );
}

export default LanguageSelector;