import React, { FC, useEffect, useState } from "react";
import { Button, Modal, notification, Space, Tag, Avatar, Tooltip } from "antd";
import { useGetUsers } from "../utils/hooks";
import { AuthTokenType, UserProps } from "../utils/types";
import { getAuthToken, getUsers } from "../utils/functions";
import AddUserForm from "../components/AddUserForm";
import HorizonTable, { HorizonTableColumn } from "../components/HorizonTable";
import axios from "axios";
import { UsersUrl } from "../utils/network";
import dayjs from "dayjs";
import { 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  TeamOutlined,
  CalendarOutlined,
  MailOutlined,
  CrownOutlined
} from "@ant-design/icons";

const User: FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProps | null>(null);
  const [fetching, setFetching] = useState(true);
  const [users, setUsers] = useState<UserProps[] | undefined>();

  useGetUsers(setUsers, setFetching);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'red';
      case 'manager': return 'blue';
      case 'salesperson': return 'green';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return <CrownOutlined />;
      case 'manager': return <TeamOutlined />;
      default: return <UserOutlined />;
    }
  };

  const getStatusColor = (isActive: string | boolean) => {
    return isActive === 'true' || isActive === true ? 'success' : 'error';
  };

  const columns: HorizonTableColumn[] = [
    {
      key: 'user',
      title: 'User',
      dataIndex: 'user',
      width: 280,
      sorter: false,
      filterable: false,
      searchable: true,
      fixed: 'left',
      render: (_, record: UserProps) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#667eea' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#2d3748' }}>{record.fullname}</div>
            <div style={{ fontSize: '11px', color: '#718096' }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      dataIndex: 'role',
      width: 140,
      sorter: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Salesperson', value: 'salesperson' },
      ],
      render: (role: string) => (
        <Tag 
          color={getRoleColor(role)} 
          icon={getRoleIcon(role)}
          style={{ borderRadius: '6px', textTransform: 'capitalize' }}
        >
          {role}
        </Tag>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'is_active',
      width: 120,
      sorter: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
      render: (isActive: string) => (
        <Tag 
          color={getStatusColor(isActive)}
          style={{ borderRadius: '6px' }}
        >
          {isActive === 'true' ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      key: 'last_login',
      title: 'Last Login',
      dataIndex: 'last_login',
      width: 160,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (lastLogin: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#666' }} />
          <span>{lastLogin || 'Never'}</span>
        </Space>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      dataIndex: 'created_at',
      width: 140,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (created_at: any) => dayjs(created_at).format('MMM DD, YYYY'),
    },
    {
      key: 'actions',
      title: 'Actions',
      dataIndex: 'actions',
      width: 140,
      sorter: false,
      filterable: false,
      searchable: false,
      fixed: 'right',
      render: (_, record: UserProps) => (
        <Space>
          <Tooltip title="Edit User">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              className="action-btn edit-btn"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete User">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteSingle(record.id)}
              className="action-btn delete-btn"
              danger
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const onCloseWithoutEditing = () => {
    setEditingUser(null);
  };

  useEffect(() => {
    if (editingUser) {
      setDrawerVisible(true);
    }
  }, [editingUser]);

  const handleEdit = (record: UserProps) => {
    setEditingUser(record);
  };

  const handleDeleteSingle = (userId: number) => {
    setUserToDelete(userId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setDeletingUser(true);
    try {
      const headers = getAuthToken() as AuthTokenType;
      await axios.delete(`${UsersUrl}/${userToDelete}`, {
        headers: headers.headers
      });
      getUsers(setUsers, setFetching);
      notification.success({
        message: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete user",
      });
    } finally {
      setDeletingUser(false);
      setDeleteModalVisible(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setUserToDelete(null);
  };

  const handleDeleteSelected = async (selectedKeys: React.Key[]) => {
    try {
      const headers = getAuthToken() as AuthTokenType;
      await Promise.all(
        selectedKeys.map(userId => 
          axios.delete(`${UsersUrl}/${userId}`, {
            headers: headers.headers
          })
        )
      );
      getUsers(setUsers, setFetching);
      notification.success({
        message: "Success",
        description: `${selectedKeys.length} user(s) deleted successfully`,
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete selected users",
      });
    }
  };

  const handleRefresh = () => {
    getUsers(setUsers, setFetching);
  };

  const onCreateUser = () => {
    setDrawerVisible(true);
    setEditingUser(null);
  };

  return (
    <div className="horizon-page">
      <div className="page-header">
        <Space align="center">
          <TeamOutlined className="page-icon" />
          <div>
            <h2 className="page-title">User Management</h2>
            <p className="page-subtitle">Manage your team members and their permissions</p>
          </div>
        </Space>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onCreateUser}
          size="large"
          className="horizon-primary-btn"
        >
          Add User
        </Button>
      </div>

      <HorizonTable
        columns={columns}
        dataSource={users || []}
        loading={fetching}
        showSearch={true}
        showFilters={true}
        showExport={true}
        showRefresh={true}
        showDelete={true}
        showColumnSettings={true}
        onRefresh={handleRefresh}
        onDelete={handleDeleteSelected}
        searchPlaceholder="Search users by name, email, or role..."
        exportFileName="users"
        rowKey="id"
      />

      <AddUserForm
        onSuccessCallBack={() => {
          setDrawerVisible(false);
          getUsers(setUsers, setFetching);
        }}
        isVisible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        editingUser={editingUser}
        onCloseWithoutEditing={onCloseWithoutEditing}
      />

      <Modal
        title="Delete User"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
        confirmLoading={deletingUser}
        className="horizon-modal"
        width={400}
        centered
      >
        <p style={{ margin: '12px 0' }}>Are you sure you want to delete this user?</p>
      </Modal>
    </div>
  );
};

export default User;