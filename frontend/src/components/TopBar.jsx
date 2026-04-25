import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './TopBar.css';

const TopBar = ({ title, showBack = false, rightAction = null, onBack = null }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className="top-bar">
      <div className="top-bar__left">
        {showBack && (
          <button className="top-bar__back" onClick={handleBack}>
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
        )}
      </div>
      <h3 className="top-bar__title">{title}</h3>
      <div className="top-bar__right">
        {rightAction}
      </div>
    </header>
  );
};

export default TopBar;
