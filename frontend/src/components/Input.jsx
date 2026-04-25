import React from 'react';
import './Input.css';

const Input = ({ label, placeholder, value, onChange, type = 'text', icon = null, error = false }) => {
  return (
    <div className="kairo-input-wrapper">
      {label && <label className="kairo-input-label">{label}</label>}
      <div className={`kairo-input-container ${error ? 'kairo-input-container--error' : ''}`}>
        {icon && <span className={`kairo-input-icon ${error ? 'kairo-input-icon--error' : ''}`}>{icon}</span>}
        <input
          className="kairo-input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default Input;
