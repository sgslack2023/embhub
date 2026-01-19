import React, { FC, useEffect, useState } from "react";
import { Drawer, notification, Form, Input, Button, Typography, Space, Divider, Select, DatePicker } from "antd";
import { AuthTokenType, DataProps, AddAccountFormModalProps, ExpenseProps, AccountProps } from "../utils/types";
import { getAuthToken } from "../utils/functions";
import axios, { AxiosResponse } from "axios";
import { ExpensesUrl, AccountsUrl } from "../utils/network";
import dayjs from "dayjs";
import { 
  DollarOutlined, 
  SaveOutlined,
  PlusOutlined,
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ShoppingCartOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface AddExpenseFormProps extends AddAccountFormModalProps {
  editingExpense?: ExpenseProps | null;
}

const AddExpenseForm: FC<AddExpenseFormProps> = ({
  isVisible = false,
  onSuccessCallBack,
  onClose,
  editingExpense,
  onCloseWithoutEditing,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [accounts, setAccounts] = useState<AccountProps[]>([]);

  const handleFormClose = () => {
    form.resetFields();
    onClose?.();
    if (!form.isFieldsTouched()) {
      onCloseWithoutEditing?.();
    }
  };

  // Fetch accounts for dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const authToken = getAuthToken() as AuthTokenType;
        const response = await axios.get(AccountsUrl, authToken);
        setAccounts(response.data);
      } catch (error) {
        notification.error({
          message: "Error",
          description: "Failed to fetch accounts",
        });
      }
    };
    
    if (isVisible) {
      fetchAccounts();
    }
  }, [isVisible]);

  useEffect(() => {
    if (editingExpense) {
      form.setFieldsValue({
        ...editingExpense,
        date: editingExpense.date ? dayjs(editingExpense.date) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
      });
    }
  }, [editingExpense, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    const headers = getAuthToken() as AuthTokenType;

    // Format date to YYYY-MM-DD
    const formattedValues = {
      ...values,
      date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null,
    };

    try {
      let response: AxiosResponse;

      if (editingExpense) {
        response = await axios.put(`${ExpensesUrl}/${editingExpense.id}`, formattedValues, headers);
      } else {
        response = await axios.post(ExpensesUrl, formattedValues, headers);
      }

      setLoading(false);

      if (response) {
        notification.success({
          message: "Success",
          description: editingExpense ? "Expense updated successfully" : "Expense created successfully",
        });
        form.resetFields();
        onSuccessCallBack?.();
        onClose?.();
      }
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.response?.data?.error || (editingExpense ? "Failed to update expense" : "Failed to create expense"),
      });
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <div className="drawer-header">
          <Space>
            {editingExpense ? <ShoppingCartOutlined /> : <PlusOutlined />}
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {editingExpense ? "Edit Expense" : "Add New Expense"}
              </Title>
              <Text type="secondary">
                {editingExpense ? "Update expense information" : "Record a new expense"}
              </Text>
            </div>
          </Space>
        </div>
      }
      open={isVisible}
      onClose={handleFormClose}
      destroyOnClose
      width={480}
      className="horizon-drawer"
    >
      <Divider />
      
      <Form 
        layout="vertical" 
        onFinish={onSubmit} 
        form={form} 
        onValuesChange={() => setHasChanges(true)}
        className="horizon-form"
      >
        <Form.Item
          label={
            <Space>
              <BankOutlined />
              <Text strong>Account</Text>
            </Space>
          }
          name="account"
          rules={[
            { required: true, message: 'Please select an account!' }
          ]}
        >
          <Select 
            placeholder="Select account" 
            size="large"
            className="horizon-select"
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
            }
          >
            {accounts.map((account) => (
              <Option key={account.id} value={account.id}>
                {account.account_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <ShoppingCartOutlined />
              <Text strong>Expense Type</Text>
            </Space>
          }
          name="expense_type"
          rules={[
            { required: true, message: 'Please select an expense type!' }
          ]}
        >
          <Select 
            placeholder="Select expense type" 
            size="large"
            className="horizon-select"
          >
            <Option value="shipping">🚚 Shipping</Option>
            <Option value="materials">📦 Materials</Option>
            <Option value="labor">👷 Labor</Option>
            <Option value="utilities">⚡ Utilities</Option>
            <Option value="rent">🏢 Rent</Option>
            <Option value="marketing">📢 Marketing</Option>
            <Option value="software">💻 Software</Option>
            <Option value="supplies">📋 Supplies</Option>
            <Option value="maintenance">🔧 Maintenance</Option>
            <Option value="other">📝 Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <CalendarOutlined />
              <Text strong>Date</Text>
            </Space>
          }
          name="date"
          rules={[
            { required: true, message: 'Please select a date!' }
          ]}
        >
          <DatePicker 
            size="large"
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <DollarOutlined />
              <Text strong>Amount</Text>
            </Space>
          }
          name="amount"
          rules={[
            { required: true, message: 'Please input the amount!' },
            { 
              validator: (_, value) => {
                if (value && value <= 0) {
                  return Promise.reject('Amount must be greater than 0');
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input 
            placeholder="Enter amount" 
            size="large"
            type="number"
            step="0.01"
            prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <FileTextOutlined />
              <Text strong>Description (Optional)</Text>
            </Space>
          }
          name="description"
        >
          <TextArea 
            placeholder="Enter expense description or notes" 
            rows={3}
            className="horizon-input"
          />
        </Form.Item>

        <Divider />

        <Form.Item style={{ marginBottom: 0 }}>
          <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button 
              onClick={handleFormClose}
              size="large"
              className="horizon-secondary-btn"
            >
              Cancel
            </Button>
            <Button 
              htmlType="submit" 
              type="primary" 
              loading={loading}
              size="large"
              icon={editingExpense ? <SaveOutlined /> : <PlusOutlined />}
              className="horizon-primary-btn"
            >
              {editingExpense ? "Update Expense" : "Create Expense"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AddExpenseForm;

