import React, { useState, useEffect } from 'react';
import { FiServer, FiZap, FiClock } from 'react-icons/fi';

interface ColdStartLoaderProps {
  isVisible: boolean;
  message?: string;
  duration?: number; // in seconds
}

const ColdStartLoader: React.FC<ColdStartLoaderProps> = ({ 
  isVisible, 
  message = "Services are waking up...", 
  duration = 60 
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    if (!isVisible) {
      setTimeElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (timeElapsed <= 10) {
      setCurrentMessage("🔄 Waking up services...");
    } else if (timeElapsed <= 30) {
      setCurrentMessage("⏳ Services are starting (this may take up to 60 seconds)...");
    } else if (timeElapsed <= 50) {
      setCurrentMessage("🚀 Almost ready! Services are warming up...");
    } else {
      setCurrentMessage("⚡ Final preparations in progress...");
    }
  }, [timeElapsed]);

  if (!isVisible) return null;

  const progressPercentage = Math.min((timeElapsed / duration) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Animated server icon */}
          <div className="relative mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
              <FiServer className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1">
              <FiZap className="w-5 h-5 text-yellow-500 animate-bounce" />
            </div>
          </div>

          {/* Loading message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cold Start in Progress
          </h3>
          <p className="text-gray-600 mb-4">
            {currentMessage}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Time elapsed */}
          <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
            <FiClock className="w-4 h-4 mr-1" />
            <span>{timeElapsed}s elapsed</span>
            {timeElapsed > 30 && (
              <span className="ml-2 text-blue-600">
                (Services on free tier take longer to start)
              </span>
            )}
          </div>

          {/* Help text */}
          <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded">
            <p>
              💡 <strong>Why is this happening?</strong><br />
              Our services run on Render's free tier and go to sleep after 15 minutes of inactivity. 
              This is normal and ensures optimal resource usage.
            </p>
          </div>

          {/* Retry hint after significant time */}
          {timeElapsed > 70 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm">
              <p className="text-orange-800">
                Taking longer than expected? You can refresh the page to try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColdStartLoader; 