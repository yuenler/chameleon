import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDragon } from '@fortawesome/free-solid-svg-icons';

interface ChameleonIconProps {
  className?: string;
}

const ChameleonIcon: React.FC<ChameleonIconProps> = ({ className = '' }) => {
  return (
    <FontAwesomeIcon icon={faDragon} className={className} />
  );
};

export default ChameleonIcon;
