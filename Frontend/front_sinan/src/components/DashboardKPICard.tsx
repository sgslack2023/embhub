import React, { FC } from "react";
import { Card, Typography, Space } from "antd";
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  FallOutlined
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface DashboardKPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  prefix?: string;
  suffix?: string;
}

const DashboardKPICard: FC<DashboardKPICardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  prefix = "",
  suffix = ""
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card
      className="dashboard-kpi-card"
      style={{
        height: '120px',
        background: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '16px', height: '100%' }}
      hoverable
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
      }}
    >
      {/* Top colored bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: color,
        zIndex: 1
      }} />

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        height: '100%',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div>
            <Text style={{ 
              fontSize: '10px', 
              fontWeight: 500,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}>
              {title}
            </Text>
            <div style={{ marginTop: '6px' }}>
              <Title level={2} style={{ 
                margin: 0, 
                color: '#0f172a',
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: 1.2
              }}>
                <span style={{ color: color }}>
                  {prefix}{formatValue(value)}{suffix}
                </span>
              </Title>
            </div>
          </div>
          
          {trend && (
            <div style={{ 
              marginTop: '12px', 
              display: 'flex', 
              alignItems: 'center',
              backgroundColor: trend.isPositive ? '#f0f9ff' : '#fef2f2',
              padding: '6px 10px',
              borderRadius: '20px',
              width: 'fit-content'
            }}>
              {trend.isPositive ? (
                <ArrowUpOutlined style={{ color: '#0ea5e9', fontSize: '12px' }} />
              ) : (
                <ArrowDownOutlined style={{ color: '#ef4444', fontSize: '12px' }} />
              )}
              <Text 
                style={{ 
                  marginLeft: '6px', 
                  fontSize: '12px',
                  color: trend.isPositive ? '#0ea5e9' : '#ef4444',
                  fontWeight: 600
                }}
              >
                {Math.abs(trend.value)}%
              </Text>
            </div>
          )}
        </div>
        
        <div style={{
          backgroundColor: `${color}15`,
          borderRadius: '10px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '44px',
          minHeight: '44px'
        }}>
          <div style={{ 
            fontSize: '20px', 
            color: color
          }}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DashboardKPICard;
