import React from 'react';

export default function Logo({ className }: { className?: string }) {
  // Simple logo component: prefers an image file in public/assets, falls back to text
  const src = '/assets/icons/u4-logo.png';
  return (
    <div className={className}>
      <img src={src} alt="U4 Green Africa" className={`w-full h-full object-cover rounded-full ${className || ''}`} />
    </div>
  );
}
