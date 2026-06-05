import React from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/landingpage/dampolzz.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div className="animated-background">
      <div className="background-image" style={backgroundStyle}></div>
      <div className="overlay"></div>
    </div>
  );
};

export default AnimatedBackground;
