import React, { FC, useEffect, useState } from "react";
import { Button, Modal, notification, Space, Tag, Tooltip } from "antd";
import { useGetPackingSlips } from "../utils/hooks";
import { AuthTokenType, PackingSlipProps } from "../utils/types";
import { getAuthToken, getPackingSlips } from "../utils/functions";
import HorizonTable, { HorizonTableColumn } from "../components/HorizonTable";
import EditPackingSlipForm from "../components/EditPackingSlipForm";
import FileViewerModal from "../components/FileViewerModal";
import axios from "axios";
import { PackingSlipsUrl } from "../utils/network";
import dayjs from "dayjs";
import { getFileViewerUrl } from "../utils/fileUtils";
import { 
  DeliveredProcedureOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  NumberOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  TagOutlined,
  FilePdfOutlined,
  LinkOutlined,
  DollarOutlined,
  CalculatorOutlined,
  TruckOutlined,
  PercentageOutlined,
  RiseOutlined,
  BarcodeOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PrinterOutlined,
  SyncOutlined
} from "@ant-design/icons";

const PackingSlips: FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingLabel, setEditingLabel] = useState<PackingSlipProps | null>(null);
  const [fetching, setFetching] = useState(true);
  const [packingSlips, setPackingSlips] = useState<PackingSlipProps[] | undefined>();
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 300);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<number | null>(null);
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedFileType, setSelectedFileType] = useState<'shipping_label' | 'dst' | 'dgt' | 'other'>('other');
  const [fetchingStatus, setFetchingStatus] = useState<{ [key: number]: boolean }>({});
  const [formMode, setFormMode] = useState<'edit' | 'add'>('edit');

  // Function to generate tracking URL based on vendor
  const getTrackingUrl = (vendor: string, trackingId: string) => {
    if (!trackingId || !vendor) return null;
    
    const firstTrackingId = trackingId.split(',')[0]?.trim();
    if (!firstTrackingId) return null;

    switch (vendor.toLowerCase()) {
      case 'fedex':
        return `https://www.fedex.com/fedextrack/?trknbr=${firstTrackingId}`;
      case 'ups':
        return `https://www.ups.com/track?loc=null&tracknum=${firstTrackingId}`;
      case 'usps':
        return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${firstTrackingId}`;
      default:
        return null;
    }
  };


  useGetPackingSlips(setPackingSlips, setFetching);

  useEffect(() => {
    if (editingLabel) {
      setDrawerVisible(true);
    }
  }, [editingLabel]);

  useEffect(() => {
    const handleResize = () => {
      setTableHeight(window.innerHeight - 300);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onCloseWithoutEditing = () => {
    setEditingLabel(null);
  };

  const columns: HorizonTableColumn[] = [
    {
      key: 'order_info',
      title: 'Order Information',
      dataIndex: 'order_info',
      width: 280,
      sorter: false,
      filterable: false,
      searchable: true,
      fixed: 'left',
      render: (_, record: PackingSlipProps) => (
        <Space direction="vertical" size={2}>
          <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '13px' }}>
            <NumberOutlined style={{ marginRight: 6, color: '#1890ff' }} />
            {record.order_id}
          </div>
          <div style={{ fontSize: '11px', color: '#718096' }}>
            <ShoppingOutlined style={{ marginRight: 4 }} />
            {record.product_name} ({record.product_code})
          </div>
          <div style={{ fontSize: '11px', color: '#718096' }}>
            ASIN: {record.asin}
          </div>
        </Space>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      width: 160,
      sorter: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'New Order', value: 'new_order' },
        { label: 'Digitizing', value: 'digitizing' },
        { label: 'Ready For Production', value: 'ready_for_production' },
        { label: 'In Production', value: 'in_production' },
        { label: 'Quality Check', value: 'quality_check' },
        { label: 'Ready to Ship', value: 'ready_to_ship' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
      ],
      render: (status: string) => {
        const getStatusConfig = (status: string) => {
          switch (status) {
            case 'new_order':
              return { color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff', text: 'New Order', icon: '🆕' };
            case 'digitizing':
              return { color: '#722ed1', bgColor: '#f9f0ff', borderColor: '#d3adf7', text: 'Digitizing', icon: '🎨' };
            case 'ready_for_production':
              return { color: '#fa8c16', bgColor: '#fff7e6', borderColor: '#ffd591', text: 'Ready For Production', icon: '⚡' };
            case 'in_production':
              return { color: '#fa541c', bgColor: '#fff2e8', borderColor: '#ffbb96', text: 'In Production', icon: '🏭' };
            case 'quality_check':
              return { color: '#13c2c2', bgColor: '#e6fffb', borderColor: '#87e8de', text: 'Quality Check', icon: '🔍' };
            case 'ready_to_ship':
              return { color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f', text: 'Ready to Ship', icon: '📦' };
            case 'shipped':
              return { color: '#389e0d', bgColor: '#f6ffed', borderColor: '#95de64', text: 'Shipped', icon: '🚚' };
            case 'delivered':
              return { color: '#237804', bgColor: '#f6ffed', borderColor: '#52c41a', text: 'Delivered', icon: '✅' };
            default:
              return { color: '#8c8c8c', bgColor: '#f5f5f5', borderColor: '#d9d9d9', text: 'Unknown', icon: '❓' };
          }
        };

        const config = getStatusConfig(status);
        
        return (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            color: config.color,
            backgroundColor: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            maxWidth: '140px'
          }}>
            <span style={{ marginRight: '4px' }}>{config.icon}</span>
            {config.text}
          </div>
        );
      },
    },
    {
      key: 'ship_to',
      title: 'Ship To',
      dataIndex: 'ship_to',
      width: 300,
      sorter: false,
      filterable: false,
      searchable: true,
      render: (ship_to: string) => (
        <div style={{ maxWidth: 280 }}>
          <Tooltip title={ship_to}>
            <div style={{ 
              whiteSpace: 'pre-line',
              fontSize: '12px',
              color: '#4a5568',
              maxHeight: '60px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}>
              <CustomerServiceOutlined style={{ marginRight: 6, color: '#38a169' }} />
              {ship_to}
            </div>
          </Tooltip>
        </div>
      ),
    },
    {
      key: 'quantity',
      title: 'Quantity',
      dataIndex: 'quantity',
      width: 100,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (quantity: number) => (
        <Tag color="blue" style={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
          {quantity}
        </Tag>
      ),
    },
    {
      key: 'customizations',
      title: 'Customizations',
      dataIndex: 'customizations',
      width: 250,
      sorter: false,
      filterable: false,
      searchable: true,
      render: (customizations: string) => (
        <div style={{ maxWidth: 230, minHeight: '20px' }}>
          {customizations ? (
            <Tooltip title={customizations}>
              <div style={{ 
                whiteSpace: 'nowrap',
                fontSize: '10px',
                color: '#4a5568',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                backgroundColor: '#f8fafc',
                padding: '2px 4px',
                borderRadius: '3px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                minHeight: '18px'
              }}>
                <FileTextOutlined style={{ 
                  marginRight: 3, 
                  color: '#805ad5', 
                  fontSize: '10px',
                  flexShrink: 0
                }} />
                <span style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {customizations}
                </span>
              </div>
            </Tooltip>
          ) : (
            <div style={{ 
              color: '#a0aec0', 
              fontSize: '10px',
              minHeight: '18px',
              display: 'flex',
              alignItems: 'center',
              fontStyle: 'italic'
            }}>
              No customizations
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'folder_path',
      title: 'Folder Path',
      dataIndex: 'folder_path',
      width: 200,
      sorter: true,
      filterable: true,
      filterType: 'text',
      searchable: true,
      render: (folder_path: string) => (
        <div style={{ maxWidth: 180 }}>
          {folder_path ? (
            <Tooltip title={folder_path}>
              <div style={{ 
                fontSize: '11px',
                color: '#4a5568',
                backgroundColor: '#edf2f7',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #cbd5e0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                <CustomerServiceOutlined style={{ marginRight: 4, color: '#4299e1' }} />
                {folder_path}
              </div>
            </Tooltip>
          ) : (
            <span style={{ color: '#a0aec0', fontSize: '11px' }}>No folder info</span>
          )}
        </div>
      ),
    },
    {
      key: 'shipping_labels',
      title: 'Shipping Labels',
      dataIndex: 'shipping_labels',
      width: 170,
      sorter: false,
      filterable: false,
      searchable: false,
      render: (shipping_labels: any[]) => (
        <div style={{ maxWidth: 150 }}>
          {shipping_labels && shipping_labels.length > 0 ? (
            <Space direction="vertical" size={3}>
              {shipping_labels.slice(0, 3).map((file, index) => (
                <div key={file.id}>
                  <div 
                    style={{ 
                      fontSize: '11px',
                      color: '#4a5568',
                      backgroundColor: '#f0f9ff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #0ea5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '24px'
                    }}
                    onClick={() => handleViewShippingLabel(file)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#0ea5e9';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <FilePdfOutlined style={{ marginRight: 6, color: '#0ea5e9', fontSize: '12px' }} />
                      <span style={{ fontWeight: 500 }}>
                        Page {file.page_number || index + 1}
                      </span>
                    </div>
                    <Tooltip title="Click to open shipping label in Google Drive">
                      <LinkOutlined style={{ color: '#059669', fontSize: '11px' }} />
                    </Tooltip>
                  </div>
                  <div style={{ 
                    fontSize: '9px', 
                    color: '#6b7280', 
                    marginTop: '2px',
                    paddingLeft: '4px'
                  }}>
                    {dayjs(file.created_at).format('MMM DD')}
                  </div>
                </div>
              ))}
              {shipping_labels.length > 3 && (
                <div style={{ 
                  fontSize: '10px', 
                  color: '#6b7280',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  +{shipping_labels.length - 3} more pages
                </div>
              )}
            </Space>
          ) : (
            <div style={{ 
              color: '#a0aec0', 
              fontSize: '11px',
              textAlign: 'center',
              padding: '8px 4px'
            }}>
              <FilePdfOutlined style={{ marginRight: 4, fontSize: '12px' }} />
              <div>No shipping</div>
              <div>labels linked</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'dst_files',
      title: 'DST Files',
      dataIndex: 'dst_files',
      width: 140,
      sorter: false,
      filterable: false,
      searchable: false,
      render: (dst_files: any[]) => (
        <div style={{ maxWidth: 120 }}>
          {dst_files && dst_files.length > 0 ? (
            <Space direction="vertical" size={3}>
              {dst_files.slice(0, 2).map((file, index) => (
                <div key={file.id}>
                  <div 
                    style={{ 
                      fontSize: '11px',
                      color: '#4a5568',
                      backgroundColor: '#f0fdf4',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #22c55e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '24px'
                    }}
                    onClick={() => handleViewFile(file, 'dst')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dcfce7';
                      e.currentTarget.style.borderColor = '#16a34a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0fdf4';
                      e.currentTarget.style.borderColor = '#22c55e';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <FileTextOutlined style={{ 
                        marginRight: 6, 
                        color: '#22c55e',
                        fontSize: '12px'
                      }} />
                      <span style={{ fontWeight: 500 }}>DST</span>
                    </div>
                    <LinkOutlined style={{ 
                      color: '#22c55e',
                      fontSize: '10px'
                    }} />
                  </div>
                  <div style={{ 
                    fontSize: '9px', 
                    color: '#6b7280',
                    textAlign: 'center',
                    marginTop: 2
                  }}>
                    {dayjs(file.created_at).format('MMM DD')}
                  </div>
                </div>
              ))}
              {dst_files.length > 2 && (
                <div style={{ 
                  fontSize: '10px', 
                  color: '#6b7280',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  +{dst_files.length - 2} more files
                </div>
              )}
            </Space>
          ) : (
            <div style={{ 
              color: '#a0aec0', 
              fontSize: '11px',
              textAlign: 'center',
              padding: '8px 4px'
            }}>
              <FileTextOutlined style={{ marginRight: 4, fontSize: '12px' }} />
              <div>No DST</div>
              <div>files linked</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'dgt_files',
      title: 'DGT Files',
      dataIndex: 'dgt_files',
      width: 140,
      sorter: false,
      filterable: false,
      searchable: false,
      render: (dgt_files: any[]) => (
        <div style={{ maxWidth: 120 }}>
          {dgt_files && dgt_files.length > 0 ? (
            <Space direction="vertical" size={3}>
              {dgt_files.slice(0, 2).map((file, index) => (
                <div key={file.id}>
                  <div 
                    style={{ 
                      fontSize: '11px',
                      color: '#4a5568',
                      backgroundColor: '#fef3c7',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '24px'
                    }}
                    onClick={() => handleViewFile(file, 'dgt')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fde68a';
                      e.currentTarget.style.borderColor = '#d97706';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef3c7';
                      e.currentTarget.style.borderColor = '#f59e0b';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <FileTextOutlined style={{ 
                        marginRight: 6, 
                        color: '#f59e0b',
                        fontSize: '12px'
                      }} />
                      <span style={{ fontWeight: 500 }}>DGT</span>
                    </div>
                    <LinkOutlined style={{ 
                      color: '#f59e0b',
                      fontSize: '10px'
                    }} />
                  </div>
                  <div style={{ 
                    fontSize: '9px', 
                    color: '#6b7280',
                    textAlign: 'center',
                    marginTop: 2
                  }}>
                    {dayjs(file.created_at).format('MMM DD')}
                  </div>
                </div>
              ))}
              {dgt_files.length > 2 && (
                <div style={{ 
                  fontSize: '10px', 
                  color: '#6b7280',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  +{dgt_files.length - 2} more files
                </div>
              )}
            </Space>
          ) : (
            <div style={{ 
              color: '#a0aec0', 
              fontSize: '11px',
              textAlign: 'center',
              padding: '8px 4px'
            }}>
              <FileTextOutlined style={{ marginRight: 4, fontSize: '12px' }} />
              <div>No DGT</div>
              <div>files linked</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'financial_info',
      title: 'Financial Details',
      dataIndex: 'financial_info',
      width: 280,
      sorter: false,
      filterable: false,
      searchable: false,
      render: (_, record: PackingSlipProps) => (
        <Space direction="vertical" size={4}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: '#4a5568' }}>
              <DollarOutlined style={{ marginRight: 4, color: '#38a169' }} />
              Sales: ${parseFloat(record.sales_price || '0').toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: '#4a5568' }}>
              <TruckOutlined style={{ marginRight: 4, color: '#3182ce' }} />
              Ship: ${parseFloat(record.shipping_price || '0').toFixed(2)}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: '#4a5568' }}>
              <CalculatorOutlined style={{ marginRight: 4, color: '#d69e2e' }} />
              Cost: ${parseFloat(record.item_cost || '0').toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: '#4a5568' }}>
              <PercentageOutlined style={{ marginRight: 4, color: '#805ad5' }} />
              Fee: {parseFloat(record.platform_fee_percent || '0').toFixed(1)}%
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: parseFloat(record.profit || '0') >= 0 ? '#f0fff4' : '#fff5f5',
            padding: '4px 8px',
            borderRadius: '4px',
            border: `1px solid ${parseFloat(record.profit || '0') >= 0 ? '#68d391' : '#fc8181'}`
          }}>
            <RiseOutlined style={{ 
              marginRight: 4, 
              color: parseFloat(record.profit || '0') >= 0 ? '#38a169' : '#e53e3e' 
            }} />
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 600,
              color: parseFloat(record.profit || '0') >= 0 ? '#38a169' : '#e53e3e'
            }}>
              Profit: ${parseFloat(record.profit || '0').toFixed(2)}
            </span>
          </div>
        </Space>
      ),
    },
    {
      key: 'tracking_ids',
      title: 'Tracking IDs',
      dataIndex: 'tracking_ids',
      width: 200,
      sorter: false,
      filterable: true,
      filterType: 'text',
      searchable: true,
      render: (tracking_ids: string) => (
        <div style={{ maxWidth: 180 }}>
          {tracking_ids ? (
            <div style={{ 
              fontSize: '11px',
              color: '#4a5568',
              backgroundColor: '#edf2f7',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e0',
              whiteSpace: 'pre-line',
              maxHeight: '60px',
              overflow: 'auto'
            }}>
              <BarcodeOutlined style={{ marginRight: 6, color: '#4299e1' }} />
              {tracking_ids.split(',').map((id, index) => (
                <div key={index} style={{ marginBottom: index < tracking_ids.split(',').length - 1 ? 2 : 0 }}>
                  {id.trim()}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ color: '#a0aec0', fontSize: '11px' }}>No tracking IDs</span>
          )}
        </div>
      ),
    },
    {
      key: 'tracking_info',
      title: 'Tracking Info',
      dataIndex: 'tracking_info',
      width: 220,
      sorter: false,
      filterable: true,
      filterType: 'text',
      searchable: true,
      render: (_, record: PackingSlipProps) => {
        const trackingUrl = getTrackingUrl(record.tracking_vendor, record.tracking_ids);
        
        return (
          <div style={{ maxWidth: 200 }}>
            {record.tracking_vendor || record.tracking_status ? (
              <Space direction="vertical" size={4}>
                {record.tracking_vendor && (
                  <div style={{ fontSize: '11px', color: '#4a5568' }}>
                    <GlobalOutlined style={{ marginRight: 4, color: '#667eea' }} />
                    <span style={{ 
                      backgroundColor: '#edf2f7', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontWeight: 500
                    }}>
                      {record.tracking_vendor.toUpperCase()}
                    </span>
                  </div>
                )}
                {record.tracking_status && (
                  <div style={{ fontSize: '11px', color: '#4a5568' }}>
                    <InfoCircleOutlined style={{ marginRight: 4, color: '#4299e1' }} />
                    {record.tracking_status}
                  </div>
                )}
                {trackingUrl && (
                  <div style={{ fontSize: '11px' }}>
                    <a 
                      href={trackingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#38a169', textDecoration: 'none' }}
                    >
                      <LinkOutlined style={{ marginRight: 4 }} />
                      Track Package
                    </a>
                  </div>
                )}
              </Space>
            ) : (
              <span style={{ color: '#a0aec0', fontSize: '11px' }}>No tracking info</span>
            )}
          </div>
        );
      },
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
      width: 220,
      sorter: false,
      filterable: false,
      searchable: false,
      fixed: 'right',
      render: (_, record: PackingSlipProps) => (
        <Space>
          {record.tracking_ids && record.tracking_vendor && (
            <Tooltip title="Fetch Latest Tracking Status">
              <Button 
                type="text" 
                icon={<SyncOutlined />} 
                onClick={() => handleFetchTrackingStatus(record)}
                className="action-btn fetch-status-btn"
                size="small"
                loading={fetchingStatus[record.id]}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
          <Tooltip title="Print PDF">
            <Button 
              type="text" 
              icon={<PrinterOutlined />} 
              onClick={() => handlePrint(record)}
              className="action-btn print-btn"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit Order">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              className="action-btn edit-btn"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Order">
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

  const handleEdit = (record: PackingSlipProps) => {
    setFormMode('edit');
    setEditingLabel(record);
  };

  const handleAddOrder = () => {
    setFormMode('add');
    setEditingLabel(null);
    setDrawerVisible(true);
  };

  const handleFetchTrackingStatus = async (record: PackingSlipProps) => {
    // Check if tracking info is available
    if (!record.tracking_ids || !record.tracking_vendor) {
      notification.warning({
        message: "Cannot Fetch Status",
        description: "This packing slip does not have tracking information.",
      });
      return;
    }

    setFetchingStatus(prev => ({ ...prev, [record.id]: true }));

    try {
      const authToken = getAuthToken() as AuthTokenType;
      const fetchStatusUrl = `${PackingSlipsUrl}/${record.id}/fetch-tracking-status/`;
      
      const response = await axios.post(
        fetchStatusUrl,
        {},
        authToken
      );

      if (response.data.success) {
        notification.success({
          message: "Status Updated",
          description: `Tracking status updated: ${response.data.tracking_status || 'Status retrieved'}`,
        });
        
        // Refresh the packing slips list to show updated status
        getPackingSlips(setPackingSlips, setFetching);
      } else {
        throw new Error(response.data.error || 'Failed to fetch tracking status');
      }
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.response?.data?.error || error.message || "Failed to fetch tracking status",
      });
    } finally {
      setFetchingStatus(prev => ({ ...prev, [record.id]: false }));
    }
  };

  const handlePrint = async (record: PackingSlipProps) => {
    try {
      const authToken = getAuthToken() as AuthTokenType;
      
      // Create the URL for the PDF generation endpoint
      const printUrl = `${PackingSlipsUrl}/${record.id}/print/`;
      
      // Create a temporary link to download the PDF
      const link = document.createElement('a');
      link.href = printUrl;
      link.setAttribute('download', `packing_slip_${record.order_id}.pdf`);
      
      // Add authorization header for fetch request
      const response = await fetch(printUrl, {
        method: 'GET',
        headers: {
          'Authorization': authToken.headers.Authorization,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        notification.success({
          message: "Success",
          description: "PDF generated successfully",
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to generate PDF",
      });
    }
  };

  const handleDeleteSingle = (shippingLabelId: number) => {
    console.log('Delete button clicked for ID:', shippingLabelId);
    setLabelToDelete(shippingLabelId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!labelToDelete) return;
    
    try {
      const headers = getAuthToken() as AuthTokenType;
      console.log('Making delete request for ID:', labelToDelete);
      await axios.delete(`${PackingSlipsUrl}/${labelToDelete}`, headers);
      getPackingSlips(setPackingSlips, setFetching);
      notification.success({
        message: "Success",
        description: "Order deleted successfully",
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      notification.error({
        message: "Error",
        description: error.response?.data?.error || "Failed to delete order",
      });
    } finally {
      setDeleteModalVisible(false);
      setLabelToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setLabelToDelete(null);
  };

  const handlePrintSelected = async (selectedKeys: React.Key[]) => {
    console.log('handlePrintSelected called with keys:', selectedKeys);
    try {
      const authToken = getAuthToken() as AuthTokenType;
      console.log('Auth token:', authToken);
      
      // Create the URL for bulk PDF generation
      const printUrl = `${PackingSlipsUrl}/bulk-print/`;
      console.log('Print URL:', printUrl);
      
      // Send selected IDs to bulk print endpoint
      const response = await fetch(printUrl, {
        method: 'POST',
        headers: {
          'Authorization': authToken.headers.Authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packing_slip_ids: selectedKeys
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bulk_packing_slips_${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        notification.success({
          message: "Success",
          description: `PDF generated successfully for ${selectedKeys.length} order(s)`,
        });
      } else {
        throw new Error('Failed to generate bulk PDF');
      }
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to generate bulk PDF",
      });
    }
  };

  const handleRefresh = () => {
    getPackingSlips(setPackingSlips, setFetching);
  };

  const handleViewShippingLabel = (file: any) => {
    if (file.file_path) {
      setSelectedFile(file);
      setSelectedFileType('shipping_label');
      setFileViewerVisible(true);
    } else {
      notification.error({
        message: "Error",
        description: "Shipping label file link not available",
      });
    }
  };

  const handleViewFile = (file: any, fileType: 'dst' | 'dgt' = 'dst') => {
    if (file.file_path) {
      setSelectedFile(file);
      setSelectedFileType(fileType);
      setFileViewerVisible(true);
    } else {
      notification.error({
        message: "Error",
        description: "File link not available",
      });
    }
  };



  return (
    <div className="horizon-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space align="center">
          <DeliveredProcedureOutlined className="page-icon" />
          <div>
            <h2 className="page-title">Orders</h2>
            <p className="page-subtitle">View and manage Orders extracted from uploaded documents</p>
          </div>
        </Space>
        <Button 
          type="primary" 
          icon={<ShoppingOutlined />}
          onClick={handleAddOrder}
          size="large"
        >
          Add Order
        </Button>
      </div>

      <HorizonTable
        columns={columns}
        dataSource={packingSlips || []}
        loading={fetching}
        showSearch={true}
        showFilters={true}
        showExport={true}
        showRefresh={true}
        showDelete={true}
        showColumnSettings={true}
        onRefresh={handleRefresh}
        onDelete={handlePrintSelected}
        bulkActionText="Print Selected"
        bulkActionIcon={<PrinterOutlined />}
        bulkActionType="primary"
        searchPlaceholder="Search orders by order ID, product code, ASIN, shipping address, or folder path..."
        exportFileName="orders"
        rowKey="id"
        virtualScrollHeight={tableHeight}
      />

      <EditPackingSlipForm
        onSuccessCallBack={() => {
          setDrawerVisible(false);
          setEditingLabel(null);
          getPackingSlips(setPackingSlips, setFetching);
        }}
        isVisible={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setEditingLabel(null);
        }}
        editingLabel={editingLabel}
        onCloseWithoutEditing={onCloseWithoutEditing}
        mode={formMode}
      />

      <Modal
        title="Delete Order"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
        className="horizon-modal"
        width={400}
        centered
      >
        <p style={{ margin: '12px 0' }}>Are you sure you want to delete this order?</p>
      </Modal>

      <FileViewerModal
        visible={fileViewerVisible}
        onClose={() => setFileViewerVisible(false)}
        file={selectedFile}
        fileType={selectedFileType}
      />

    </div>
  );
};

export default PackingSlips;