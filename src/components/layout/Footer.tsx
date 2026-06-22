import React from 'react';
import './footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>Beauty Care &copy; {currentYear} -       <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 11, marginTop: 18 }}>
        Powered by <strong style={{ color: "#0d9488" }}><a href="https://devsign.cl" target="_blank" rel="noopener noreferrer">Devsign</a></strong></p>
        </p>
      </div>
    </footer>
  );
};

export default Footer;