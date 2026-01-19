import React, { FC, useEffect, useState } from "react";
import { Button, Modal, notification, Space, Tag, Tooltip } from "antd";
import { useGetAccounts } from "../utils/hooks";
import { AuthTokenType, AccountProps } from "../utils/types";
import { getAuthToken, getAccounts } from "../utils/functions";
import AddAccountForm from "../components/AddAccountForm";
import HorizonTable, { HorizonTableColumn } from "../components/HorizonTable";
import axios from "axios";
import { AccountsUrl } from "../utils/network";
import dayjs from "dayjs";
import { 
  BankOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";

const Account: FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountProps | null>(null);
  const [fetching, setFetching] = useState(true);
  const [accounts, setAccounts] = useState<AccountProps[] | undefined>();

  useGetAccounts(setAccounts, setFetching);

  const getStatusColor = (active: boolean) => {
    return active ? 'success' : 'error';
  };

  const getStatusIcon = (active: boolean) => {
    return active ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
  };

  const columns: HorizonTableColumn[] = [
    {
      key: 'account',
      title: 'Account',
      dataIndex: 'account_name',
      width: 300,
      sorter: true,
      filterable: false,
      searchable: true,
      fixed: 'left',
      render: (account_name: string, record: AccountProps) => (
        <Space>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '6px',
            backgroundColor: record.active ? '#f6ffed' : '#fff2f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: record.active ? '#52c41a' : '#ff4d4f'
          }}>
            <BankOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#2d3748' }}>{account_name}</div>
            <div style={{ fontSize: '11px', color: '#718096' }}>
              Account ID: {record.id}
            </div>
          </div>
        </Space>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'active',
      width: 120,
      sorter: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Active', value: true },
        { label: 'Inactive', value: false },
      ],
      render: (active: boolean) => (
        <Tag 
          color={getStatusColor(active)}
          icon={getStatusIcon(active)}
          style={{ borderRadius: '6px' }}
        >
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      dataIndex: 'created_at',
      width: 160,
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
      key: 'updated_at',
      title: 'Last Updated',
      dataIndex: 'updated_at',
      width: 160,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (updated_at: any) => (
        <Space>
          <CalendarOutlined style={{ color: '#666' }} />
          <span>{dayjs(updated_at).format('MMM DD, YYYY')}</span>
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
      render: (_, record: AccountProps) => (
        <Space>
          <Tooltip title="Edit Account">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              className="action-btn edit-btn"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Account">
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
    setEditingAccount(null);
  };

  useEffect(() => {
    if (editingAccount) {
      setDrawerVisible(true);
    }
  }, [editingAccount]);

  const handleEdit = (record: AccountProps) => {
    setEditingAccount(record);
  };

  const handleDeleteSingle = (accountId: number) => {
    setAccountToDelete(accountId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    
    setDeletingAccount(true);
    try {
      const headers = getAuthToken() as AuthTokenType;
      await axios.delete(`${AccountsUrl}/${accountToDelete}`, {
        headers: headers.headers
      });
      getAccounts(setAccounts, setFetching);
      notification.success({
        message: "Success",
        description: "Account deleted successfully",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete account",
      });
    } finally {
      setDeletingAccount(false);
      setDeleteModalVisible(false);
      setAccountToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setAccountToDelete(null);
  };

  const handleDeleteSelected = async (selectedKeys: React.Key[]) => {
    try {
      const headers = getAuthToken() as AuthTokenType;
      await Promise.all(
        selectedKeys.map(accountId => 
          axios.delete(`${AccountsUrl}/${accountId}`, {
            headers: headers.headers
          })
        )
      );
      getAccounts(setAccounts, setFetching);
      notification.success({
        message: "Success",
        description: `${selectedKeys.length} account(s) deleted successfully`,
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete selected accounts",
      });
    }
  };

  const handleRefresh = () => {
    getAccounts(setAccounts, setFetching);
  };

  const onCreateAccount = () => {
    setDrawerVisible(true);
    setEditingAccount(null);
  };

  return (
    <div className="horizon-page">
      <div className="page-header">
        <Space align="center">
          <BankOutlined className="page-icon" />
          <div>
            <h2 className="page-title">Account Management</h2>
            <p className="page-subtitle">Manage your accounts and their status</p>
          </div>
        </Space>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onCreateAccount}
          size="large"
          className="horizon-primary-btn"
        >
          Add Account
        </Button>
      </div>

      <HorizonTable
        columns={columns}
        dataSource={accounts || []}
        loading={fetching}
        showSearch={true}
        showFilters={true}
        showExport={true}
        showRefresh={true}
        showDelete={true}
        showColumnSettings={true}
        onRefresh={handleRefresh}
        onDelete={handleDeleteSelected}
        searchPlaceholder="Search accounts by name..."
        exportFileName="accounts"
        rowKey="id"
      />

      <AddAccountForm
        onSuccessCallBack={() => {
          setDrawerVisible(false);
          getAccounts(setAccounts, setFetching);
        }}
        isVisible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        editingAccount={editingAccount}
        onCloseWithoutEditing={onCloseWithoutEditing}
      />

      <Modal
        title="Delete Account"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
        confirmLoading={deletingAccount}
        className="horizon-modal"
        width={400}
        centered
      >
        <p style={{ margin: '12px 0' }}>Are you sure you want to delete this account?</p>
      </Modal>
    </div>
  );
};

export default Account;