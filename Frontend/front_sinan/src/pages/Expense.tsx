import React, { FC, useState } from "react";
import { Button, Modal, notification, Space, Tag, Tooltip } from "antd";
import { AuthTokenType, ExpenseProps } from "../utils/types";
import { getAuthToken } from "../utils/functions";
import AddExpenseForm from "../components/AddExpenseForm";
import HorizonTable, { HorizonTableColumn } from "../components/HorizonTable";
import axios from "axios";
import { ExpensesUrl } from "../utils/network";
import dayjs from "dayjs";
import { 
  DollarOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  CalendarOutlined,
  BankOutlined,
  ShoppingCartOutlined,
  FileTextOutlined
} from "@ant-design/icons";

const Expense: FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [deletingExpense, setDeletingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseProps | null>(null);
  const [fetching, setFetching] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseProps[]>([]);

  const formatCurrency = (amount: string | number) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const getExpenses = () => {
    setFetching(true);
    const authToken = getAuthToken() as AuthTokenType;
    axios.get(ExpensesUrl, authToken)
      .then((res) => {
        setExpenses(res.data);
        setFetching(false);
      })
      .catch((err) => {
        notification.error({
          message: "Error",
          description: "Failed to fetch expenses",
        });
        setFetching(false);
      });
  };

  React.useEffect(() => {
    getExpenses();
  }, []);

  const columns: HorizonTableColumn[] = [
    {
      key: 'account',
      title: 'Account',
      dataIndex: 'account_name',
      width: 200,
      sorter: true,
      filterable: true,
      filterType: 'text',
      searchable: true,
      fixed: 'left',
      render: (account_name: string) => (
        <Space>
          <BankOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
          <span style={{ fontWeight: 600, color: '#2d3748' }}>{account_name}</span>
        </Space>
      ),
    },
    {
      key: 'expense_type',
      title: 'Expense Type',
      dataIndex: 'expense_type_display',
      width: 180,
      sorter: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Shipping', value: 'shipping' },
        { label: 'Materials', value: 'materials' },
        { label: 'Labor', value: 'labor' },
        { label: 'Utilities', value: 'utilities' },
        { label: 'Rent', value: 'rent' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Software', value: 'software' },
        { label: 'Supplies', value: 'supplies' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Other', value: 'other' },
      ],
      render: (type: string, record: any) => {
        const getTypeConfig = (type: string) => {
          const typeMap: any = {
            'Shipping': { color: '#1890ff', icon: '🚚' },
            'Materials': { color: '#52c41a', icon: '📦' },
            'Labor': { color: '#722ed1', icon: '👷' },
            'Utilities': { color: '#fa8c16', icon: '⚡' },
            'Rent': { color: '#eb2f96', icon: '🏢' },
            'Marketing': { color: '#13c2c2', icon: '📢' },
            'Software': { color: '#2f54eb', icon: '💻' },
            'Supplies': { color: '#52c41a', icon: '📋' },
            'Maintenance': { color: '#fa541c', icon: '🔧' },
            'Other': { color: '#8c8c8c', icon: '📝' },
          };
          return typeMap[type] || { color: '#8c8c8c', icon: '📝' };
        };
        
        const config = getTypeConfig(type);
        
        return (
          <Tag color={config.color} style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 500 }}>
            <span style={{ marginRight: '4px' }}>{config.icon}</span>
            {type}
          </Tag>
        );
      },
    },
    {
      key: 'date',
      title: 'Date',
      dataIndex: 'date',
      width: 140,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (date: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#666' }} />
          <span>{dayjs(date).format('MMM DD, YYYY')}</span>
        </Space>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      dataIndex: 'amount',
      width: 140,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (amount: string) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
          <span style={{ fontWeight: 600, color: '#52c41a', fontSize: '14px' }}>
            {formatCurrency(amount)}
          </span>
        </Space>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      width: 250,
      sorter: false,
      filterable: false,
      searchable: true,
      render: (description: string) => (
        <div style={{ maxWidth: 230 }}>
          {description ? (
            <Tooltip title={description}>
              <div style={{ 
                whiteSpace: 'nowrap',
                fontSize: '11px',
                color: '#666',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                <FileTextOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />
                {description}
              </div>
            </Tooltip>
          ) : (
            <span style={{ color: '#a0aec0', fontSize: '11px', fontStyle: 'italic' }}>
              No description
            </span>
          )}
        </div>
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
      render: (created_at: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#999' }} />
          <span style={{ fontSize: '11px', color: '#999' }}>
            {dayjs(created_at).format('MMM DD, YYYY')}
          </span>
        </Space>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      dataIndex: 'actions',
      width: 120,
      sorter: false,
      filterable: false,
      searchable: false,
      fixed: 'right',
      render: (_, record: ExpenseProps) => (
        <Space>
          <Tooltip title="Edit Expense">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              className="action-btn edit-btn"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Expense">
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
    setEditingExpense(null);
  };

  React.useEffect(() => {
    if (editingExpense) {
      setDrawerVisible(true);
    }
  }, [editingExpense]);

  const handleEdit = (record: ExpenseProps) => {
    setEditingExpense(record);
  };

  const handleDeleteSingle = (expenseId: number) => {
    setExpenseToDelete(expenseId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    
    setDeletingExpense(true);
    try {
      const headers = getAuthToken() as AuthTokenType;
      await axios.delete(`${ExpensesUrl}/${expenseToDelete}`, {
        headers: headers.headers
      });
      getExpenses();
      notification.success({
        message: "Success",
        description: "Expense deleted successfully",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete expense",
      });
    } finally {
      setDeletingExpense(false);
      setDeleteModalVisible(false);
      setExpenseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setExpenseToDelete(null);
  };

  const handleDeleteSelected = async (selectedKeys: React.Key[]) => {
    try {
      const headers = getAuthToken() as AuthTokenType;
      await Promise.all(
        selectedKeys.map(expenseId => 
          axios.delete(`${ExpensesUrl}/${expenseId}`, {
            headers: headers.headers
          })
        )
      );
      getExpenses();
      notification.success({
        message: "Success",
        description: `${selectedKeys.length} expense(s) deleted successfully`,
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete selected expenses",
      });
    }
  };

  const handleRefresh = () => {
    getExpenses();
  };

  const onCreateExpense = () => {
    setDrawerVisible(true);
    setEditingExpense(null);
  };

  return (
    <div className="horizon-page">
      <div className="page-header">
        <Space align="center">
          <ShoppingCartOutlined className="page-icon" />
          <div>
            <h2 className="page-title">Expense Management</h2>
            <p className="page-subtitle">Track and manage account expenses</p>
          </div>
        </Space>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onCreateExpense}
          size="large"
          className="horizon-primary-btn"
        >
          Add Expense
        </Button>
      </div>

      <HorizonTable
        columns={columns}
        dataSource={expenses || []}
        loading={fetching}
        showSearch={true}
        showFilters={true}
        showExport={true}
        showRefresh={true}
        showDelete={true}
        showColumnSettings={true}
        onRefresh={handleRefresh}
        onDelete={handleDeleteSelected}
        searchPlaceholder="Search expenses by account, type, or description..."
        exportFileName="expenses"
        rowKey="id"
        virtualScrollHeight={400}
      />

      <AddExpenseForm
        onSuccessCallBack={() => {
          setDrawerVisible(false);
          getExpenses();
        }}
        isVisible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        editingExpense={editingExpense}
        onCloseWithoutEditing={onCloseWithoutEditing}
      />

      <Modal
        title="Delete Expense"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
        confirmLoading={deletingExpense}
        className="horizon-modal"
        width={400}
        centered
      >
        <p style={{ margin: '12px 0' }}>Are you sure you want to delete this expense?</p>
      </Modal>
    </div>
  );
};

export default Expense;

