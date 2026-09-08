import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/donations', label: 'Donations', icon: '🙏' },
  { to: '/expenses', label: 'Expenses', icon: '🧾' },
  { to: '/vendors', label: 'Vendors & Suppliers', icon: '🛒' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/team', label: 'Team Management', icon: '👥' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/announcements', label: 'Announcements', icon: '📣' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-emoji">🐘</div>
        <div className="brand-title">Ganesh Chaturthi</div>
        <div className="brand-subtitle">Event Portal</div>
        <div className="brand-tagline">Plan | Manage | Celebrate</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{(user?.name || '?').charAt(0).toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
