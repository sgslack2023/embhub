import React, { useContext, useEffect, useState } from "react";
import { store } from "../utils/store";
import { 
  Typography, 
  Card, 
  Space, 
  Row, 
  Col, 
  Spin, 
  notification,
  Tabs,
  Divider,
  Progress,
  Table,
  Tag,
  Statistic,
  Avatar,
  Select,
  DatePicker,
  Button,
  Modal
} from "antd";
import { 
  DashboardOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  TrophyOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FilterOutlined
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Chart } from 'react-google-charts';
import DashboardKPICard from "../components/DashboardKPICard";
import ProductKPITable from "../components/ProductKPITable";
import { getAuthToken } from "../utils/functions";
import { getApiBaseUrl } from "../utils/network";
import axios from "axios";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface DashboardData {
  product_kpis: any[];
  profit_analysis: {
    top_profit_margin_products: any[];
    profit_distribution: any;
  };
  monthly_analysis: any[];
  yearly_analysis: any[];
  status_distribution: any[];
  summary_stats: {
    total_orders: number;
    total_revenue: number;
    total_profit: number;
    total_expenses: number;
    avg_order_value: number;
  };
}

interface CustomerProfitData {
  customer_profit_analysis: {
    customer: string;
    total_profit: number;
    total_revenue: number;
    order_count: number;
    expense_allocation?: number;
  }[];
  total_expenses?: number;
}

// Utility function to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });
};

// Utility function to format month-year for charts
const formatMonthYear = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    year: '2-digit' 
  });
};

