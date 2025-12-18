import React, { FC, useEffect, useState } from "react";
import { Drawer, notification, Form, Input, Button, Typography, Space, Divider, Switch } from "antd";
import { AuthTokenType, DataProps, AddAccountFormModalProps, AccountProps } from "../utils/types";
import { getAuthToken } from "../utils/functions";
import axios, { AxiosResponse } from "axios";
import { AccountsUrl } from "../utils/network";
import { 
  BankOutlined, 
  SaveOutlined,
  PlusOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface AddAccountFormProps extends AddAccountFormModalProps {
  editingAccount?: AccountProps | null;
}

const AddAccountForm: FC<AddAccountFormProps> = ({
  isVisible = false,
  onSuccessCallBack,
  onClose,
  editingAccount,
  onCloseWithoutEditing,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFormClose = () => {
    form.resetFields();
    onClose?.();
    if (!form.isFieldsTouched()) {
      onCloseWithoutEditing?.();
    }
  };

  useEffect(() => {
    if (editingAccount) {
      form.setFieldsValue(editingAccount);
    } else {
      form.resetFields();
    }
  }, [editingAccount, form]);

  const onSubmit = async (values: DataProps) => {
    setLoading(true);
    const headers = getAuthToken() as AuthTokenType;

    try {
      let response: AxiosResponse;

      if (editingAccount) {
        response = await axios.put(`${AccountsUrl}/${editingAccount.id}`, values, headers);
      } else {
        response = await axios.post(AccountsUrl, values, headers);
      }

      setLoading(false);

      if (response) {
        notification.success({
          message: "Success",
          description: editingAccount ? "Account updated successfully" : "Account created successfully",
        });
        form.resetFields();
        onSuccessCallBack?.();
        onClose?.();
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: editingAccount ? "Failed to update account" : "Failed to create account",
      });
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <div className="drawer-header">
          <Space>
            {editingAccount ? <BankOutlined /> : <PlusOutlined />}
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {editingAccount ? "Edit Account" : "Add New Account"}
              </Title>
              <Text type="secondary">
                {editingAccount ? "Update account information" : "Create a new account"}
              </Text>
            </div>
          </Space>
        </div>
      }
      open={isVisible}
      onClose={handleFormClose}
      destroyOnClose
      width={420}
      className="horizon-drawer"
    >
      <Divider />
      
      <Form 
        layout="vertical" 
        onFinish={onSubmit} 
        form={form} 
        onValuesChange={() => setHasChanges(true)}
        className="horizon-form"
        initialValues={{ active: true }}
      >
        <Form.Item
          label={
            <Space>
              <BankOutlined />
              <Text strong>Account Name</Text>
            </Space>
          }
          name="account_name"
          rules={[
            { required: true, message: 'Please input the account name!' },
            { min: 2, message: 'Name must be at least 2 characters!' }
          ]}
        >
          <Input 
            placeholder="Enter account name" 
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <CheckCircleOutlined />
              <Text strong>Account Status</Text>
            </Space>
          }
          name="active"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            size="default"
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
              icon={editingAccount ? <SaveOutlined /> : <PlusOutlined />}
              className="horizon-primary-btn"
            >
              {editingAccount ? "Update Account" : "Create Account"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AddAccountForm;