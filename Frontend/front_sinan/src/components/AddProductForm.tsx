import React, { FC, useEffect, useState } from "react";
import { Drawer, notification, Form, Input, Button, Typography, Space, Divider, InputNumber, Upload } from "antd";
import { AuthTokenType, DataProps, AddProductFormModalProps, ProductProps } from "../utils/types";
import { getAuthToken } from "../utils/functions";
import axios, { AxiosResponse } from "axios";
import { ProductsUrl } from "../utils/network";
import { 
  ShoppingOutlined, 
  CodeOutlined, 
  FileTextOutlined,
  SaveOutlined,
  PlusOutlined,
  DollarOutlined,
  BgColorsOutlined,
  UploadOutlined
} from "@ant-design/icons";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface AddProductFormProps extends AddProductFormModalProps {
  editingProduct?: ProductProps | null;
}

const AddProductForm: FC<AddProductFormProps> = ({
  isVisible = false,
  onSuccessCallBack,
  onClose,
  editingProduct,
  onCloseWithoutEditing,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const handleFormClose = () => {
    form.resetFields();
    setImage(null);
    onClose?.();
    if (!form.isFieldsTouched()) {
      onCloseWithoutEditing?.();
    }
  };

  useEffect(() => {
    if (editingProduct) {
      form.setFieldsValue(editingProduct);
      setImage(null); // Reset image when editing, user can upload new one if needed
    } else {
      form.resetFields();
      setImage(null);
    }
  }, [editingProduct, form]);

  const onSubmit = async (values: DataProps) => {
    setLoading(true);
    const headers = getAuthToken() as AuthTokenType;

    try {
      let formData = new FormData(); // Create a new FormData object

      // Append other form values to the FormData object
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'image') { // Check if the value is neither undefined nor null
          formData.append(key, value.toString()); // Convert value to string before appending
        }
      });

      // Append the image file to the FormData object
      if (image) {
        formData.append('image', image);
      }
      let response: AxiosResponse;

      if (editingProduct) {
        // Editing product
        response = await axios.put(`${ProductsUrl}/${editingProduct.id}`, formData, {
          headers: {
            ...headers.headers,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Adding new product
        response = await axios.post(ProductsUrl, formData, {
          headers: {
            ...headers.headers,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setLoading(false);
      if (response) {
        notification.success({
          message: "Success",
          description: editingProduct ? "Product updated successfully" : "Product created successfully",
        });
        form.resetFields();
        setImage(null);
        onSuccessCallBack?.();
        onClose?.(); // Close the drawer
      }
    } catch (error) {
      notification.error({
        message: 'Operation Error',
        description: editingProduct ? "Failed to update product" : "Failed to create product",
      });
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={
        <div className="drawer-header">
          <Space>
            {editingProduct ? <ShoppingOutlined /> : <PlusOutlined />}
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </Title>
              <Text type="secondary">
                {editingProduct ? "Update product information" : "Create a new product"}
              </Text>
            </div>
          </Space>
        </div>
      }
      open={isVisible}
      onClose={handleFormClose}
      destroyOnClose
      width={450}
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
              <ShoppingOutlined />
              <Text strong>Product Name</Text>
            </Space>
          }
          name="name"
          rules={[
            { required: true, message: 'Please input the product name!' },
            { min: 2, message: 'Name must be at least 2 characters!' }
          ]}
        >
          <Input 
            placeholder="Enter product name" 
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <CodeOutlined />
              <Text strong>Product Code</Text>
            </Space>
          }
          name="code"
          rules={[
            { required: true, message: 'Please input the product code!' },
            { min: 1, message: 'Code is required!' }
          ]}
        >
          <Input 
            placeholder="Enter product code" 
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <UploadOutlined />
              <Text strong>Product Image</Text>
            </Space>
          }
          name="image"
        >
          <Upload
            maxCount={1}
            accept="image/*"
            beforeUpload={(file) => {
              setImage(file);
              return false; // Prevent auto upload
            }}
            onRemove={() => setImage(null)}
          >
            <Button icon={<UploadOutlined />}>Select Image</Button>
          </Upload>
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <FileTextOutlined />
              <Text strong>SKU Description</Text>
            </Space>
          }
          name="sku_description"
          rules={[
            { required: true, message: 'Please input the SKU description!' }
          ]}
        >
          <TextArea 
            placeholder="Enter SKU description" 
            rows={3}
            className="horizon-input"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <ShoppingOutlined />
              <Text strong>Unit of Measure</Text>
            </Space>
          }
          name="sku_uom"
          rules={[
            { required: true, message: 'Please input the unit of measure!' }
          ]}
        >
          <Input 
            placeholder="e.g., pieces, kg, liter, etc." 
            size="large"
            className="horizon-input"
          />
        </Form.Item>

        <Space style={{ width: '100%' }} size="middle">
          <Form.Item
            label={
              <Space>
                <DollarOutlined />
                <Text strong>Buy Cost</Text>
              </Space>
            }
            name="sku_buy_cost"
            rules={[
              { required: true, message: 'Please input the buy cost!' }
            ]}
            style={{ flex: 1 }}
          >
            <InputNumber
              placeholder="0.00"
              size="large"
              className="horizon-input"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              addonBefore="$"
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <DollarOutlined />
                <Text strong>Sell Price</Text>
              </Space>
            }
            name="sku_price"
            rules={[
              { required: true, message: 'Please input the sell price!' }
            ]}
            style={{ flex: 1 }}
          >
            <InputNumber
              placeholder="0.00"
              size="large"
              className="horizon-input"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              addonBefore="$"
            />
          </Form.Item>
        </Space>

        <Form.Item
          label={
            <Space>
              <BgColorsOutlined />
              <Text strong>Color</Text>
            </Space>
          }
          name="color"
          rules={[
            { required: true, message: 'Please input the color!' }
          ]}
        >
          <Input 
            placeholder="Enter product color" 
            size="large"
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
              icon={editingProduct ? <SaveOutlined /> : <PlusOutlined />}
              className="horizon-primary-btn"
            >
              {editingProduct ? "Update Product" : "Create Product"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AddProductForm;