import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ title, onMenuClick }) {
  const { user } = useAuth();
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Open navigation">
          ☰
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <div className="topbar-user">
          <div className="avatar small">{(user?.name || '?').charAt(0).toUpperCase()}</div>
          <span>{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
