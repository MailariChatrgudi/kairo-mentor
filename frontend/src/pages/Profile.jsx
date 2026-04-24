import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Settings, Bell, HelpCircle, LogOut, Award, BookOpen, Target } from 'lucide-react';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import BottomNav from '../components/BottomNav';
import './Profile.css';

const stats = [
  { icon: BookOpen, label: 'Courses', value: '3' },
  { icon: Target, label: 'Goals Set', value: '5' },
  { icon: Award, label: 'Badges', value: '2' },
];

const menuItems = [
  { icon: Settings, label: 'Settings' },
  { icon: Bell, label: 'Notifications' },
  { icon: HelpCircle, label: 'Help & Support' },
  { icon: LogOut, label: 'Log Out', danger: true },
];

const Profile = () => {
  return (
    <div className="profile-page">
      <TopBar title="Profile" />

      <div className="profile-page__content">
        {/* Avatar Section */}
        <motion.div
          className="profile-page__hero"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="profile-page__avatar">
            <span>S</span>
          </div>
          <h2 className="profile-page__name">Student</h2>
          <p className="profile-page__email">student@kairo.ai</p>
        </motion.div>

        {/* Stats Row */}
        <div className="profile-page__stats">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="profile-page__stat">
              <Icon size={20} color="#C8A951" strokeWidth={1.5} />
              <span className="profile-page__stat-value">{value}</span>
              <span className="profile-page__stat-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Menu */}
        <Card className="profile-page__menu-card" hoverable={false}>
          {menuItems.map(({ icon: Icon, label, danger }, i) => (
            <button
              key={label}
              className={`profile-page__menu-item ${danger ? 'profile-page__menu-item--danger' : ''}`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span>{label}</span>
              <ChevronRight size={16} color="#D0D0D0" />
            </button>
          ))}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
