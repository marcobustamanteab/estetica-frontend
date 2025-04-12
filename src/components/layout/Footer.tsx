import React from 'react';
import './footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>Beauty Care &copy; {currentYear} - Tu centro de belleza y bienestar</p>
      </div>
    </footer>
  );
};

export default Footer;