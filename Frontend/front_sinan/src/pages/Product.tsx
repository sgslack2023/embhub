import React, { FC, useEffect, useState } from "react";
import { Button, Modal, notification, Space, Tag, Tooltip, Image } from "antd";
import { useGetProducts } from "../utils/hooks";
import { AuthTokenType, ProductProps } from "../utils/types";
import { getAuthToken, getProducts } from "../utils/functions";
import AddProductForm from "../components/AddProductForm";
import HorizonTable, { HorizonTableColumn } from "../components/HorizonTable";
import axios from "axios";
import { ProductsUrl, ProductTemplateUrl } from "../utils/network";
import ProductBulkUploadModal from "../components/ProductBulkUploadModal";
import dayjs from "dayjs";
import {
  ShoppingOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CodeOutlined,
  CalendarOutlined,
  DollarOutlined,
  BgColorsOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  DownloadOutlined
} from "@ant-design/icons";

const Product: FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [bulkUploadVisible, setBulkUploadVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductProps | null>(null);
  const [fetching, setFetching] = useState(true);
  const [products, setProducts] = useState<ProductProps[] | undefined>();

  useGetProducts(setProducts, setFetching);

  const formatCurrency = (amount: string | number) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const columns: HorizonTableColumn[] = [
    {
      key: 'product',
      title: 'Product',
      dataIndex: 'product',
      width: 320,
      sorter: false,
      filterable: false,
      searchable: true,
      fixed: 'left',
      render: (_, record: ProductProps) => (
        <Space>
          {record.image ? (
            <Image
              width={40}
              height={40}
              src={record.image}
              alt={record.name}
              style={{ borderRadius: '6px', objectFit: 'cover' }}
              fallback="data:image/png;base64,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"
            />
          ) : (
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '6px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              <ShoppingOutlined />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#2d3748' }}>{record.name}</div>
            <div style={{ fontSize: '11px', color: '#718096' }}>
              <CodeOutlined style={{ marginRight: 4 }} />
              {record.code}
            </div>
          </div>
        </Space>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'sku_description',
      width: 200,
      sorter: false,
      filterable: false,
      searchable: true,
      render: (description: string) => (
        <div style={{ maxWidth: 180 }}>
          <Tooltip title={description}>
            <span style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '12px',
              color: '#666'
            }}>
              {description}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      key: 'uom',
      title: 'UOM',
      dataIndex: 'sku_uom',
      width: 100,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (uom: string) => (
        <Tag color="geekblue" style={{ borderRadius: '6px' }}>
          {uom}
        </Tag>
      ),
    },
    {
      key: 'buy_cost',
      title: 'Buy Cost',
      dataIndex: 'sku_buy_cost',
      width: 120,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (cost: string) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{formatCurrency(cost)}</span>
        </Space>
      ),
    },
    {
      key: 'sell_price',
      title: 'Sell Price',
      dataIndex: 'sku_price',
      width: 120,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (price: string) => (
        <Space>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{formatCurrency(price)}</span>
        </Space>
      ),
    },
    {
      key: 'color',
      title: 'Color',
      dataIndex: 'color',
      width: 100,
      sorter: true,
      filterable: true,
      filterType: 'text',
      render: (color: string) => (
        <Space>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: color.toLowerCase(),
              border: '1px solid #d9d9d9'
            }}
          />
          <span style={{ textTransform: 'capitalize' }}>{color}</span>
        </Space>
      ),
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
      width: 140,
      sorter: false,
      filterable: false,
      searchable: false,
      fixed: 'right',
      render: (_, record: ProductProps) => (
        <Space>
          <Tooltip title="Edit Product">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="action-btn edit-btn"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Product">
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

  const onCloseWithoutEditing = () => {
    setEditingProduct(null);
  };

  useEffect(() => {
    if (editingProduct) {
      setDrawerVisible(true);
    }
  }, [editingProduct]);

  const handleEdit = (record: ProductProps) => {
    setEditingProduct(record);
  };

  const handleDeleteSingle = (productId: number) => {
    setProductToDelete(productId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    setDeletingProduct(true);
    try {
      const headers = getAuthToken() as AuthTokenType;
      await axios.delete(`${ProductsUrl}/${productToDelete}`, {
        headers: headers.headers
      });
      getProducts(setProducts, setFetching);
      notification.success({
        message: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete product",
      });
    } finally {
      setDeletingProduct(false);
      setDeleteModalVisible(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setProductToDelete(null);
  };

  const handleDeleteSelected = async (selectedKeys: React.Key[]) => {
    try {
      const headers = getAuthToken() as AuthTokenType;
      await Promise.all(
        selectedKeys.map(productId =>
          axios.delete(`${ProductsUrl}/${productId}`, {
            headers: headers.headers
          })
        )
      );
      getProducts(setProducts, setFetching);
      notification.success({
        message: "Success",
        description: `${selectedKeys.length} product(s) deleted successfully`,
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete selected products",
      });
    }
  };

  const handleRefresh = () => {
    getProducts(setProducts, setFetching);
  };

  const onCreateProduct = () => {
    setDrawerVisible(true);
    setEditingProduct(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const headers = getAuthToken() as AuthTokenType;
      const response = await axios.get(ProductTemplateUrl, {
        headers: headers.headers,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'product_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to download template",
      });
    }
  };

  return (
    <div className="horizon-page">
      <div className="page-header">
        <Space align="center">
          <ShoppingOutlined className="page-icon" />
          <div>
            <h2 className="page-title">Product Master</h2>
            <p className="page-subtitle">Manage your product catalog and inventory</p>
          </div>
        </Space>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            size="large"
          >
            Download Template
          </Button>
          <Button
            icon={<CloudUploadOutlined />}
            onClick={() => setBulkUploadVisible(true)}
            size="large"
          >
            Bulk Upload
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateProduct}
            size="large"
            className="horizon-primary-btn"
          >
            Add Product
          </Button>
        </Space>
      </div>

      <HorizonTable
        columns={columns}
        dataSource={products || []}
        loading={fetching}
        showSearch={true}
        showFilters={true}
        showExport={true}
        showRefresh={true}
        showDelete={true}
        showColumnSettings={true}
        onRefresh={handleRefresh}
        onDelete={handleDeleteSelected}
        searchPlaceholder="Search products by name, code, or description..."
        exportFileName="products"
        rowKey="id"
        virtualScrollHeight={400}
      />

      <AddProductForm
        onSuccessCallBack={() => {
          setDrawerVisible(false);
          getProducts(setProducts, setFetching);
        }}
        isVisible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        editingProduct={editingProduct}
        onCloseWithoutEditing={onCloseWithoutEditing}
      />

      <ProductBulkUploadModal
        isVisible={bulkUploadVisible}
        onClose={() => setBulkUploadVisible(false)}
        onSuccess={() => {
          getProducts(setProducts, setFetching);
        }}
      />

      <Modal
        title="Delete Product"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okType="danger"
        confirmLoading={deletingProduct}
        className="horizon-modal"
        width={400}
        centered
      >
        <p style={{ margin: '12px 0' }}>Are you sure you want to delete this product?</p>
      </Modal>
    </div>
  );
};

export default Product;