import React, { FC, useEffect, useState } from "react";
import { Drawer, notification, Form, Input, Select, Button, Typography, Space, Divider } from "antd";
import { AuthTokenType, DataProps, AddUserFormModalProps, UserProps } from "../utils/types";
import { getAuthToken } from "../utils/functions";
import axios, { AxiosResponse } from "axios";
import { CreateUserUrl, UsersUrl } from "../utils/network";
import { 
  UserOutlined, 
  MailOutlined, 
  CrownOutlined,
  SaveOutlined,
  PlusOutlined
} from "@ant-design/icons";

const { Option } = Select;
const { Title, Text } = Typography;

interface AddUserFormProps extends AddUserFormModalProps {
  editingUser?: UserProps | null;
}

const AddUserForm: FC<AddUserFormProps> = ({
  isVisible = false,
  onSuccessCallBack,
  onClose,
  editingUser,
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
    if (editingUser) {
      form.setFieldsValue(editingUser);
    } else {
      form.resetFields();
    }
  }, [editingUser, form]);

  const onSubmit = async (values: DataProps) => {
    setLoading(true);
    const headers = getAuthToken() as AuthTokenType;

    try {
      let response: AxiosResponse;

      if (editingUser) {
        response = await axios.put(`${UsersUrl}/${editingUser.id}`, values, headers);
      } else {
        response = await axios.post(CreateUserUrl, values, headers);
      }

      setLoading(false);

      if (response) {
        notification.success({
          message: "Success",
          description: editingUser ? "User updated successfully" : "User created successfully",
        });
        onSuccessCallBack?.();
        onClose?.();
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: editingUser ? "Failed to update user" : "Failed to create user",
      });
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <div className="drawer-header">
          <Space>
            {editingUser ? <UserOutlined /> : <PlusOutlined />}
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {editingUser ? "Edit User" : "Add New User"}
              </Title>
              <Text type="secondary">
                {editingUser ? "Update user information" : "Create a new user account"}
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
      >
        <Form.Item
          label={
            <Space>
              <UserOutlined />
              <Text strong>Full Name</Text>
            </Space>
          }
          name="fullname"
          rules={[
            { required: true, message: 'Please input the full name!' },
            { min: 2, message: 'Name must be at least 2 characters!' }
          ]}
        >
          <Input 
            placeholder="Enter full name" 
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <MailOutlined />
              <Text strong>Email Address</Text>
            </Space>
          }
          name="email"
          rules={[
            { required: true, message: 'Please input the email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input 
            placeholder="Enter email address" 
            type="email"
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <CrownOutlined />
              <Text strong>User Role</Text>
            </Space>
          }
          name="role"
          rules={[{ required: true, message: 'Please select the role!' }]}
        >
          <Select 
            placeholder="Select user role" 
            size="large"
            className="horizon-select"
          >
            <Option value="admin">
              <Space>
                <CrownOutlined style={{ color: '#ff4d4f' }} />
                Administrator
              </Space>
            </Option>
            <Option value="manager">
              <Space>
                <UserOutlined style={{ color: '#1890ff' }} />
                Manager
              </Space>
            </Option>
            <Option value="salesperson">
              <Space>
                <UserOutlined style={{ color: '#52c41a' }} />
                Salesperson
              </Space>
            </Option>
          </Select>
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
              icon={editingUser ? <SaveOutlined /> : <PlusOutlined />}
              className="horizon-primary-btn"
            >
              {editingUser ? "Update User" : "Create User"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AddUserForm;