function Home(){
  const { state } = useContext(store);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [customerProfitData, setCustomerProfitData] = useState<CustomerProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerProfitLoading, setCustomerProfitLoading] = useState(true);
  
  // Chart filter states
  const [monthlyFilter, setMonthlyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [availableSkus, setAvailableSkus] = useState<{label: string, value: string}[]>([]);
  
  // SKU data states for charts
  const [monthlySkuData, setMonthlySkuData] = useState<any>(null);
  const [monthlySkuLoading, setMonthlySkuLoading] = useState(false);
  
  // Modal states
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalOrders, setModalOrders] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Product modal states
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{code: string, name: string} | null>(null);
  const [productAnalytics, setProductAnalytics] = useState<any>(null);
  const [productModalLoading, setProductModalLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchCustomerProfitData();
  }, []);

  // Extract available SKUs from product_kpis data
  useEffect(() => {
    if (dashboardData?.product_kpis) {
      const skus = dashboardData.product_kpis.map(item => ({
        label: `${item.product__name} (${item.product__code})`,
        value: item.product__code
      }));
      setAvailableSkus(skus);
    }
  }, [dashboardData]);

  // Fetch monthly SKU data when filters change
  useEffect(() => {
    const loadMonthlySkuData = async () => {
      setMonthlySkuLoading(true);
      const data = await fetchSKUAnalysis(selectedSkus);
      setMonthlySkuData(data);
      setMonthlySkuLoading(false);
    };
    loadMonthlySkuData();
  }, [selectedSkus, monthlyFilter]);

  // Fetch SKU-level analysis when filters change
  const fetchSKUAnalysis = async (skuList: string[]) => {
    try {
      const authHeaders = getAuthToken();
      if (!authHeaders) return null;

      const params = new URLSearchParams();
      if (skuList.length > 0) {
        skuList.forEach(sku => params.append('skus[]', sku));
      }
      params.append('time_period', 'all'); // You can make this dynamic later

      const url = `${getApiBaseUrl()}/masterdata/dashboard/sku-analysis/?${params}`;
      const response = await axios.get(url, authHeaders);
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching SKU analysis:', error);
      return null;
    }
  };

  // Fetch customer profit analysis data
  const fetchCustomerProfitData = async () => {
    try {
      console.log('🔍 Starting customer profit data fetch...');
      
      const authHeaders = getAuthToken();
      if (!authHeaders) {
        console.log('❌ No auth headers found for customer profit data');
        return;
      }

      console.log('✅ Auth headers found for customer profit data:', authHeaders);

      const url = `${getApiBaseUrl()}/masterdata/dashboard/customer-profit-analysis/`;
      console.log('📡 Making request to customer profit API:', url);

      const response = await axios.get(url, authHeaders);
      
      console.log('📊 Customer Profit API Response:', response.data);

      if (response.data.success) {
        console.log('✅ Customer profit data loaded successfully');
        setCustomerProfitData(response.data.data);
      } else {
        console.log('❌ Customer profit API returned success: false');
        throw new Error('Failed to fetch customer profit data');
      }
    } catch (error: any) {
      console.log('💥 Customer profit fetch error:', error);
      
      notification.error({
        message: 'Error',
        description: `Failed to load customer profit data: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setCustomerProfitLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 Starting dashboard data fetch...');
      
      const authHeaders = getAuthToken();
      if (!authHeaders) {
        console.log('❌ No auth headers found');
        notification.error({
          message: 'Authentication Error',
          description: 'Please log in to view dashboard data'
        });
        return;
      }

      console.log('✅ Auth headers found:', authHeaders);

      const url = `${getApiBaseUrl()}/masterdata/dashboard/kpis/`;
      console.log('📡 Making request to:', url);

      const response = await axios.get(url, authHeaders);
      
      console.log('📊 API Response:', response.data);

      if (response.data.success) {
        console.log('✅ Dashboard data loaded successfully');
        setDashboardData(response.data.data);
      } else {
        console.log('❌ API returned success: false');
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error: any) {
      console.log('💥 Dashboard fetch error:', error);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
        console.log('Response headers:', error.response.headers);
      }
      
      const errorMessage = error.response?.data?.error || error.message;
      console.log('Error message:', errorMessage);
      
      notification.error({
        message: 'Error',
        description: `Failed to load dashboard data: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch orders by status
  const fetchOrdersByStatus = async (status: string, statusDisplay: string) => {
    try {
      setModalLoading(true);
      const authHeaders = getAuthToken();
      if (!authHeaders) return;

      const url = `${getApiBaseUrl()}/masterdata/orders/by-status/?status=${status}`;
      const response = await axios.get(url, authHeaders);
      
      if (response.data.success) {
        setModalOrders(response.data.data);
        setModalTitle(`${statusDisplay} Orders`);
        setIsOrderModalVisible(true);
      } else {
        notification.error({
          message: 'Error',
          description: 'Failed to fetch orders'
        });
      }
    } catch (error: any) {
      console.error('Error fetching orders by status:', error);
      notification.error({
        message: 'Error',
        description: `Failed to fetch orders: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Function to fetch product analytics
  const fetchProductAnalytics = async (productCode: string, productName: string) => {
    try {
      setProductModalLoading(true);
      const authHeaders = getAuthToken();
      if (!authHeaders) return;

      const url = `${getApiBaseUrl()}/masterdata/product/analytics/?product_code=${productCode}`;
      const response = await axios.get(url, authHeaders);
      
      if (response.data.success) {
        setProductAnalytics(response.data.data);
        setSelectedProduct({ code: productCode, name: productName });
        setIsProductModalVisible(true);
      } else {
        notification.error({
          message: 'Error',
          description: 'Failed to fetch product analytics'
        });
      }
    } catch (error: any) {
      console.error('Error fetching product analytics:', error);
      notification.error({
        message: 'Error',
        description: `Failed to fetch product analytics: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setProductModalLoading(false);
    }
  };

  const renderStatusDistributionChart = () => {
    if (!dashboardData?.status_distribution) return null;

    const statusColors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
      '#3b82f6', '#06b6d4', '#10b981', '#14b8a6'
    ];

    const pieData = dashboardData.status_distribution.map((item: any, index: number) => ({
      name: item.status_display,
      value: item.count,
      fill: statusColors[index % statusColors.length]
    }));

    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PieChartOutlined style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Order Status Distribution</span>
          </div>
        } 
        className="horizon-card"
        style={{ height: '400px' }}
        bodyStyle={{ padding: '12px', height: 'calc(100% - 65px)' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              dataKey="value"
              label={({ value }: any) => `${value}`}
              labelLine={false}
              paddingAngle={2}
              onClick={(data: any) => {
                if (data && data.name) {
                  // Find the original status data to get the status value
                  const statusItem = dashboardData.status_distribution.find(
                    (item: any) => item.status_display === data.name
                  );
                  if (statusItem) {
                    fetchOrdersByStatus(statusItem.status, statusItem.status_display);
                  }
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any, name: string) => [`${value} orders`, name]}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px', paddingTop: '12px' }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderMonthlyAnalysisChart = () => {
    if (!monthlySkuData?.monthly_analysis || monthlySkuData.monthly_analysis.length === 0) {
      return (
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <LineChartOutlined style={{ marginRight: '8px' }} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Monthly Product Analysis</span>
            </div>
          } 
          className="horizon-card"
          style={{ height: '400px' }}
          bodyStyle={{ padding: '12px', height: 'calc(100% - 57px)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {monthlySkuLoading ? <Spin /> : <Text type="secondary">No data available</Text>}
          </div>
        </Card>
      );
    }

    // Filter data based on selected filter
    let filteredData = [...monthlySkuData.monthly_analysis];
    if (monthlyFilter === 'last6') {
      filteredData = filteredData.slice(-6);
    } else if (monthlyFilter === 'last3') {
      filteredData = filteredData.slice(-3);
    }

    // Format the data for Google Charts
    const googleChartData = [
      ['Month', 'Revenue', 'Profit', 'Cost'],
      ...filteredData.map(item => [
        formatMonthYear(item.month),
        item.total_revenue || 0,
        item.total_profit || 0,
        item.total_cost || 0
      ])
    ];

    // Calculate min and max for proper scaling
    const allValues = filteredData.flatMap(d => [d.total_revenue || 0, d.total_profit || 0, d.total_cost || 0]);
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const padding = (maxVal - minVal) * 0.1;

    const chartOptions = {
      title: '',
      curveType: 'function',
      legend: { 
        position: 'bottom',
        textStyle: { fontSize: 11 }
      },
      series: {
        0: { color: '#3b82f6', lineWidth: 3 }, // Revenue
        1: { color: '#10b981', lineWidth: 3 }, // Profit
        2: { color: '#ef4444', lineWidth: 2, lineDashStyle: [5, 5] } // Cost
      },
      hAxis: {
        textStyle: { fontSize: 11, color: '#64748b' },
        gridlines: { color: '#f1f5f9' }
      },
      vAxis: {
        textStyle: { fontSize: 11, color: '#64748b' },
        gridlines: { color: '#f1f5f9' },
        format: 'short',
        minValue: Math.max(0, minVal - padding),
        maxValue: maxVal + padding
      },
      backgroundColor: 'transparent',
      chartArea: {
        left: 60,
        top: 20,
        width: '85%',
        height: '75%'
      },
      animation: {
        startup: false,
        duration: 0
      }
    };

    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <LineChartOutlined style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Monthly Product Analysis</span>
          </div>
        } 
        className="horizon-card"
        style={{ height: '400px' }}
        bodyStyle={{ padding: '12px', height: 'calc(100% - 57px)' }}
      >
        <div style={{ marginBottom: '10px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', minWidth: '60px' }}>Products:</span>
            <Select
              mode="multiple"
              placeholder={selectedSkus.length > 0 ? `${selectedSkus.length} selected` : "Select Products"}
              value={selectedSkus}
              onChange={setSelectedSkus}
              style={{ width: 200 }}
              size="small"
              maxTagCount={0}
              dropdownStyle={{ maxHeight: 300, overflow: 'auto' }}
              optionLabelProp="label"
            >
              {availableSkus.map(sku => (
                <Option key={sku.value} value={sku.value} label={sku.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{sku.label}</span>
                    {selectedSkus.includes(sku.value) && (
                      <span style={{ color: '#52c41a', fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', minWidth: '40px' }}>Period:</span>
            <Select
              size="small"
              value={monthlyFilter}
              onChange={setMonthlyFilter}
              style={{ width: 100 }}
            >
              <Option value="all">All</Option>
              <Option value="last6">Last 6M</Option>
              <Option value="last3">Last 3M</Option>
            </Select>
          </div>
        </div>
        <div style={{ width: '100%', height: 'calc(100% - 42px)' }}>
          <Chart
            chartType="LineChart"
            width="100%"
            height="100%"
            data={googleChartData}
            options={chartOptions}
          />
        </div>
      </Card>
    );
  };

  const renderCustomerProfitAnalysisChart = () => {
    if (!customerProfitData?.customer_profit_analysis || customerProfitData.customer_profit_analysis.length === 0) {
      return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BarChartOutlined style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Customer Profit Analysis</span>
          </div>
        } 
        className="horizon-card"
        style={{ height: '400px' }}
        bodyStyle={{ padding: '12px', height: 'calc(100% - 57px)' }}
      >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {customerProfitLoading ? <Spin /> : <Text type="secondary">No customer data available</Text>}
          </div>
        </Card>
      );
    }

    // Prepare data for bar chart - top 10 customers by profit
    const topCustomers = customerProfitData.customer_profit_analysis
      .slice(0, 10)
      .map(customer => ({
        name: customer.customer,
        profit: customer.total_profit,
        revenue: customer.total_revenue,
        orders: customer.order_count
      }));

    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BarChartOutlined style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '16px', fontWeight: 600 }}>Customer Profit Analysis</span>
          </div>
        } 
        className="horizon-card"
        style={{ height: '400px' }}
        bodyStyle={{ padding: '12px', height: 'calc(100% - 57px)' }}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topCustomers}
                margin={{
                  top: 10,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  interval={0}
                  axisLine={true}
                  tickLine={true}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'profit') {
                      return [`$${Number(value).toLocaleString()}`, 'Total Profit'];
                    }
                    if (name === 'revenue') {
                      return [`$${Number(value).toLocaleString()}`, 'Total Revenue'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Customer: ${label}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '10px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px'
                  }}
                />
                <Bar 
                  dataKey="profit" 
                  fill="#10b981" 
                  name="Total Profit"
                  radius={[6, 6, 0, 0]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#3b82f6" 
                  name="Total Revenue"
                  radius={[6, 6, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: '0px', 
            width: '100%', 
            textAlign: 'center',
            fontSize: '11px',
            height: '35px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '3px' }}></div>
              <span style={{ color: '#64748b', fontSize: '10px' }}>Total Profit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '3px', opacity: '0.8' }}></div>
              <span style={{ color: '#64748b', fontSize: '10px' }}>Total Revenue</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderProfitDistributionChart = () => {
    if (!dashboardData?.profit_analysis?.profit_distribution) return null;

    const profitData = [
      { 
        name: 'High Profit', 
        fullName: 'High Profit (≥$50)',
        value: dashboardData.profit_analysis.profit_distribution.high_profit, 
        fill: '#10b981' 
      },
      { 
        name: 'Medium Profit', 
        fullName: 'Medium Profit ($20-$50)',
        value: dashboardData.profit_analysis.profit_distribution.medium_profit, 
        fill: '#8b5cf6' 
      },
      { 
        name: 'Low Profit', 
        fullName: 'Low Profit ($0-$20)',
        value: dashboardData.profit_analysis.profit_distribution.low_profit, 
        fill: '#3b82f6' 
      },
      { 
        name: 'Loss Making', 
        fullName: 'Loss Making (<$0)',
        value: dashboardData.profit_analysis.profit_distribution.loss_making, 
        fill: '#ef4444' 
      }
    ].filter(item => item.value > 0); // Only show non-zero values

    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PieChartOutlined style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Profit Distribution</span>
          </div>
        } 
        className="horizon-card"
        style={{ height: '350px' }}
        bodyStyle={{ padding: '12px', height: 'calc(100% - 57px)' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={profitData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={({ value }: any) => `${value}`}
              labelLine={false}
              paddingAngle={3}
            >
              {profitData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any, name: string, props: any) => [
                `${value} products`, 
                props.payload.fullName
              ]}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value: any, entry: any) => entry?.payload?.fullName || value}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderTopPerformingProducts = () => {
    if (!dashboardData?.profit_analysis.top_profit_margin_products) return null;

    // Transform data to match ProductKPITable format
    const topPerformersData = dashboardData.profit_analysis.top_profit_margin_products.map((item: any) => ({
      product__name: item.product__name,
      product__code: item.product__code,
      total_orders: item.total_orders,
      total_quantity: item.total_orders, // Use total_orders as quantity
      total_revenue: item.total_orders * 100, // Approximate if not available
      total_profit: item.total_profit,
      avg_profit_margin: item.avg_profit_margin,
      avg_sales_price: 0, // Not needed for top performers
      avg_item_cost: 0 // Not needed for top performers
    }));

    return (
      <ProductKPITable 
        data={topPerformersData}
        loading={false}
      />
    );
  };

  if (loading) {
    return (
      <div className="horizon-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="horizon-page" style={{ 
      height: '100vh', 
      overflowY: 'auto',
      paddingBottom: '20px'
    }}>
      <div className="page-header">
        <Space align="center">
          <DashboardOutlined className="page-icon" />
          <div>
            <Title level={2} className="page-title">Dashboard</Title>
            <Text className="page-subtitle">Welcome back, {state?.user?.fullname || 'User'}!</Text>
          </div>
        </Space>
      </div>

      {dashboardData && (
        <>
          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <DashboardKPICard
                title="Total Orders"
                value={dashboardData.summary_stats.total_orders}
                icon={<ShoppingCartOutlined />}
                color="#1890ff"
                prefix=""
                suffix=""
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <DashboardKPICard
                title="Total Revenue"
                value={dashboardData.summary_stats.total_revenue}
                icon={<DollarOutlined />}
                color="#52c41a"
                prefix="$"
                suffix=""
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <DashboardKPICard
                title="Total Expenses"
                value={dashboardData.summary_stats.total_expenses.toFixed(2)}
                icon={<TrophyOutlined />}
                color="#f5222d"
                prefix="$"
                suffix=""
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <DashboardKPICard
                title="Total Profit"
                value={dashboardData.summary_stats.total_profit}
                icon={<RiseOutlined />}
                color="#fa8c16"
                prefix="$"
                suffix=""
              />
            </Col>
          </Row>

          {/* Performance Analysis Charts */}
          <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
            <Col xs={24} lg={12}>
              {renderMonthlyAnalysisChart()}
            </Col>
            <Col xs={24} lg={12}>
              {renderCustomerProfitAnalysisChart()}
            </Col>
          </Row>

          {/* Charts and Tables */}
          <Row gutter={[12, 12]}>
            <Col xs={24} lg={16}>
              <Row gutter={[12, 12]}>
                {/* Product KPIs Section */}
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <BarChartOutlined style={{ marginRight: '8px' }} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Product KPIs</span>
                      </div>
                    } 
                    className="horizon-card"
                    bodyStyle={{ padding: '12px' }}
                  >
                    <ProductKPITable 
                      data={dashboardData.product_kpis} 
                      onProductClick={fetchProductAnalytics}
                    />
                  </Card>
                </Col>
                
                {/* Top Performers Section */}
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <TrophyOutlined style={{ marginRight: '8px' }} />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Top Performers</span>
                      </div>
                    } 
                    className="horizon-card"
                    bodyStyle={{ padding: '12px' }}
                  >
                    {renderTopPerformingProducts()}
                  </Card>
                </Col>
              </Row>
            </Col>
            
            <Col xs={24} lg={8}>
              <Row gutter={[12, 12]}>
                <Col span={24}>
                  {renderStatusDistributionChart()}
                </Col>
                <Col span={24}>
                  {renderProfitDistributionChart()}
                </Col>
              </Row>
            </Col>
          </Row>
        </>
      )}
      
      {/* Orders Modal */}
      <Modal
        title={modalTitle}
        open={isOrderModalVisible}
        onCancel={() => setIsOrderModalVisible(false)}
        footer={null}
        width={1000}
        bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
      >
        {modalLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={modalOrders}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Order ID',
                dataIndex: 'id',
                key: 'id',
                render: (id: number) => (
                  <Text strong style={{ color: '#1890ff' }}>{id}</Text>
                )
              },
              {
                title: 'Product',
                dataIndex: 'product__name',
                key: 'product',
                render: (name: string, record: any) => (
                  <div>
                    <Text strong>{name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {record.product__code}
                    </Text>
                  </div>
                )
              },
              {
                title: 'Customer',
                dataIndex: 'customer_name',
                key: 'customer'
              },
              {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity',
                render: (qty: number) => (
                  <Tag color="blue">{qty}</Tag>
                )
              },
              {
                title: 'Status',
                dataIndex: 'status_display',
                key: 'status',
                render: (status: string) => (
                  <Tag color="processing">{status}</Tag>
                )
              },
              {
                title: 'Order Date',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date: string) => (
                  <Text>{new Date(date).toLocaleDateString()}</Text>
                )
              },
              {
                title: 'Revenue',
                dataIndex: 'total_price',
                key: 'revenue',
                render: (price: number) => (
                  <Text strong style={{ color: '#52c41a' }}>
                    ${price?.toLocaleString()}
                  </Text>
                )
              }
            ]}
          />
        )}
      </Modal>

      {/* Product Details Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              background: '#6366f1',
              borderRadius: '10px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px'
            }}>
              <ShoppingCartOutlined style={{ fontSize: '18px', color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                {selectedProduct?.name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                Product Analytics • {selectedProduct?.code}
              </div>
            </div>
          </div>
        }
        open={isProductModalVisible}
        onCancel={() => {
          setIsProductModalVisible(false);
          setSelectedProduct(null);
          setProductAnalytics(null);
        }}
        footer={null}
        width={1100}
        centered={false}
        style={{ 
          top: '20px',
          paddingBottom: 0
        }}
        bodyStyle={{ 
          maxHeight: '75vh', 
          overflowY: 'auto',
          padding: '20px',
          background: '#f8fafc'
        }}
        className="modern-product-modal"
      >
        {productModalLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '8px'
          }}>
            <Spin size="large" />
          </div>
        ) : productAnalytics ? (
          <div>
            {/* Product Summary Stats - Compact Bar */}
            <div style={{ 
              background: '#ffffff',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderRight: '1px solid #f1f5f9', paddingRight: '16px' }}>
                <div style={{ 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '8px', 
                  padding: '8px', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <ShoppingCartOutlined style={{ fontSize: '14px', color: '#3b82f6' }} />
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Orders</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                    {productAnalytics.summary?.total_orders || 0}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderRight: '1px solid #f1f5f9', paddingRight: '16px' }}>
                <div style={{ 
                  backgroundColor: '#f0fdf4', 
                  borderRadius: '8px', 
                  padding: '8px', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <DollarOutlined style={{ fontSize: '14px', color: '#10b981' }} />
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>
                    ${(productAnalytics.summary?.total_revenue || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderRight: '1px solid #f1f5f9', paddingRight: '16px' }}>
                <div style={{ 
                  backgroundColor: '#fffbeb', 
                  borderRadius: '8px', 
                  padding: '8px', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <RiseOutlined style={{ fontSize: '14px', color: '#f59e0b' }} />
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profit</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}>
                    ${(productAnalytics.summary?.total_profit || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  backgroundColor: '#faf5ff', 
                  borderRadius: '8px', 
                  padding: '8px', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <TrophyOutlined style={{ fontSize: '14px', color: '#8b5cf6' }} />
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Margin</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#8b5cf6' }}>
                    {(productAnalytics.summary?.avg_profit_margin || 0).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Performance Chart */}
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <LineChartOutlined style={{ marginRight: '8px', fontSize: '14px' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    Monthly Performance Trend
                  </span>
                </div>
              }
              style={{ 
                marginBottom: '0',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                background: '#ffffff'
              }}
              bodyStyle={{ padding: '16px' }}
            >
              {productAnalytics.monthly_data && productAnalytics.monthly_data.length > 0 ? (
                <div style={{ height: '450px', background: '#fff', borderRadius: '6px', padding: '4px' }}>
                  <Chart
                    chartType="LineChart"
                    width="100%"
                    height="100%"
                    data={[
                      ['Month', 'Revenue', 'Profit', 'Cost'],
                      ...productAnalytics.monthly_data
                        .filter((item: any) => item && item.month) // Filter out invalid items
                        .map((item: any) => {
                          try {
                            const monthLabel = new Date(item.month).toLocaleDateString('en-US', { 
                              month: 'short', 
                              year: '2-digit' 
                            });
                            return [
                              monthLabel || 'N/A',
                              Number(item.total_revenue) || 0,
                              Number(item.total_profit) || 0,
                              Number(item.total_cost) || 0
                            ];
                          } catch (error) {
                            console.warn('Error processing chart data item:', item, error);
                            return null;
                          }
                        })
                        .filter(Boolean) // Remove null entries
                    ]}
                    options={{
                      title: '',
                      curveType: 'function',
                      legend: { 
                        position: 'bottom',
                        textStyle: { fontSize: 10, color: '#64748b' },
                        alignment: 'center'
                      },
                      series: {
                        0: { color: '#3b82f6', lineWidth: 3 }, // Revenue
                        1: { color: '#10b981', lineWidth: 3 }, // Profit
                        2: { color: '#ef4444', lineWidth: 2, lineDashStyle: [5, 5] } // Cost
                      },
                      hAxis: {
                        title: 'Month',
                        titleTextStyle: { color: '#64748b', fontSize: 10 },
                        textStyle: { color: '#64748b', fontSize: 10 },
                        gridlines: { color: '#f1f5f9', count: -1 },
                        minValue: 0
                      },
                      vAxis: {
                        title: 'Amount ($)',
                        titleTextStyle: { color: '#64748b', fontSize: 10 },
                        textStyle: { color: '#64748b', fontSize: 10 },
                        format: 'short',
                        gridlines: { color: '#f1f5f9', count: 5 },
                        minValue: 0
                      },
                      backgroundColor: 'transparent',
                      chartArea: {
                        left: 70,
                        top: 30,
                        width: '85%',
                        height: '70%'
                      },
                      animation: {
                        startup: false, // Disable animation to prevent errors
                        duration: 0
                      },
                      pointSize: 4,
                      lineWidth: 2,
                      focusTarget: 'category'
                    }}
                  />
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '32px',
                  color: '#999',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  border: '2px dashed #e0e0e0'
                }}>
                  <LineChartOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#ccc' }} />
                  <div>No monthly data available for this product</div>
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default Home;