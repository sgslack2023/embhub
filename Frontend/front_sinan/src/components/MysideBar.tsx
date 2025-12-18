import React from 'react';
import { Menu, Avatar, Typography, Space, Button, Tooltip, Divider } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  DashboardOutlined,
  CloudOutlined,
  DatabaseOutlined,
  ShoppingOutlined,
  BankOutlined,
  DeliveredProcedureOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { logout } from '../utils/functions';
import logo from '../assets/logo.png';

const { Text, Title } = Typography;

const MysideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('token1');
  const fullname = localStorage.getItem('token3');

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/'
    },
    
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: 'Product Master',
      path: '/products'
    },
    {
      key: '/accounts',
      icon: <BankOutlined />,
      label: 'Accounts',
      path: '/accounts'
    },
    {
      key: '/expenses',
      icon: <DollarOutlined />,
      label: 'Expenses',
      path: '/expenses'
    },
    {
      key: '/packing-slips',
      icon: <DeliveredProcedureOutlined />,
      label: 'Orders',
      path: '/packing-slips'
    },
    {
      key: '/googledrive-settings',
      icon: <CloudOutlined />,
      label: 'Google Drive Settings',
      path: '/googledrive-settings'
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: 'Users',
      path: '/users'
    },
    {
      key: '/emb-hub',
      icon: <DatabaseOutlined />,
      label: 'EMB HUB',
      path: '/emb-hub'
    }
  ];

  const handleMenuClick = (item: any) => {
    navigate(item.path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="horizon-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo-section">
          <img src={logo} alt="logo" className="sidebar-logo" />
          <div className="brand-text">
            <Title level={4} className="brand-title">EMBHub</Title>
            <Text className="brand-subtitle">Management System</Text>
          </div>
        </div>
      </div>

      <Divider className="sidebar-divider" />

      {/* User Profile Section */}
      <div className="user-profile-section">
        <Space direction="horizontal" align="center">
          <Avatar 
            size={48} 
            icon={<UserOutlined />} 
            className="user-avatar"
          />
          <div className="user-info">
            <Text strong className="user-name">{fullname || 'User'}</Text>
            <Text className="user-role">{userRole || 'Member'}</Text>
          </div>
        </Space>
      </div>

      <Divider className="sidebar-divider" />

      {/* Navigation Menu */}
      <div className="sidebar-menu">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          className="horizon-menu"
        >
          {menuItems.map(item => (
            <Menu.Item
              key={item.key}
              icon={item.icon}
              onClick={() => handleMenuClick(item)}
              className="menu-item"
            >
              {item.label}
            </Menu.Item>
          ))}
        </Menu>
      </div>

      {/* Logout Section */}
      <div className="sidebar-footer">
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          className="logout-btn"
          block
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default MysideBar;