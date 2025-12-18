import React, { FC, useState } from "react";
import { Modal, Button, Space, Typography, Divider, notification, Spin } from "antd";
import { 
  GoogleOutlined, 
  DownloadOutlined, 
  FileTextOutlined,
  LinkOutlined 
} from "@ant-design/icons";
import { 
  fetchFileContent, 
  downloadBlob, 
  getFileTypeIcon 
} from "../utils/fileUtils";
import { getAuthToken } from "../utils/functions";

const { Text, Title } = Typography;

interface FileViewerModalProps {
  visible: boolean;
  onClose: () => void;
  file: {
    id?: number;
    file_path: string;
    file_type?: string;
    created_at?: string;
  } | null;
  fileType?: 'shipping_label' | 'dst' | 'dgt' | 'other';
}

const FileViewerModal: FC<FileViewerModalProps> = ({
  visible,
  onClose,
  file,
  fileType = 'other'
}) => {
  const [loading, setLoading] = useState(false);
  
  if (!file) return null;

  const handleDownloadFile = async () => {
    setLoading(true);
    
    try {
      // Get authentication headers
      const authHeaders = getAuthToken();
      if (!authHeaders) {
        notification.error({
          message: 'Authentication Error',
          description: 'Please log in to download files'
        });
        return;
      }
      
      // Fetch file content from backend
      const result = await fetchFileContent(file.file_path, authHeaders);
      
      if (result.success && result.data) {
        // Download the file
        downloadBlob(result.data, result.filename || 'downloaded_file');
        
        notification.success({
          message: 'File Downloaded',
          description: `${result.filename} has been downloaded to your computer`,
          duration: 3
        });
        
        onClose();
      } else {
        notification.error({
          message: 'Error Downloading File',
          description: result.error || 'Failed to download file from server'
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'An unexpected error occurred while downloading the file'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInGoogleDrive = () => {
    window.open(file.file_path, '_blank');
    onClose();
  };

  const getFileTypeInfo = () => {
    switch (fileType) {
      case 'shipping_label':
        return {
          title: 'Shipping Label',
          icon: '📄',
          color: '#1890ff',
          description: 'PDF shipping label document'
        };
      case 'dst':
        return {
          title: 'DST File',
          icon: '🧵',
          color: '#52c41a',
          description: 'Embroidery design file'
        };
      case 'dgt':
        return {
          title: 'DGT File',
          icon: '🎨',
          color: '#fa8c16',
          description: 'Digitized embroidery file'
        };
      default:
        return {
          title: 'File',
          icon: getFileTypeIcon('', ''),
          color: '#666666',
          description: 'Document file'
        };
    }
  };

  const fileInfo = getFileTypeInfo();

  return (
    <Modal
      title={
        <Space>
          <span style={{ fontSize: '18px' }}>{fileInfo.icon}</span>
          <Title level={4} style={{ margin: 0 }}>
            {fileInfo.title}
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={480}
      className="horizon-modal"
      style={{ top: 20 }}
      centered={false}
    >
      <div style={{ padding: '16px 0' }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: `2px dashed ${fileInfo.color}`
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>
            {fileInfo.icon}
          </div>
          <Text strong style={{ fontSize: '16px', color: fileInfo.color }}>
            {fileInfo.description}
          </Text>
          {file.created_at && (
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Created: {new Date(file.created_at).toLocaleDateString()}
              </Text>
            </div>
          )}
        </div>

        <Text style={{ display: 'block', marginBottom: '20px', textAlign: 'center' }}>
          Choose how you'd like to access this file:
        </Text>

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button
            type="primary"
            size="large"
            block
            icon={loading ? <Spin size="small" /> : <DownloadOutlined />}
            onClick={handleDownloadFile}
            loading={loading}
            disabled={loading}
            style={{
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px'
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                {loading ? 'Downloading...' : 'Download File'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {loading ? 'Fetching file from Google Drive' : 'Download to your computer'}
              </div>
            </div>
          </Button>

          <Button
            size="large"
            block
            icon={<GoogleOutlined />}
            onClick={handleViewInGoogleDrive}
            style={{
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              borderColor: '#4285f4',
              color: '#4285f4'
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Open in Google Drive</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                View in Google Drive (requires login)
              </div>
            </div>
          </Button>
        </Space>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <LinkOutlined style={{ marginRight: '4px' }} />
            Secure file access through your connected Google Drive
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default FileViewerModal;