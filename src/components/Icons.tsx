import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCopy,
  faRotate,
  faUserCheck,
  faClock,
  faUserMinus
} from '@fortawesome/free-solid-svg-icons';

interface IconProps {
  className?: string;
}

export const ArrowBackIcon: React.FC<IconProps> = ({ className }) => {
  return <FontAwesomeIcon icon={faArrowLeft} className={className} />;
};

export const CopyIcon: React.FC<IconProps> = ({ className }) => {
  return <FontAwesomeIcon icon={faCopy} className={className} />;
};

export const RefreshIcon: React.FC<IconProps> = ({ className }) => {
  return <FontAwesomeIcon icon={faRotate} className={className} />;
};

export const UserCheckIcon: React.FC<IconProps> = ({ className }) => {
  return <FontAwesomeIcon icon={faUserCheck} className={className} />;
};

export const UserClockIcon: React.FC<IconProps> = ({ className }) => {
  return <FontAwesomeIcon icon={faClock} className={className} />;
};

export const UserMinusIcon: React.FC<IconProps> = ({ className }) => {
  return <FontAwesomeIcon icon={faUserMinus} className={className} />;
};
