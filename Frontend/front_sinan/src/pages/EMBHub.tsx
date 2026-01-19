import React, { useState, useEffect } from 'react';
import { 
  Button, Modal, Input, Upload, Select, Card, Space, 
  Typography, Breadcrumb, message, Spin, Empty, Tooltip, Tag,
  Row, Col, Dropdown, MenuProps
} from 'antd';
import {
  FolderOutlined, FileOutlined, UploadOutlined,
  DeleteOutlined, ReloadOutlined, CloudOutlined,
  MoreOutlined, EyeOutlined, FolderAddOutlined,
  PlayCircleOutlined, CopyOutlined, LinkOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { getAuthToken } from '../utils/functions';
import { AuthTokenType, DriveAccount, DriveFolder, DriveFile, FolderPath } from '../utils/types';
import {
  EMBHubAccountsUrl, EMBHubCreateFolderUrl,
  EMBHubDeleteFolderUrl, EMBHubUploadFileUrl, EMBHubDeleteFileUrl,
  EMBHubFolderContentsUrl, EMBHubRunAutomationUrl
} from '../utils/network';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const EMBHub: React.FC = () => {
  // State management
  const [accounts, setAccounts] = useState<DriveAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<FolderPath[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [fetching, setFetching] = useState(true);
  
  // Modal states
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<DriveFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [deleteFileModalVisible, setDeleteFileModalVisible] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);
  const [copyLinkModalVisible, setCopyLinkModalVisible] = useState(false);
  const [fileToCopy, setFileToCopy] = useState<DriveFile | null>(null);
  const [pageNumber, setPageNumber] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [automationModalVisible, setAutomationModalVisible] = useState(false);

  // Load accounts on component mount
  useEffect(() => {
    setFetching(true);
    loadAccounts();
  }, []);

  // Load folder contents when account or folder changes
  useEffect(() => {
    if (selectedAccount) {
      loadFolderContents();
    }
  }, [selectedAccount, currentFolderId]);

  const loadAccounts = async () => {
    try {
      const headers = getAuthToken() as AuthTokenType;
      const response = await axios.get(EMBHubAccountsUrl, headers);
      
      if (response.data.success) {
        setAccounts(response.data.accounts || []);
        if (response.data.accounts && response.data.accounts.length > 0) {
          const firstAccount = response.data.accounts[0];
          setSelectedAccount(`${firstAccount.id}:${firstAccount.email}`);
        } else {
          setSelectedAccount('');
        }
      } else {
        message.error('Failed to load accounts: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error: any) {
      message.error('Failed to load Google Drive accounts: ' + (error.response?.data?.error || error.message));
    } finally {
      setFetching(false);
    }
  };

  const loadFolderContents = async () => {
    if (!selectedAccount) {
      return;
    }
    
    const [accountId, email] = selectedAccount.split(':');
    
    setFetching(true);
    try {
      const headers = getAuthToken() as AuthTokenType;
      const response = await axios.post(EMBHubFolderContentsUrl, {
        google_drive_email: email,
        folder_id: currentFolderId
      }, {
        headers: headers.headers
      });
      
      if (response.data.success) {
        setFolders(response.data.folders || []);
        setFiles(response.data.files || []);
        setCurrentPath(response.data.path || []);
      } else {
        message.error('Failed to load folder contents: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error: any) {
      message.error('Failed to load folder contents: ' + (error.response?.data?.error || error.message));
    } finally {
      setFetching(false);
    }
  };

  const navigateToFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const navigateUp = () => {
    if (currentPath.length > 1) {
      const parentPath = currentPath[currentPath.length - 2];
      setCurrentFolderId(parentPath.id);
    } else {
      setCurrentFolderId(null);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      message.error('Please enter a folder name');
      return;
    }

    try {
      const [accountId, email] = selectedAccount.split(':');
      const headers = getAuthToken() as AuthTokenType;
      const response = await axios.post(EMBHubCreateFolderUrl, {
        google_drive_email: email,
        name: newFolderName.trim(),
        parent_id: currentFolderId
      }, headers);
      
      if (response.data.success) {
        message.success(response.data.message);
        setCreateFolderVisible(false);
        setNewFolderName('');
        loadFolderContents();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to create folder');
    }
  };

  const uploadFile = async () => {
    console.log('=== Upload File Function Called ===');
    console.log('Upload file list:', uploadFileList);
    console.log('Selected account:', selectedAccount);
    console.log('Current folder ID:', currentFolderId);
    
    if (uploadFileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    const [accountId, email] = selectedAccount.split(':');
    const file = uploadFileList[0];
    const formData = new FormData();
    // Use the file directly since beforeUpload returns the raw File object
    formData.append('file', file);
    formData.append('google_drive_email', email);
    formData.append('folder_id', currentFolderId || '');

    console.log('Form data prepared:', {
      fileName: file.name,
      email: email,
      folderId: currentFolderId
    });
    console.log('Making request to:', EMBHubUploadFileUrl);

    setUploading(true);
    setUploadVisible(false);

    try {
      const headers = getAuthToken() as AuthTokenType;
      console.log('Request headers:', headers);
      
      const response = await axios.post(EMBHubUploadFileUrl, formData, {
        headers: {
          ...headers.headers,
          // Let browser set Content-Type automatically with proper boundary
        },
      });
      
      console.log('Upload response:', response.data);
      
      if (response.data.success) {
        message.success(response.data.message);
        setUploadFileList([]);
        loadFolderContents();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      message.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = (fileId: string, fileName: string) => {
    setFileToDelete({ id: fileId, name: fileName });
    setDeleteFileModalVisible(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    setDeletingFile(true);
    try {
      const [accountId, email] = selectedAccount.split(':');
      const headers = getAuthToken() as AuthTokenType;
      const response = await axios.post(EMBHubDeleteFileUrl, {
        google_drive_email: email,
        file_id: fileToDelete.id
      }, {
        headers: headers.headers
      });
      
      if (response.data.success) {
        message.success(response.data.message);
        loadFolderContents();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete file');
    } finally {
      setDeletingFile(false);
      setDeleteFileModalVisible(false);
      setFileToDelete(null);
    }
  };

  const cancelDeleteFile = () => {
    setDeleteFileModalVisible(false);
    setFileToDelete(null);
  };

  const formatFileSize = (sizeStr: string | undefined): string => {
    if (!sizeStr) return 'Unknown';
    const size = parseInt(sizeStr);
    if (isNaN(size)) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let fileSize = size;
    let unitIndex = 0;
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = (mimeType: string | undefined) => {
    const iconStyle = { fontSize: '28px' };
    
    if (!mimeType) return <FileOutlined style={iconStyle} />;
    
    if (mimeType.startsWith('image/')) return <FileOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
    if (mimeType.includes('pdf')) return <FileOutlined style={{ ...iconStyle, color: '#f5222d' }} />;
    if (mimeType.includes('word')) return <FileOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
    if (mimeType.includes('sheet')) return <FileOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
    
    return <FileOutlined style={iconStyle} />;
  };

  const copyFileLink = (file: DriveFile) => {
    if (!file.webViewLink) {
      message.error('File link not available');
      return;
    }
    
    // Check if it's a PDF
    if (file.mimeType && file.mimeType.includes('pdf')) {
      // Show modal to ask for page number
      setFileToCopy(file);
      setCopyLinkModalVisible(true);
      setPageNumber('1'); // Default to page 1
    } else {
      // For non-PDF files, just copy the link
      navigator.clipboard.writeText(file.webViewLink);
      message.success('Link copied to clipboard!');
    }
  };

  const handleCopyLinkConfirm = () => {
    if (!fileToCopy || !fileToCopy.webViewLink) {
      message.error('File link not available');
      return;
    }
    
    const page = parseInt(pageNumber);
    if (isNaN(page) || page < 1) {
      message.error('Please enter a valid page number');
      return;
    }
    
    // Create link with page number info
    const linkWithPage = `${fileToCopy.webViewLink}#page=${page}`;
    navigator.clipboard.writeText(linkWithPage);
    message.success(`Link with page ${page} copied to clipboard!`);
    
    setCopyLinkModalVisible(false);
    setFileToCopy(null);
    setPageNumber('');
  };

  const handleCopyLinkCancel = () => {
    setCopyLinkModalVisible(false);
    setFileToCopy(null);
    setPageNumber('');
  };

  const fileActionMenu = (file: DriveFile): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View',
      onClick: () => window.open(file.webViewLink, '_blank')
    },
    {
      key: 'copy',
      icon: <LinkOutlined />,
      label: 'Copy Link',
      onClick: () => copyFileLink(file)
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => deleteFile(file.id, file.name)
    }
  ];

  const getCurrentLocationName = () => {
    if (currentPath.length === 0) return 'EMB HUB';
    return currentPath[currentPath.length - 1]?.name || 'EMB HUB';
  };

  const showDeleteConfirm = (folder: DriveFolder) => {
    setFolderToDelete(folder);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!folderToDelete) return;
    
    const [accountId, email] = selectedAccount.split(':');
    
    setDeletingFolder(true);
    try {
      const headers = getAuthToken() as AuthTokenType;
      
      const response = await axios.post(
        EMBHubDeleteFolderUrl,
        {
          google_drive_email: email,
          folder_id: folderToDelete.id
        },
        {
          headers: headers.headers
        }
      );
      
      if (response.data.success) {
        message.success('Folder deleted successfully');
        setDeleteModalVisible(false);
        setFolderToDelete(null);
        await loadFolderContents();
      } else {
        throw new Error(response.data.error || 'Failed to delete folder');
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to delete folder');
    } finally {
      setDeletingFolder(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setFolderToDelete(null);
  };

  const runAutomation = async () => {
    if (!selectedAccount) {
      message.error('Please select a Google Drive account first');
      return;
    }

    setAutomationModalVisible(true);
  };

  const handleAutomationConfirm = async () => {
    setAutomationModalVisible(false);
    setRunningAutomation(true);
    
    try {
      const [accountId, email] = selectedAccount.split(':');
      const headers = getAuthToken() as AuthTokenType;
      
      const response = await axios.post(EMBHubRunAutomationUrl, {
        google_drive_email: email
      }, headers);
      
      if (response.data.success) {
        const { 
          message: responseMessage, 
          total_accounts, 
          successful_accounts, 
          failed_accounts,
          errors 
        } = response.data;
        
        message.success(responseMessage);
        
        // Show detailed results
        Modal.info({
          title: 'Automation Results',
          width: 600,
          content: (
            <div>
              <p><strong>Date Folder:</strong> {response.data.date_folder.name}</p>
              <p><strong>Total Accounts:</strong> {total_accounts}</p>
              <p><strong>Successful:</strong> {successful_accounts}</p>
              <p><strong>Failed:</strong> {failed_accounts}</p>
              
              {errors && errors.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <p><strong>Errors:</strong></p>
                  <ul>
                    {errors.map((error: any, index: number) => (
                      <li key={index}>
                        <strong>{error.account_name}:</strong> {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ),
        });
        
        // Refresh the folder contents
        loadFolderContents();
      } else {
        message.error(response.data.error || 'Automation failed');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to run automation');
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleAutomationCancel = () => {
    setAutomationModalVisible(false);
  };

  return (
    <div className="horizon-page">
      <div className="page-header">
        <Space align="center">
          <CloudOutlined className="page-icon" />
          <div>
            <Title level={2} className="page-title">EMB HUB</Title>
            <Text className="page-subtitle">Google Drive File Management</Text>
          </div>
        </Space>
        
        <Space>
          <Select
            placeholder="Select Google Drive Account"
            value={selectedAccount}
            onChange={setSelectedAccount}
            style={{ width: 300 }}
            loading={fetching}
          >
            {accounts.map(account => (
              <Option key={`${account.id}`} value={`${account.id}:${account.email}`}>
                {account.email}
              </Option>
            ))}
          </Select>
          
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={runAutomation}
            loading={runningAutomation}
            disabled={!selectedAccount}
          >
            Run Automation
          </Button>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              if (selectedAccount) {
                loadFolderContents();
              } else {
                setFetching(true);
                loadAccounts();
              }
            }}
            loading={fetching}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {fetching ? (
        <Card className="horizon-card">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Loading Google Drive content..." />
          </div>
        </Card>
      ) : accounts.length === 0 ? (
        <Card className="horizon-card">
          <Empty 
            description={
              <div>
                <p>No Google Drive accounts found.</p>
                <p>Please configure Google Drive settings first.</p>
                <Button 
                  type="primary" 
                  onClick={() => {
                    setFetching(true);
                    loadAccounts();
                  }}
                  style={{ marginTop: '16px' }}
                >
                  Reload Accounts
                </Button>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : selectedAccount && (
        <Card className="horizon-card" style={{ minHeight: '600px' }}>
          {/* Breadcrumb Navigation */}
          <div style={{ marginBottom: '16px' }}>
            <Breadcrumb>
              <Breadcrumb.Item>
                <Button type="link" onClick={() => setCurrentFolderId(null)}>
                  EMB HUB
                </Button>
              </Breadcrumb.Item>
              {currentPath.slice(1).map((pathItem, index) => (
                <Breadcrumb.Item key={pathItem.id}>
                  <Button 
                    type="link" 
                    onClick={() => navigateToFolder(pathItem.id)}
                  >
                    {pathItem.name}
                  </Button>
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>

          {/* Action Bar */}
          <div style={{ marginBottom: '16px' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  {currentPath.length > 1 && (
                    <Button onClick={navigateUp}>
                      ← Back
                    </Button>
                  )}
                  <Button
                    type="primary"
                    icon={<FolderAddOutlined />}
                    onClick={() => setCreateFolderVisible(true)}
                  >
                    Create Folder
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => setUploadVisible(true)}
                  >
                    Upload File
                  </Button>
                </Space>
              </Col>
              <Col>
                <Text type="secondary">
                  {folders.length + files.length} items in {getCurrentLocationName()}
                </Text>
              </Col>
            </Row>
          </div>

          {/* Content Grid */}
          <Spin spinning={fetching}>
            <div>
              {/* Folders */}
              {folders.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <Title level={4}>Folders ({folders.length})</Title>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '12px'
                  }}>
                    {folders.map((folder) => (
                      <Card
                        key={folder.id}
                        size="small"
                        hoverable
                        onClick={() => navigateToFolder(folder.id)}
                        style={{ 
                          width: '160px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                        bodyStyle={{ 
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center'
                        }}
                        actions={[
                          <Tooltip title="Open" key="open">
                            <FolderOutlined 
                              style={{ fontSize: '14px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToFolder(folder.id);
                              }}
                            />
                          </Tooltip>,
                          <Tooltip title="Delete" key="delete">
                            <DeleteOutlined 
                              style={{ fontSize: '14px', color: '#ff4d4f' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                showDeleteConfirm(folder);
                              }}
                            />
                          </Tooltip>
                        ]}
                      >
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: '100%'
                        }}>
                          <FolderOutlined style={{ 
                            fontSize: '48px', 
                            color: '#faad14',
                            marginBottom: '8px'
                          }} />
                          <Tooltip title={folder.name}>
                            <div style={{
                              width: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: 500,
                              fontSize: '13px',
                              color: '#333'
                            }}>
                              {folder.name}
                            </div>
                          </Tooltip>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <Title level={4}>Files ({files.length})</Title>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '12px'
                  }}>
                    {files.map((file) => (
                      <Card
                        key={file.id}
                        size="small"
                        hoverable
                        style={{ 
                          width: '160px',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                        bodyStyle={{ 
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center'
                        }}
                        actions={[
                          <Dropdown 
                            key="more"
                            menu={{ items: fileActionMenu(file) }} 
                            trigger={['click']}
                            placement="bottomCenter"
                          >
                            <MoreOutlined style={{ fontSize: '14px' }} />
                          </Dropdown>
                        ]}
                      >
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: '100%'
                        }}>
                          <div style={{ 
                            fontSize: '40px', 
                            marginBottom: '8px',
                            color: '#1890ff'
                          }}>
                            {getFileIcon(file.mimeType)}
                          </div>
                          <Tooltip title={file.name}>
                            <div style={{
                              width: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: 500,
                              fontSize: '12px',
                              color: '#333',
                              marginBottom: '4px'
                            }}>
                              {file.name}
                            </div>
                          </Tooltip>
                          <div style={{ fontSize: '11px' }}>
                            <Text type="secondary">{formatFileSize(file.size)}</Text>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {folders.length === 0 && files.length === 0 && (
                <Empty 
                  description={`${getCurrentLocationName()} folder is empty`}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </Spin>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Folder"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        confirmLoading={deletingFolder}
        width={400}
        centered
      >
        <p style={{ margin: '12px 0' }}>Are you sure you want to delete "{folderToDelete?.name}"?</p>
      </Modal>

      {/* Delete File Modal */}
      <Modal
        title="Delete File"
        open={deleteFileModalVisible}
        onOk={confirmDeleteFile}
        onCancel={cancelDeleteFile}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        confirmLoading={deletingFile}
        width={400}
        centered
      >
        <p style={{ margin: '12px 0' }}>Are you sure you want to delete "{fileToDelete?.name}"?</p>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        title="Create New Folder"
        open={createFolderVisible}
        onOk={createFolder}
        onCancel={() => {
          setCreateFolderVisible(false);
          setNewFolderName('');
        }}
        okText="Create"
      >
        <Input
          placeholder="Enter folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onPressEnter={createFolder}
        />
      </Modal>

      {/* Upload File Modal */}
      <Modal
        title="Upload File"
        open={uploadVisible}
        onOk={uploadFile}
        onCancel={() => {
          setUploadVisible(false);
          setUploadFileList([]);
        }}
        okText="Upload"
      >
        <Dragger
          fileList={uploadFileList}
          beforeUpload={(file) => {
            setUploadFileList([file]);
            return false;
          }}
          onRemove={() => setUploadFileList([])}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for single file upload. Maximum file size: 100MB.
          </p>
        </Dragger>
      </Modal>

      {/* Uploading Progress Modal */}
      <Modal
        title="Uploading File"
        open={uploading}
        footer={null}
        closable={false}
        centered
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: '20px', fontSize: '16px', fontWeight: 500 }}>
            Please wait...
          </p>
          <p style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
            Your file is being uploaded to Google Drive
          </p>
        </div>
      </Modal>

      {/* Run Automation Confirmation Modal */}
      <Modal
        title="Run Automation"
        open={automationModalVisible}
        onOk={handleAutomationConfirm}
        onCancel={handleAutomationCancel}
        okText="Yes, Run Automation"
        cancelText="Cancel"
        confirmLoading={runningAutomation}
      >
        <p>This will create a new folder structure for today with all active accounts. Do you want to proceed?</p>
        <p><strong>Note:</strong> This will create:</p>
        <ul>
          <li>A main folder with today's date (MMDDYYYY format)</li>
          <li>Subfolders for each active account</li>
          <li>4 subfolders in each account: DST, Shipping Labels, Packing Slips, Pick Lists</li>
        </ul>
      </Modal>

      {/* Copy Link Modal (for PDFs with page number) */}
      <Modal
        title="Copy File Link"
        open={copyLinkModalVisible}
        onOk={handleCopyLinkConfirm}
        onCancel={handleCopyLinkCancel}
        okText="Copy Link"
        cancelText="Cancel"
        width={400}
        centered
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <p style={{ margin: '8px 0' }}>
            <strong>File:</strong> {fileToCopy?.name}
          </p>
          <p style={{ margin: '8px 0' }}>
            Enter the page number to copy:
          </p>
          <Input
            type="number"
            min={1}
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
            placeholder="Page number"
            autoFocus
            onPressEnter={handleCopyLinkConfirm}
          />
          <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>
            This will copy the link with the page number for easy pasting in orders.
          </p>
        </Space>
      </Modal>
    </div>
  );
};

export default EMBHub; 