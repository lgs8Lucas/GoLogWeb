import React from 'react';
import './ui.css';

/** Placeholder animado enquanto dados carregam. */
const Skeleton = ({ height = 16, width = '100%', radius = 8, className = '' }) => (
  <div className={`ui-skeleton ${className}`} style={{ height, width, borderRadius: radius }} aria-hidden="true" />
);

export default Skeleton;
