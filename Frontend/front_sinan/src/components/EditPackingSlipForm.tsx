import React, { FC, useEffect, useState } from "react";
import { Drawer, notification, Form, Input, Button, Typography, Space, Divider, InputNumber, Select } from "antd";
import { AuthTokenType, PackingSlipProps } from "../utils/types";
import { getAuthToken } from "../utils/functions";
import axios, { AxiosResponse } from "axios";
import { PackingSlipsUrl } from "../utils/network";
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
  InfoCircleOutlined
} from "@ant-design/icons";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface EditPackingSlipFormProps {
  isVisible?: boolean;
  onSuccessCallBack?: () => void;
  onClose?: () => void;
  editingLabel?: PackingSlipProps | null;
  onCloseWithoutEditing?: () => void;
}

const EditPackingSlipForm: FC<EditPackingSlipFormProps> = ({
  isVisible = false,
  onSuccessCallBack,
  onClose,
  editingLabel,
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
    } else {
      form.resetFields();
    }
  }, [editingLabel, form]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    const headers = getAuthToken() as AuthTokenType;

    try {
      let response: AxiosResponse;

      if (editingLabel) {
        // Keep it simple - only send the fields that can be updated
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
          product: editingLabel.product // Include product ID if available
        };
        
        // Remove product if it's not available
        if (!payload.product) {
          delete payload.product;
        }
        
        response = await axios.put(`${PackingSlipsUrl}/${editingLabel.id}`, payload, headers);
      } else {
        // This shouldn't happen for packing slips as they're auto-created
        throw new Error("Adding new packing slips is not supported");
      }

      setLoading(false);
      if (response) {
        notification.success({
          message: "Success",
          description: "Order updated successfully",
        });
        form.resetFields();
        setHasChanges(false);
        onSuccessCallBack?.();
      }
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
                Edit Order
              </Title>
              <Text type="secondary">
                Update order information
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
          rules={[
            { required: true, message: 'Please input the ASIN!' },
            { min: 1, message: 'ASIN is required!' }
          ]}
        >
          <Input 
            placeholder="Enter ASIN" 
            size="large"
            className="horizon-input"
          />
        </Form.Item>

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
              Update Order
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default EditPackingSlipForm;