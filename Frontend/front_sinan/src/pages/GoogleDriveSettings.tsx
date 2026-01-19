import React, { FC, useEffect, useState } from "react";
import { Button, Modal, notification, Space, Tag, Avatar, Tooltip } from "antd";
import { useGetGoogleDriveSettings } from "../utils/hooks";
import { AuthTokenType, GoogleDriveSettingsProps } from "../utils/types";
import { getAuthToken, getGoogleDriveSettings } from "../utils/functions";
import AddGoogleDriveForm from "../components/AddGoogleDriveForm";
import HorizonTable, { HorizonTableColumn } from "../components/HorizonTable";
import axios from "axios";
import { GoogleDriveSettingsUrl } from "../utils/network";
import dayjs from "dayjs";
import { 
  MailOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CloudOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";

const GoogleDriveSettings: FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<number | null>(null);
  const [deletingSetting, setDeletingSetting] = useState(false);
  const [editingSettings, setEditingSettings] = useState<GoogleDriveSettingsProps | null>(null);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState<GoogleDriveSettingsProps[] | undefined>();

  useGetGoogleDriveSettings(setSettings, setFetching);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
  };

  const columns: HorizonTableColumn[] = [
    {
      key: 'email',
      title: 'Email Address',
      dataIndex: 'email',
      width: 300,
      sorter: true,
      filterable: true,
      filterType: 'text',
      searchable: true,
      fixed: 'left',
      render: (email: string) => (
        <Space>
          <Avatar icon={<MailOutlined />} style={{ backgroundColor: '#667eea' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#2d3748' }}>{email}</div>
          </div>
        </Space>
      ),
    },
    {
      key: 'service_account_filename',
      title: 'Service Account File',
      dataIndex: 'service_account_filename',
      width: 200,
      sorter: false,
      filterable: false,
      searchable: true,
      render: (filename: string, record: GoogleDriveSettingsProps) => (
        <Space>
          <FileTextOutlined style={{ color: '#667eea' }} />
          <span style={{ color: '#2d3748' }}>
            {filename || record.service_account_json?.split('/').pop() || 'N/A'}
          </span>
        </Space>
      ),
    },
    {
      key: 'shared_drive_name',
      title: 'Shared Drive',
      dataIndex: 'shared_drive_name',
      width: 150,
      sorter: true,
      filterable: true,
      filterType: 'text',
      searchable: true,
      render: (driveName: string) => (
        <Space>
          <CloudOutlined style={{ color: '#667eea' }} />
          <span style={{ color: '#2d3748' }}>{driveName}</span>
        </Space>
      ),
    },
    {
      key: 'root_folder_name',
      title: 'Root Folder',
      dataIndex: 'root_folder_name',
      width: 130,
      sorter: true,
      filterable: true,
      filterType: 'text',
      searchable: true,
      render: (folderName: string) => (
        <Space>
          <SettingOutlined style={{ color: '#52c41a' }} />
          <span style={{ color: '#2d3748' }}>{folderName}</span>
        </Space>
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
        { label: 'Active', value: true },
        { label: 'Inactive', value: false },
      ],
      render: (isActive: boolean) => (
        <Tag 
          color={getStatusColor(isActive)}
          icon={getStatusIcon(isActive)}
          style={{ borderRadius: '6px' }}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      key: 'created_by_name',
      title: 'Created By',
      dataIndex: 'created_by_name',
      width: 150,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (createdBy: string) => (
        <Space>
          <Avatar icon={<SettingOutlined />} size="small" style={{ backgroundColor: '#52c41a' }} />
          <span>{createdBy}</span>
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
      render: (created_at: any) => (
        <Space>
          <CalendarOutlined style={{ color: '#666' }} />
          <span>{dayjs(created_at).format('MMM DD, YYYY')}</span>
        </Space>
      ),
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
      render: (_, record: GoogleDriveSettingsProps) => (
        <Space>
          <Tooltip title="Edit Settings">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
              style={{ color: '#667eea' }}
            />
          </Tooltip>
          <Tooltip title="Delete Settings">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteSingle(record.id)}
              size="small"
              style={{ color: '#f56565' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleEdit = (setting: GoogleDriveSettingsProps) => {
    setEditingSettings(setting);
    setDrawerVisible(true);
  };

  const handleDeleteSingle = (id: number) => {
    setSettingToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!settingToDelete) return;
    
    setDeletingSetting(true);
    try {
      const headers = getAuthToken() as AuthTokenType;
      await axios.delete(`${GoogleDriveSettingsUrl}/${settingToDelete}`, {
        headers: headers.headers
      });
      
      notification.success({
        message: 'Success',
        description: 'Google Drive settings deleted successfully',
      });
      
      // Refresh the list
      setSettings(prev => prev?.filter(setting => setting.id !== settingToDelete));
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.error || 'Failed to delete Google Drive settings',
      });
    } finally {
      setDeletingSetting(false);
      setDeleteModalVisible(false);
      setSettingToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setSettingToDelete(null);
  };

  const handleDeleteSelected = async (selectedIds: React.Key[]) => {
    try {
      const headers = getAuthToken() as AuthTokenType;
      await Promise.all(
        selectedIds.map(id =>
          axios.delete(`${GoogleDriveSettingsUrl}/${id}`, {
            headers: headers.headers
          })
        )
      );
      
      notification.success({
        message: 'Success',
        description: `${selectedIds.length} Google Drive settings deleted successfully`,
      });
      
      // Refresh the list
      handleRefresh();
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.error || 'Failed to delete Google Drive settings',
      });
    }
  };

  const handleRefresh = () => {
    setFetching(true);
    getGoogleDriveSettings(setSettings, setFetching);
  };

  const handleAddNew = () => {
    setEditingSettings(null);
    setDrawerVisible(true);
  };

  const onSuccessCallBack = () => {
    setDrawerVisible(false);
    setEditingSettings(null);
    handleRefresh();
  };

  const onClose = () => {
    setDrawerVisible(false);
    setEditingSettings(null);
  };

  return (
    <div className="horizon-page">
      <div className="page-header">
        <Space align="center">
          <CloudOutlined className="page-icon" />
          <div>
            <h2 className="page-title">Google Drive Settings</h2>
            <p className="page-subtitle">Manage Google Drive service account configurations</p>
          </div>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddNew}
          className="horizon-primary-btn"
          size="large"
        >
          Add Settings
        </Button>
      </div>

      <HorizonTable
        columns={columns}
        dataSource={settings || []}
        loading={fetching}
        showSearch={true}
        showFilters={true}
        showExport={true}
        showRefresh={true}
        showDelete={true}
        showColumnSettings={true}
        onRefresh={handleRefresh}
        onDelete={handleDeleteSelected}
        searchPlaceholder="Search settings by email or filename..."
        exportFileName="googledrive_settings"
        rowKey="id"
      />

      <AddGoogleDriveForm
        isVisible={drawerVisible}
        onClose={onClose}
        onSuccessCallBack={onSuccessCallBack}
        editingSettings={editingSettings}
        onCloseWithoutEditing={onClose}
      />

      <Modal
        title="Delete Google Drive Settings"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
        confirmLoading={deletingSetting}
        className="horizon-modal"
        width={400}
        centered
      >
        <p style={{ margin: '12px 0' }}>Are you sure you want to delete these settings?</p>
      </Modal>
    </div>
  );
};

export default GoogleDriveSettings; 