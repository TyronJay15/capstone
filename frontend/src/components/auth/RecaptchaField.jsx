import React, { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { getRecaptchaSiteKey, isRecaptchaDemoMode } from '../../services/recaptchaService';
import './RecaptchaField.css';

const RecaptchaField = ({ onChange, error }) => {
  const recaptchaRef = useRef(null);
  const [demoChecked, setDemoChecked] = useState(false);
  const demoMode = isRecaptchaDemoMode();
  const siteKey = getRecaptchaSiteKey();

  const handleRecaptcha = (token) => {
    onChange({ token, demoChecked: false });
  };

  const handleDemoCheck = (e) => {
    const checked = e.target.checked;
    setDemoChecked(checked);
    onChange({ token: null, demoChecked: checked });
    if (!checked && recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const handleExpired = () => {
    onChange({ token: null, demoChecked: false });
  };

  return (
    <div className="recaptcha-field">
      <label className="recaptcha-label">Security verification</label>
      {demoMode ? (
        <div className="recaptcha-demo">
          <label className="recaptcha-demo-check">
            <input type="checkbox" checked={demoChecked} onChange={handleDemoCheck} />
            <span>I am not a robot (demo mode)</span>
          </label>
        </div>
      ) : (
        <div className="recaptcha-widget-wrap">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={siteKey}
            onChange={handleRecaptcha}
            onExpired={handleExpired}
            size="normal"
          />
        </div>
      )}
      {error ? <div className="recaptcha-error">{error}</div> : null}
    </div>
  );
};

export default RecaptchaField;
