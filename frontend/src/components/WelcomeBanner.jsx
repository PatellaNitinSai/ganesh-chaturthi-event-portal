import React from 'react';

export default function WelcomeBanner({ eventName, tagline }) {
  return (
    <div className="welcome-banner">
      <div className="welcome-banner-text">
        <div className="welcome-banner-eyebrow">🙏 {eventName || 'Ganesh Chaturthi Seva Samiti'} 🙏</div>
        <h2 className="welcome-banner-title">Welcome to Our Event Management Portal</h2>
        <p className="welcome-banner-tagline">
          "{tagline || 'Together we celebrate, together we serve, together we make a difference.'}"
        </p>
        <div className="thank-you-box">
          <div className="thank-you-en">Thank You Nitin for developing this site ❤️</div>
          <div className="thank-you-te">సైట్ డెవలప్ చేసినందుకు నితిన్ కి ధన్యవాదాలు 🙏</div>
        </div>
      </div>
    </div>
  );
}
