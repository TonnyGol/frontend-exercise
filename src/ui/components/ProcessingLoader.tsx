import React from 'react';
import '../style/ProcessingLoader.css';

export const ProcessingLoader: React.FC = () => {
  return (
    <div className="bad-snail-loader">
      <figure className="iconLoaderProgress">
        <svg className="iconLoaderProgressFirst" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="100"></circle>
        </svg>
        <svg className="iconLoaderProgressSecond" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="100"></circle>
        </svg>
      </figure>
    </div>
  );
};
