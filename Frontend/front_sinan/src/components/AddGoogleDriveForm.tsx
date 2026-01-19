import React, { useEffect, useState } from "react";
import { Drawer, Form, Button, notification, Input, Upload, Switch, Typography, Space } from "antd";
import { AddGoogleDriveFormModalProps, AuthTokenType, GoogleDriveSettingsProps } from "../utils/types";
import { getAuthToken } from "../utils/functions";
import axios from "axios";
import { CreateGoogleDriveSettingsUrl, GoogleDriveSettingsUrl } from "../utils/network";
import { 
  MailOutlined, 
  CloudUploadOutlined, 
  FileTextOutlined, 
  SaveOutlined, 
  CloseOutlined,
  CloudOutlined,
  SettingOutlined,
  KeyOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Dragger } = Upload;

const AddGoogleDriveForm: React.FC<AddGoogleDriveFormModalProps> = ({
  isVisible = false,
  onClose,
  onSuccessCallBack,
  editingSettings,
  onCloseWithoutEditing,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const isEditing = !!editingSettings;

  useEffect(() => {
    if (isVisible && editingSettings) {
      form.setFieldsValue({
        email: editingSettings.email,
        shared_drive_name: editingSettings.shared_drive_name,
        root_folder_name: editingSettings.root_folder_name,
        track123_api_key: editingSettings.track123_api_key || '',
        is_active: editingSettings.is_active,
      });
      // Note: We can't pre-populate the file field for security reasons
      setFileList([]);
    } else if (isVisible) {
      form.resetFields();
      setFileList([]);
    }
  }, [isVisible, editingSettings, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    try {
      const headers = getAuthToken() as AuthTokenType;
      const formData = new FormData();
      
      formData.append('email', values.email);
      formData.append('shared_drive_name', values.shared_drive_name || 'EMB Test');
      formData.append('root_folder_name', values.root_folder_name || 'EMB');
      // Only append track123_api_key if it's provided (not empty)
      if (values.track123_api_key && values.track123_api_key.trim()) {
        formData.append('track123_api_key', values.track123_api_key.trim());
      } else if (isEditing) {
        // When editing, if empty, send empty string to clear it
        formData.append('track123_api_key', '');
      }
      formData.append('is_active', values.is_active ? 'true' : 'false');
      
      if (fileList.length > 0) {
        formData.append('service_account_json', fileList[0].originFileObj || fileList[0]);
      } else if (isEditing && !fileList.length) {
        // If editing and no new file uploaded, don't include file field
      } else if (!isEditing) {
        notification.error({
          message: 'Error',
          description: 'Please upload a service account JSON file',
        });
        setLoading(false);
        return;
      }

      let response;
      if (isEditing) {
        response = await axios.put(
          `${GoogleDriveSettingsUrl}/${editingSettings?.id}`,
          formData,
          {
            headers: {
              ...headers.headers,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        response = await axios.post(
          CreateGoogleDriveSettingsUrl,
          formData,
          {
            headers: {
              ...headers.headers,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      notification.success({
        message: 'Success',
        description: isEditing 
          ? 'Google Drive settings updated successfully' 
          : 'Google Drive settings created successfully',
      });

      onSuccessCallBack();
      form.resetFields();
      setFileList([]);
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} Google Drive settings`,
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    accept: '.json',
    beforeUpload: (file: any) => {
      const isJSON = file.type === 'application/json' || file.name.endsWith('.json');
      if (!isJSON) {
        notification.error({
          message: 'Invalid file type',
          description: 'Please upload a JSON file',
        });
        return false;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        notification.error({
          message: 'File too large',
          description: 'File must be smaller than 5MB',
        });
        return false;
      }

      setFileList([file]);
      // Trigger form validation for the file field
      form.validateFields(['service_account_json']);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setFileList([]);
      // Trigger form validation for the file field
      form.validateFields(['service_account_json']);
    },
  };

  return (
    <Drawer
      title={
        <Space align="center">
          <CloudOutlined style={{ color: '#667eea', fontSize: '20px' }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#2d3748' }}>
              {isEditing ? 'Edit Google Drive Settings' : 'Add Google Drive Settings'}
            </Title>
            <Text style={{ color: '#718096', fontSize: '12px' }}>
              {isEditing 
                ? 'Update Google Drive service account configuration' 
                : 'Configure Google Drive service account for API access'
              }
            </Text>
          </div>
        </Space>
      }
      width={600}
      onClose={onCloseWithoutEditing}
      open={isVisible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button 
            onClick={onCloseWithoutEditing} 
            style={{ marginRight: 8 }}
            icon={<CloseOutlined />}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
            className="horizon-primary-btn"
            icon={<SaveOutlined />}
          >
            {isEditing ? 'Update Settings' : 'Create Settings'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="horizon-form"
        initialValues={{ 
          is_active: true,
          shared_drive_name: 'EMB Test',
          root_folder_name: 'EMB'
        }}
      >
        <Form.Item
          label={
            <Space>
              <MailOutlined style={{ color: '#667eea' }} />
              <Text strong>Email Address</Text>
            </Space>
          }
          name="email"
          rules={[
            { required: true, message: 'Please enter email address' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input 
            placeholder="Enter Google Drive email address"
            className="horizon-input"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <CloudOutlined style={{ color: '#667eea' }} />
              <Text strong>Shared Drive Name</Text>
            </Space>
          }
          name="shared_drive_name"
          rules={[
            { required: true, message: 'Please enter shared drive name' }
          ]}
        >
          <Input 
            placeholder="Enter Google Shared Drive name (e.g., EMB Test)"
            className="horizon-input"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <SettingOutlined style={{ color: '#667eea' }} />
              <Text strong>Root Folder Name</Text>
            </Space>
          }
          name="root_folder_name"
          rules={[
            { required: true, message: 'Please enter root folder name' }
          ]}
        >
          <Input 
            placeholder="Enter root folder name (e.g., EMB)"
            className="horizon-input"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <KeyOutlined style={{ color: '#667eea' }} />
              <Text strong>Track123 API Key</Text>
            </Space>
          }
          name="track123_api_key"
          help="Optional: Enter your Track123 API key for automatic package tracking"
        >
          <Input.Password 
            placeholder="Enter Track123 API key (optional)"
            className="horizon-input"
            size="large"
            visibilityToggle
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <FileTextOutlined style={{ color: '#667eea' }} />
              <Text strong>Service Account JSON File</Text>
            </Space>
          }
          name="service_account_json"
          rules={isEditing ? [] : [
            { 
              validator: () => {
                if (fileList.length === 0) {
                  return Promise.reject(new Error('Please upload service account JSON file'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Dragger {...uploadProps} className="horizon-upload">
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ color: '#667eea' }} />
            </p>
            <p className="ant-upload-text">
              Click or drag service account JSON file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for a single JSON file upload. File must be less than 5MB.
              {isEditing && <br />}
              {isEditing && <Text type="secondary">Leave empty to keep existing file</Text>}
            </p>
          </Dragger>
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <SettingOutlined style={{ color: '#667eea' }} />
              <Text strong>Status</Text>
            </Space>
          }
          name="is_active"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Active" 
            unCheckedChildren="Inactive"
            className="horizon-switch"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AddGoogleDriveForm; 