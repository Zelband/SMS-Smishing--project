import { ImageWithFallback } from './figma/ImageWithFallback';
import logoImage from '../../imports/Screenshot_20260410_191521_Drive.jpg';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { trackEvent } from '../api';

export function AccountPicker() {
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('visit');
    trackEvent('account_picker_view');
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <div className="p-6">
        <ImageWithFallback
          src={logoImage}
          alt="California State University Long Beach"
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <h1 className="text-4xl font-normal mb-8">Pick an account</h1>

        {/* Use Another Account */}
        <button
          onClick={() => navigate('/sign-in')}
          className="flex items-center gap-4 py-4 hover:bg-gray-50 w-full rounded-lg px-2"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-3xl text-gray-600 font-light">+</span>
          </div>
          <span className="text-gray-900">Use another account</span>
        </button>
      </div>

      {/* Footer */}
      <div className="fixed bottom-8 left-0 right-0 px-6">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-900">Acceptable Use</a>
          <a href="#" className="hover:text-gray-900">Accessibility Statement</a>
          <button className="hover:text-gray-900">•••</button>
        </div>
      </div>

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              We use cookies to improve your experience on our site. By using our site, you consent to cookies.
            </p>
            <button
              onClick={() => setShowCookieBanner(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded whitespace-nowrap"
            >
              Accept Cookies
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
