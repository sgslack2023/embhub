import React, { useState, useEffect } from 'react';
import { Menu, Avatar, Typography, Space, Button, Divider } from 'antd';
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
  DollarOutlined,
  AppstoreOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { logout } from '../utils/functions';
import logo from '../assets/logo.png';

const { Text, Title } = Typography;

const MysideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('token1');
  const fullname = localStorage.getItem('token3');

  // Determine which submenu should be open based on current path
  const getOpenKeys = () => {
    const path = location.pathname;
    if (['/products', '/expenses', '/packing-slips'].includes(path)) {
      return ['fulfillment'];
    }
    if (['/accounts', '/googledrive-settings', '/users'].includes(path)) {
      return ['settings'];
    }
    return [];
  };

  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys());

  useEffect(() => {
    setOpenKeys(getOpenKeys());
  }, [location.pathname]);

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/emb-hub',
      icon: <DatabaseOutlined />,
      label: 'EMB HUB',
    },
    {
      key: 'fulfillment',
      icon: <AppstoreOutlined />,
      label: 'Fulfillment',
      children: [
        {
          key: '/products',
          icon: <ShoppingOutlined />,
          label: 'Product Master',
        },
        {
          key: '/expenses',
          icon: <DollarOutlined />,
          label: 'Expenses',
        },
        {
          key: '/packing-slips',
          icon: <DeliveredProcedureOutlined />,
          label: 'Orders',
        },
      ],
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      children: [
        {
          key: '/accounts',
          icon: <BankOutlined />,
          label: 'Accounts',
        },
        {
          key: '/googledrive-settings',
          icon: <CloudOutlined />,
          label: 'Google Drive',
        },
        {
          key: '/users',
          icon: <TeamOutlined />,
          label: 'Users',
        },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key && !['fulfillment', 'settings'].includes(key)) {
      navigate(key);
    }
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
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          onClick={handleMenuClick}
          className="horizon-menu"
          items={menuItems}
        />
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