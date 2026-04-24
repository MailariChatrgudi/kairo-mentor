import React from 'react';
import './Card.css';

const Card = ({ children, onClick, className = '', hoverable = true }) => {
  return (
    <div 
      className={`kairo-card ${hoverable ? 'kairo-card--hoverable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
