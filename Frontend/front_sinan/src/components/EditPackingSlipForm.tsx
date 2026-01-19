import React, { FC, useEffect, useState } from "react";
import { Drawer, notification, Form, Input, Button, Typography, Space, Divider, InputNumber, Select, List, Card, Popconfirm, Modal, Tag } from "antd";
import { AuthTokenType, PackingSlipProps, ProductProps } from "../utils/types";
import { getAuthToken } from "../utils/functions";
import axios, { AxiosResponse } from "axios";
import { PackingSlipsUrl, ProductsUrl } from "../utils/network";
import { 
  DeliveredProcedureOutlined,
  NumberOutlined, 
  TagOutlined, 
  FileTextOutlined,
  SaveOutlined,
  CustomerServiceOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CalculatorOutlined,
  TruckOutlined,
  PercentageOutlined,
  RiseOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  LinkOutlined
} from "@ant-design/icons";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface EditPackingSlipFormProps {
  isVisible?: boolean;
  onSuccessCallBack?: () => void;
  onClose?: () => void;
  editingLabel?: PackingSlipProps | null;
  onCloseWithoutEditing?: () => void;
  mode?: 'edit' | 'add';
}

const EditPackingSlipForm: FC<EditPackingSlipFormProps> = ({
  isVisible = false,
  onSuccessCallBack,
  onClose,
  editingLabel,
  onCloseWithoutEditing,
  mode = 'edit',
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [addFileModalVisible, setAddFileModalVisible] = useState(false);
  const [newFileLink, setNewFileLink] = useState('');
  const [newFileType, setNewFileType] = useState<string>('shipping_label');
  const [newFilePageNumber, setNewFilePageNumber] = useState<string>('');
  const [linkHasPage, setLinkHasPage] = useState(false);
  const [addingFile, setAddingFile] = useState(false);
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch products for the product selector (used in 'add' mode)
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const headers = getAuthToken() as AuthTokenType;
      const response = await axios.get(ProductsUrl, headers);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isVisible && mode === 'add') {
      fetchProducts();
      form.resetFields();
      form.setFieldsValue({
        status: 'new_order',
        quantity: 1,
        sales_price: '0.00',
        shipping_price: '0.00',
        item_cost: '0.00',
        shipping_cost: '0.00',
        platform_fee_percent: '0.00',
      });
      setFiles([]);
    }
  }, [isVisible, mode]);

  // Extract page number from Google Drive link (e.g., #page=5 or ?page=5)
  const extractPageFromLink = (link: string): { cleanLink: string; page: string | null } => {
    // Match patterns like #page=5, ?page=5, &page=5
    const pageMatch = link.match(/[#?&]page=(\d+)/i);
    if (pageMatch) {
      const page = pageMatch[1];
      // Remove the page parameter from link
      const cleanLink = link.replace(/[#?&]page=\d+/gi, '');
      return { cleanLink, page };
    }
    return { cleanLink: link, page: null };
  };

  const handleFileLinkChange = (value: string) => {
    const { cleanLink, page } = extractPageFromLink(value);
    setNewFileLink(cleanLink);
    if (page) {
      setNewFilePageNumber(page);
      setLinkHasPage(true);
    } else {
      setLinkHasPage(false);
    }
  };
  const [files, setFiles] = useState<any[]>([]);

  const handleFormClose = () => {
    form.resetFields();
    onClose?.();
    if (!form.isFieldsTouched()) {
      onCloseWithoutEditing?.();
    }
  };

  useEffect(() => {
    if (editingLabel) {
      // Ensure all financial fields have default values if they're missing
      const formValues = {
        ...editingLabel,
        status: editingLabel.status || 'new_order',
        sales_price: editingLabel.sales_price || '0',
        shipping_price: editingLabel.shipping_price || '0',
        item_cost: editingLabel.item_cost || '0',
        shipping_cost: editingLabel.shipping_cost || '0',
        platform_fee_percent: editingLabel.platform_fee_percent || '0',
        platform_fee_calculated: editingLabel.platform_fee_calculated || '0',
        profit: editingLabel.profit || '0',
        tracking_ids: editingLabel.tracking_ids || '',
        tracking_vendor: editingLabel.tracking_vendor || '',
        tracking_status: editingLabel.tracking_status || '',
      };
      form.setFieldsValue(formValues);
      
      // Load files for this packing slip
      loadFiles();
    } else {
      form.resetFields();
      setFiles([]);
    }
  }, [editingLabel, form]);

  const loadFiles = async () => {
    if (!editingLabel) return;
    
    try {
      const headers = getAuthToken() as AuthTokenType;
      const response = await axios.get(`${PackingSlipsUrl}/${editingLabel.id}`, headers);
      
      if (response.data) {
        // Combine all file types
        const allFiles = [
          ...(response.data.shipping_labels || []).map((f: any) => ({ ...f, file_type: 'shipping_label' })),
          ...(response.data.dst_files || []).map((f: any) => ({ ...f, file_type: 'dst' })),
          ...(response.data.dgt_files || []).map((f: any) => ({ ...f, file_type: 'dgt' })),
        ];
        setFiles(allFiles);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleAddFile = () => {
    setNewFileLink('');
    setNewFileType('shipping_label');
    setNewFilePageNumber('');
    setLinkHasPage(false);
    setAddFileModalVisible(true);
  };

  const handleAddFileConfirm = async () => {
    if (!newFileLink.trim()) {
      notification.error({ message: 'Error', description: 'Please enter a file link' });
      return;
    }
    
    if (!editingLabel) return;
    
    setAddingFile(true);
    try {
      const headers = getAuthToken() as AuthTokenType;
      const payload: any = {
        file_type: newFileType,
        file_path: newFileLink,
      };
      
      // Add page number if provided (for PDFs)
      if (newFilePageNumber) {
        payload.page_number = parseInt(newFilePageNumber);
      }
      
      await axios.post(`${PackingSlipsUrl}/${editingLabel.id}/files`, payload, {
        headers: headers.headers
      });
      
      notification.success({ message: 'Success', description: 'File added successfully' });
      setAddFileModalVisible(false);
      setNewFileLink('');
      setNewFileType('shipping_label');
      setNewFilePageNumber('');
      setLinkHasPage(false);
      loadFiles();
    } catch (error: any) {
      notification.error({ 
        message: 'Error', 
        description: error.response?.data?.error || 'Failed to add file' 
      });
    } finally {
      setAddingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!editingLabel) return;
    
    try {
      const headers = getAuthToken() as AuthTokenType;
      await axios.delete(`${PackingSlipsUrl}/${editingLabel.id}/files/${fileId}`, {
        headers: headers.headers
      });
      
      notification.success({ message: 'Success', description: 'File deleted successfully' });
      loadFiles();
    } catch (error: any) {
      notification.error({ 
        message: 'Error', 
        description: error.response?.data?.error || 'Failed to delete file' 
      });
    }
  };

  const getFileTypeLabel = (type: string) => {
    const types: Record<string, { label: string; color: string; icon: any }> = {
      shipping_label: { label: 'Shipping Label', color: 'blue', icon: <FilePdfOutlined /> },
      packing_slip: { label: 'Packing Slip', color: 'green', icon: <FileWordOutlined /> },
      dst: { label: 'DST File', color: 'purple', icon: <FileOutlined /> },
      dgt: { label: 'DGT File', color: 'orange', icon: <FileOutlined /> },
    };
    return types[type] || { label: type, color: 'default', icon: <FileOutlined /> };
  };

  const onSubmit = async (values: any) => {
    setLoading(true);
    const headers = getAuthToken() as AuthTokenType;

    try {
      let response: AxiosResponse;

      if (mode === 'add') {
        // Create a new order
        const payload = {
          order_id: values.order_id,
          asin: values.asin || '',
          quantity: values.quantity || 1,
          ship_to: values.ship_to || '',
          customizations: values.customizations || '',
          status: values.status || 'new_order',
          sales_price: values.sales_price || '0.00',
          shipping_price: values.shipping_price || '0.00', 
          item_cost: values.item_cost || '0.00',
          shipping_cost: values.shipping_cost || '0.00',
          platform_fee_percent: values.platform_fee_percent || '0.00',
          tracking_ids: values.tracking_ids || '',
          tracking_vendor: values.tracking_vendor || '',
          tracking_status: values.tracking_status || '',
          product: values.product,
        };
        
        response = await axios.post(PackingSlipsUrl, payload, headers);
        
        notification.success({
          message: "Success",
          description: "Order created successfully",
        });
      } else if (editingLabel) {
        // Update existing order
        const payload = {
          order_id: values.order_id,
          asin: values.asin,
          quantity: values.quantity,
          ship_to: values.ship_to || '',
          customizations: values.customizations || '',
          status: values.status || 'new_order',
          sales_price: values.sales_price || '0.00',
          shipping_price: values.shipping_price || '0.00', 
          item_cost: values.item_cost || '0.00',
          shipping_cost: values.shipping_cost || '0.00',
          platform_fee_percent: values.platform_fee_percent || '0.00',
          tracking_ids: values.tracking_ids || '',
          tracking_vendor: values.tracking_vendor || '',
          tracking_status: values.tracking_status || '',
          product: editingLabel.product
        };
        
        if (!payload.product) {
          delete payload.product;
        }
        
        response = await axios.put(`${PackingSlipsUrl}/${editingLabel.id}`, payload, headers);
        
        notification.success({
          message: "Success",
          description: "Order updated successfully",
        });
      } else {
        throw new Error("Invalid form state");
      }

      setLoading(false);
      form.resetFields();
      setHasChanges(false);
      onSuccessCallBack?.();
    } catch (error: any) {
      setLoading(false);
      notification.error({
        message: "Error",
        description: error.response?.data?.error || "Failed to update order",
      });
    }
  };

  return (
    <Drawer
      title={
        <div className="drawer-header">
          <Space>
            <DeliveredProcedureOutlined />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {mode === 'add' ? 'Add New Order' : 'Edit Order'}
              </Title>
              <Text type="secondary">
                {mode === 'add' ? 'Create a new order manually' : 'Update order information'}
              </Text>
            </div>
          </Space>
        </div>
      }
      open={isVisible}
      onClose={handleFormClose}
      destroyOnClose
      width={700}
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
              <NumberOutlined />
              <Text strong>Order ID</Text>
            </Space>
          }
          name="order_id"
          rules={[
            { required: true, message: 'Please input the order ID!' },
            { min: 1, message: 'Order ID is required!' }
          ]}
        >
          <Input 
            placeholder="Enter order ID" 
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <TagOutlined />
              <Text strong>ASIN</Text>
            </Space>
          }
          name="asin"
          rules={mode === 'edit' ? [
            { required: true, message: 'Please input the ASIN!' },
            { min: 1, message: 'ASIN is required!' }
          ] : []}
        >
          <Input 
            placeholder={mode === 'add' ? "Enter ASIN (optional)" : "Enter ASIN"}
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        {mode === 'add' ? (
          <Form.Item
            label={
              <Space>
                <ShoppingOutlined />
                <Text strong>Product</Text>
              </Space>
            }
            name="product"
            rules={[{ required: true, message: 'Please select a product!' }]}
          >
            <Select
              placeholder="Select a product"
              size="large"
              className="horizon-input"
              loading={loadingProducts}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={products.map(p => ({
                value: p.id,
                label: `${p.code} - ${p.name}`,
              }))}
              onChange={(value) => {
                // Auto-fill item_cost and sales_price from selected product
                const selectedProduct = products.find(p => p.id === value);
                if (selectedProduct) {
                  form.setFieldsValue({
                    item_cost: selectedProduct.sku_buy_cost,
                    sales_price: selectedProduct.sku_price,
                  });
                }
              }}
            />
          </Form.Item>
        ) : (
          <Form.Item
            label={
              <Space>
                <ShoppingOutlined />
                <Text strong>Product</Text>
              </Space>
            }
          >
            <Input 
              value={editingLabel ? `${editingLabel.product_code} - ${editingLabel.product_name}` : ''} 
              size="large"
              className="horizon-input"
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>
        )}

        {mode === 'edit' && (
          <Form.Item
            label={
              <Space>
                <CustomerServiceOutlined />
                <Text strong>Folder Path</Text>
              </Space>
            }
          >
            <Input 
              value={editingLabel ? editingLabel.folder_path : ''} 
              size="large"
              className="horizon-input"
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
              placeholder="No folder path available"
            />
          </Form.Item>
        )}

        <Form.Item
          label={
            <Space>
              <CheckCircleOutlined />
              <Text strong>Status</Text>
            </Space>
          }
          name="status"
          rules={[
            { required: true, message: 'Please select a status!' }
          ]}
        >
          <Select
            placeholder="Select order status"
            size="large"
            className="horizon-input"
            options={[
              { label: '🆕 New Order', value: 'new_order' },
              { label: '🎨 Digitizing', value: 'digitizing' },
              { label: '⚡ Ready For Production', value: 'ready_for_production' },
              { label: '🏭 In Production', value: 'in_production' },
              { label: '🔍 Quality Check', value: 'quality_check' },
              { label: '📦 Ready to Ship', value: 'ready_to_ship' },
              { label: '🚚 Shipped', value: 'shipped' },
              { label: '✅ Delivered', value: 'delivered' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <NumberOutlined />
              <Text strong>Quantity</Text>
            </Space>
          }
          name="quantity"
          rules={[
            { required: true, message: 'Please input the quantity!' },
            { type: 'number', min: 1, message: 'Quantity must be at least 1' }
          ]}
        >
          <InputNumber
            placeholder="Enter quantity"
            size="large"
            className="horizon-input"
            style={{ width: '100%' }}
            min={1}
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <CustomerServiceOutlined />
              <Text strong>Ship To Address</Text>
            </Space>
          }
          name="ship_to"
        >
          <TextArea
            placeholder="Enter shipping address (optional)"
            rows={3}
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <FileTextOutlined />
              <Text strong>Customizations</Text>
            </Space>
          }
          name="customizations"
        >
          <TextArea
            placeholder="Enter customization details (optional)"
            rows={4}
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Divider>
          <Text strong style={{ color: '#667eea' }}>Financial Information</Text>
        </Divider>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label={
              <Space>
                <DollarOutlined style={{ color: '#38a169' }} />
                <Text strong>Sales Price</Text>
              </Space>
            }
            name="sales_price"
            rules={[
              { required: true, message: 'Please input the sales price!' }
            ]}
          >
            <InputNumber
              placeholder="0.00"
              size="large"
              className="horizon-input"
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => (parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0) as any}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <TruckOutlined style={{ color: '#3182ce' }} />
                <Text strong>Shipping Price</Text>
              </Space>
            }
            name="shipping_price"
          >
            <InputNumber
              placeholder="0.00"
              size="large"
              className="horizon-input"
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => (parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0) as any}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <CalculatorOutlined style={{ color: '#d69e2e' }} />
                <Text strong>Item Cost</Text>
              </Space>
            }
            name="item_cost"
            rules={[
              { required: true, message: 'Please input the item cost!' }
            ]}
          >
            <InputNumber
              placeholder="0.00"
              size="large"
              className="horizon-input"
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => (parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0) as any}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <TruckOutlined style={{ color: '#e53e3e' }} />
                <Text strong>Shipping Cost</Text>
              </Space>
            }
            name="shipping_cost"
          >
            <InputNumber
              placeholder="0.00"
              size="large"
              className="horizon-input"
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => (parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0) as any}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <Space>
              <PercentageOutlined style={{ color: '#805ad5' }} />
              <Text strong>Platform Fee Percentage</Text>
            </Space>
          }
          name="platform_fee_percent"
        >
          <InputNumber
            placeholder="0.0"
            size="large"
            className="horizon-input"
            style={{ width: '100%' }}
            min={0}
            max={100}
            step={0.1}
            precision={2}
            formatter={value => `${value}%`}
            parser={value => (parseFloat(value!.replace('%', '')) || 0) as any}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label={
              <Space>
                <CalculatorOutlined style={{ color: '#805ad5' }} />
                <Text strong>Platform Fee (Calculated)</Text>
              </Space>
            }
          >
            <Input
              value={editingLabel ? `$${parseFloat(editingLabel.platform_fee_calculated || '0').toFixed(2)}` : '$0.00'}
              size="large"
              className="horizon-input"
              disabled
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <RiseOutlined style={{ color: '#38a169' }} />
                <Text strong>Profit (Calculated)</Text>
              </Space>
            }
          >
            <Input
              value={editingLabel ? `$${parseFloat(editingLabel.profit || '0').toFixed(2)}` : '$0.00'}
              size="large"
              className="horizon-input"
              disabled
              style={{ 
                backgroundColor: '#f5f5f5',
                color: editingLabel && parseFloat(editingLabel.profit || '0') >= 0 ? '#38a169' : '#e53e3e',
                fontWeight: 600
              }}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <Space>
              <BarcodeOutlined style={{ color: '#4299e1' }} />
              <Text strong>Tracking IDs</Text>
            </Space>
          }
          name="tracking_ids"
        >
          <TextArea
            placeholder="Enter tracking IDs (comma-separated)"
            rows={2}
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Divider>
          <Text strong style={{ color: '#667eea' }}>Tracking Information</Text>
        </Divider>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label={
              <Space>
                <GlobalOutlined style={{ color: '#667eea' }} />
                <Text strong>Tracking Vendor</Text>
              </Space>
            }
            name="tracking_vendor"
          >
            <Select 
              placeholder="Select tracking vendor" 
              size="large"
              className="horizon-input"
              allowClear
              options={[
                { label: '📦 FedEx', value: 'fedex' },
                { label: '🚚 UPS', value: 'ups' },
                { label: '📬 USPS', value: 'usps' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <InfoCircleOutlined style={{ color: '#4299e1' }} />
                <Text strong>Tracking Status</Text>
              </Space>
            }
            name="tracking_status"
          >
            <Input
              placeholder="Enter tracking status"
              size="large"
              className="horizon-input"
            />
          </Form.Item>
        </div>

        {mode === 'edit' && editingLabel && (
          <>
            <Divider>
              <Space>
                <FileOutlined />
                <Text strong style={{ color: '#667eea' }}>Files & Attachments</Text>
              </Space>
            </Divider>

            <div style={{ marginBottom: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Attached Files ({files.length})</Text>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddFile}
                    size="small"
                  >
                    Add File Link
                  </Button>
                </div>

            {files.length > 0 ? (
              <List
                size="small"
                dataSource={files}
                renderItem={(file: any) => {
                  const fileTypeInfo = getFileTypeLabel(file.file_type);
                  return (
                    <List.Item
                      actions={[
                        <Button
                          key="view"
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => window.open(file.file_path, '_blank')}
                        />,
                        <Popconfirm
                          key="delete"
                          title="Delete this file?"
                          onConfirm={() => handleDeleteFile(file.id)}
                          okText="Delete"
                          cancelText="Cancel"
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      ]}
                      style={{ padding: '8px 12px', background: '#fafafa', borderRadius: '6px', marginBottom: '8px' }}
                    >
                      <Space>
                        {fileTypeInfo.icon}
                        <Tag color={fileTypeInfo.color}>{fileTypeInfo.label}</Tag>
                        {file.page_number && <Tag>Page {file.page_number}</Tag>}
                      </Space>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                background: '#fafafa', 
                borderRadius: '6px',
                border: '1px dashed #d9d9d9'
              }}>
                <FileOutlined style={{ fontSize: '24px', color: '#bfbfbf', marginBottom: '8px' }} />
                <p style={{ margin: 0, color: '#999' }}>No files attached</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#bfbfbf' }}>
                  Copy link from EMB Hub and add here
                </p>
              </div>
            )}
          </Space>
        </div>
          </>
        )}

        <Divider />

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
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
              icon={<SaveOutlined />}
              className="horizon-primary-btn"
            >
              {mode === 'add' ? 'Create Order' : 'Update Order'}
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Add File Modal */}
      <Modal
        title="Add File Link"
        open={addFileModalVisible}
        onOk={handleAddFileConfirm}
        onCancel={() => {
          setAddFileModalVisible(false);
          setNewFileLink('');
          setNewFileType('shipping_label');
          setNewFilePageNumber('');
        }}
        okText="Add File"
        cancelText="Cancel"
        confirmLoading={addingFile}
        width={500}
        centered
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>File Type</Text>
            <Select
              value={newFileType}
              onChange={setNewFileType}
              style={{ width: '100%', marginTop: '8px' }}
              size="large"
              options={[
                { label: '📄 Shipping Label (PDF)', value: 'shipping_label' },
                { label: '📝 Packing Slip (Doc)', value: 'packing_slip' },
                { label: '🧵 DST File', value: 'dst' },
                { label: '🎨 DGT File', value: 'dgt' },
              ]}
            />
          </div>

          <div>
            <Text strong>File Link</Text>
            <Input
              value={newFileLink}
              onChange={(e) => handleFileLinkChange(e.target.value)}
              placeholder="Paste Google Drive link from EMB Hub"
              size="large"
              style={{ marginTop: '8px' }}
              prefix={<LinkOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Go to EMB Hub → Find your file → Click "Copy Link"
            </Text>
          </div>

          {linkHasPage && (
            <div style={{ padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
              <Text type="success">✓ Page {newFilePageNumber} detected from link</Text>
            </div>
          )}
        </Space>
      </Modal>
    </Drawer>
  );
};

export default EditPackingSlipForm;