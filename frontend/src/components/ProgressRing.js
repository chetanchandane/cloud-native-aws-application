import React from 'react';
import '../styles/ProgressRing.css';

const ProgressRing = ({ radius, stroke, progress, color, label, unit }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-container">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="progress-ring"
      >
        <circle
          stroke="#eee"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="progress-ring__circle"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          fontSize="16"
          fill="#333"
          transform="rotate(90, 60, 60)"
        >
          {`${Math.round(progress)}%`}
        </text>
      </svg>
      <div className="ring-label">{label} {unit && `(${unit})`}</div>
    </div>
  );
};

export default ProgressRing;
