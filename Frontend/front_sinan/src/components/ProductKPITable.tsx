import React, { FC } from "react";
import { Table, Tag, Typography, Progress, Space } from "antd";
import { 
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ShoppingOutlined
} from "@ant-design/icons";

const { Text } = Typography;

interface ProductKPIData {
  product__name: string;
  product__code: string;
  total_orders: number;
  total_quantity: number;
  total_revenue: number;
  total_profit: number;
  avg_profit_margin: number;
  avg_sales_price: number;
  avg_item_cost: number;
}

interface ProductKPITableProps {
  data: ProductKPIData[];
  loading?: boolean;
  onProductClick?: (productCode: string, productName: string) => void;
}

const ProductKPITable: FC<ProductKPITableProps> = ({ data, loading = false, onProductClick }) => {
  const columns = [
    {
      title: 'Product',
      dataIndex: 'product__name',
      key: 'product',
      width: 200,
      render: (text: string, record: ProductKPIData) => (
        <div>
          <Text 
            strong 
            style={{ 
              fontSize: '11px', 
              color: onProductClick ? '#6366f1' : '#0f172a',
              cursor: onProductClick ? 'pointer' : 'default',
              fontWeight: '600'
            }}
            onClick={() => onProductClick && onProductClick(record.product__code, record.product__name)}
          >
            {text}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '10px', color: '#94a3b8' }}>
            {record.product__code}
          </Text>
        </div>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'total_orders',
      key: 'orders',
      width: 100,
      align: 'center' as const,
      render: (value: number) => (
        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <ShoppingOutlined style={{ color: '#3b82f6', fontSize: '12px' }} />
          <Text strong style={{ fontSize: '11px', color: '#0f172a' }}>{value}</Text>
        </div>
      ),
    },
    {
      title: 'Revenue',
      dataIndex: 'total_revenue',
      key: 'revenue',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text strong style={{ color: '#10b981', fontSize: '11px', fontWeight: '600' }}>
          ${value?.toFixed(2) || '0.00'}
        </Text>
      ),
    },
    {
      title: 'Profit',
      dataIndex: 'total_profit',
      key: 'profit',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Space>
          {value >= 0 ? (
            <RiseOutlined style={{ color: '#10b981', fontSize: '12px' }} />
          ) : (
            <FallOutlined style={{ color: '#ef4444', fontSize: '12px' }} />
          )}
          <Text strong style={{ color: value >= 0 ? '#10b981' : '#ef4444', fontSize: '11px', fontWeight: '600' }}>
            ${value?.toFixed(2) || '0.00'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Profit Margin',
      dataIndex: 'avg_profit_margin',
      key: 'margin',
      width: 150,
      render: (value: number) => {
        const margin = value || 0;
        const color = margin >= 30 ? '#10b981' : margin >= 15 ? '#f59e0b' : '#ef4444';
        
        return (
          <div>
            <Progress
              percent={Math.min(Math.max(margin, 0), 100)}
              size="small"
              strokeColor={color}
              showInfo={false}
              strokeWidth={6}
              trailColor="#f1f5f9"
              style={{ marginBottom: '4px' }}
            />
            <Text style={{ color, fontWeight: 600, fontSize: '10px' }}>
              {margin.toFixed(1)}%
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Avg Sale Price',
      dataIndex: 'avg_sales_price',
      key: 'avg_price',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ fontSize: '10px', color: '#475569', fontWeight: '500' }}>${value?.toFixed(2) || '0.00'}</Text>
      ),
    },
    {
      title: 'Avg Cost',
      dataIndex: 'avg_item_cost',
      key: 'avg_cost',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text type="secondary">${value?.toFixed(2) || '0.00'}</Text>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      width: 100,
      render: (_: any, record: ProductKPIData) => {
        const margin = record.avg_profit_margin || 0;
        let color = '#10b981';
        let bgColor = '#f0fdf4';
        let text = 'Excellent';
        
        if (margin < 10) {
          color = '#ef4444';
          bgColor = '#fef2f2';
          text = 'Poor';
        } else if (margin < 20) {
          color = '#f59e0b';
          bgColor = '#fffbeb';
          text = 'Good';
        } else if (margin < 30) {
          color = '#3b82f6';
          bgColor = '#eff6ff';
          text = 'Very Good';
        }
        
        return (
          <div style={{
            display: 'inline-block',
            backgroundColor: bgColor,
            color: color,
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '600',
            border: `1px solid ${color}40`
          }}>
            {text}
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="product__code"
      pagination={{
        pageSize: 5,
        showSizeChanger: true,
        pageSizeOptions: ['5', '10', '20'],
        showQuickJumper: false,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} of ${total} products`,
        size: 'small'
      }}
      scroll={{ x: 900 }}
      className="modern-product-table"
      size="small"
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    />
  );
};

export default ProductKPITable;
