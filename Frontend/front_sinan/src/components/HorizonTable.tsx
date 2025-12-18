import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Input,
  Button,
  Space,
  Dropdown,
  Menu,
  Tag,
  Typography,
  Card,
  Row,
  Col,
  Modal,
  Select,
  DatePicker,
  Tooltip,
  Badge,
  Divider
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SettingOutlined,
  ClearOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { DataProps } from '../utils/types';

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export interface HorizonTableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  sorter?: boolean | Function;
  filterable?: boolean;
  searchable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number';
  filterOptions?: Array<{ label: string; value: any }>;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
  align?: 'left' | 'right' | 'center';
}

export interface HorizonTableProps extends Omit<TableProps<any>, 'columns' | 'title'> {
  columns: HorizonTableColumn[];
  dataSource: any[];
  loading?: boolean;
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  showDelete?: boolean;
  showColumnSettings?: boolean;
  onRefresh?: () => void;
  onDelete?: (selectedKeys: React.Key[]) => void | Promise<void>;
  onExport?: (data: any[], type: 'excel' | 'csv') => void;
  searchPlaceholder?: string;
  exportFileName?: string;
  virtualScrollHeight?: number;
  // New props for bulk action customization
  bulkActionText?: string;
  bulkActionIcon?: React.ReactNode;
  bulkActionType?: 'delete' | 'primary' | 'default';
}

const HorizonTable: React.FC<HorizonTableProps> = ({
  columns: initialColumns,
  dataSource,
  loading = false,
  title,
  showSearch = true,
  showFilters = true,
  showExport = true,
  showRefresh = true,
  showDelete = true,
  showColumnSettings = true,
  onRefresh,
  onDelete,
  onExport,
  searchPlaceholder = "Search across all fields...",
  exportFileName = "data",
  virtualScrollHeight = 400,
  bulkActionText = "Delete Selected",
  bulkActionIcon = <DeleteOutlined />,
  bulkActionType = "delete",
  ...tableProps
}) => {
  // State management
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filteredInfo, setFilteredInfo] = useState<Record<string, FilterValue | null>>({});
  const [sortedInfo, setSortedInfo] = useState<SorterResult<any>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    initialColumns.map(col => col.key)
  );
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalLoading, setConfirmModalLoading] = useState(false);
  const [calculatedHeight, setCalculatedHeight] = useState(virtualScrollHeight);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // Calculate table height dynamically based on actual container size
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    
    const calculateHeight = () => {
      if (tableContainerRef.current) {
        const container = tableContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        
        // Get the viewport height and header height
        const viewportHeight = window.innerHeight;
        const headerHeight = 50; // App header height
        
        // Calculate available height: from container top to viewport bottom
        // Account for header and bottom padding
        const availableHeight = viewportHeight - containerRect.top - headerHeight - 40; // 40px bottom padding
        
        // Use the smaller of: available viewport space or container's current height
        // This ensures table doesn't overflow
        const height = Math.max(300, Math.min(availableHeight, containerRect.height || availableHeight));
        setCalculatedHeight(height);
      } else {
        // Fallback calculation if ref not available
        const headerHeight = 50;
        const pageHeaderHeight = 120;
        const tableHeaderHeight = 100;
        const paddingMargins = 80;
        const availableHeight = window.innerHeight - headerHeight - pageHeaderHeight - tableHeaderHeight - paddingMargins;
        const height = Math.max(300, Math.min(availableHeight, virtualScrollHeight));
        setCalculatedHeight(height);
      }
    };

    // Calculate on mount with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      calculateHeight();
      
      // Set up ResizeObserver after initial calculation
      if (tableContainerRef.current) {
        resizeObserver = new ResizeObserver(calculateHeight);
        resizeObserver.observe(tableContainerRef.current);
        
        // Also observe the card body if available
        const cardBody = tableContainerRef.current.closest('.ant-card-body');
        if (cardBody) {
          resizeObserver.observe(cardBody as HTMLElement);
        }
      }
    }, 100);

    // Recalculate on window resize
    window.addEventListener('resize', calculateHeight);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [virtualScrollHeight]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    let data = [...dataSource];

    // Global search
    if (searchText) {
      data = data.filter((record) =>
        initialColumns.some((column) => {
          if (column.searchable !== false) {
            const value = record[column.dataIndex];
            return value && value.toString().toLowerCase().includes(searchText.toLowerCase());
          }
          return false;
        })
      );
    }

    // Column-specific filters
    Object.keys(columnFilters).forEach((columnKey) => {
      const filterValue = columnFilters[columnKey];
      if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
        const column = initialColumns.find(col => col.key === columnKey);
        if (column) {
          data = data.filter((record) => {
            const value = record[column.dataIndex];
            if (column.filterType === 'select') {
              return value === filterValue;
            } else if (column.filterType === 'text') {
              return value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
            } else if (column.filterType === 'number') {
              return value === Number(filterValue);
            }
            return true;
          });
        }
      }
    });

    return data;
  }, [dataSource, searchText, columnFilters, initialColumns]);

  // Memoized table columns with enhanced features
  const enhancedColumns: ColumnsType<any> = useMemo(() => {
    return initialColumns
      .filter((column) => visibleColumns.includes(column.key))
      .map((column) => {
        const baseColumn: any = {
          ...column,
          sorter: column.sorter !== false,
          sortOrder: sortedInfo.columnKey === column.key ? sortedInfo.order : null,
          ellipsis: column.ellipsis !== false ? { showTitle: false } : false,
        };

        // Add filtering if enabled
        if (column.filterable !== false && showFilters) {
          if (column.filterType === 'select' && column.filterOptions) {
            baseColumn.filters = column.filterOptions.map(option => ({
              text: option.label,
              value: option.value,
            }));
            baseColumn.onFilter = (value: any, record: any) => 
              record[column.dataIndex] === value;
          } else {
            // Auto-generate filters for other types
            const uniqueValues = Array.from(
              new Set(dataSource.map((item) => item[column.dataIndex]))
            ).filter(Boolean);
            
            baseColumn.filters = uniqueValues.slice(0, 10).map((value) => ({
              text: value,
              value,
            }));
            baseColumn.onFilter = (value: any, record: any) =>
              record[column.dataIndex] === value;
          }
          baseColumn.filteredValue = filteredInfo[column.key] || null;
        }

        // Enhanced render with tooltip for ellipsis
        if (column.ellipsis !== false && !column.render) {
          baseColumn.render = (value: any) => (
            <Tooltip title={value} placement="topLeft">
              <span>{value}</span>
            </Tooltip>
          );
        }

        return baseColumn;
      });
  }, [initialColumns, visibleColumns, sortedInfo, filteredInfo, showFilters, dataSource]);

  // Calculate a sensible total width for horizontal scrolling
  const totalScrollX = useMemo(() => {
    // Sum explicit column widths; fall back to a default for columns without width
    const DEFAULT_COL_WIDTH = 120;
    const total = enhancedColumns.reduce((sum, col: any) => {
      const w = col && typeof col.width === 'number' ? col.width : DEFAULT_COL_WIDTH;
      return sum + w;
    }, 0);

    // If nothing calculated, let Ant Design fall back to its own behavior
    return total > 0 ? total : undefined;
  }, [enhancedColumns]);

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
    showSelectAll: true,
    selectAll: true,
  };

  // Handle table changes (pagination, filters, sorter)
  const handleTableChange = (
    pagination: any,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<any> | SorterResult<any>[]
  ) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as SorterResult<any>);
  };

  // Export functions
  const handleExport = (type: 'excel' | 'csv') => {
    if (onExport) {
      onExport(filteredData, type);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      if (type === 'excel') {
        XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
      } else {
        XLSX.writeFile(workbook, `${exportFileName}.csv`);
      }
    }
  };

  // Clear all filters and search
  const handleClearAll = () => {
    setSearchText('');
    setFilteredInfo({});
    setSortedInfo({});
    setColumnFilters({});
  };

  // Delete selected rows
  const handleDelete = () => {
    console.log('HorizonTable handleDelete called with selectedRowKeys:', selectedRowKeys);
    if (selectedRowKeys.length === 0) return;
    
    console.log('About to show modal with bulkActionType:', bulkActionType);
    setConfirmModalVisible(true);
  };

  // Handle modal confirmation
  const handleConfirmAction = async () => {
    console.log('Modal onOk called, calling onDelete with:', selectedRowKeys);
    if (onDelete) {
      setConfirmModalLoading(true);
      try {
        // Call the onDelete function and wait for it to complete
        await onDelete(selectedRowKeys);
        // Only close modal and clear selection after successful completion
        setSelectedRowKeys([]);
        setConfirmModalVisible(false);
      } catch (error) {
        console.error('Error in bulk action:', error);
        // Keep modal open on error so user can retry
      } finally {
        setConfirmModalLoading(false);
      }
    } else {
      setConfirmModalVisible(false);
    }
  };

  // Handle modal cancellation
  const handleCancelAction = () => {
    if (!confirmModalLoading) { // Only allow cancel if not loading
      setConfirmModalVisible(false);
    }
  };

  // Column visibility menu
  const columnVisibilityMenu = (
    <Menu>
      {initialColumns.map((column) => (
        <Menu.Item key={column.key}>
          <Space>
            {visibleColumns.includes(column.key) ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            <span
              onClick={() => {
                if (visibleColumns.includes(column.key)) {
                  setVisibleColumns(visibleColumns.filter(key => key !== column.key));
                } else {
                  setVisibleColumns([...visibleColumns, column.key]);
                }
              }}
            >
              {column.title}
            </span>
          </Space>
        </Menu.Item>
      ))}
    </Menu>
  );

  // Export menu
  const exportMenu = (
    <Menu onClick={({ key }) => handleExport(key as 'excel' | 'csv')}>
      <Menu.Item key="excel" icon={<FileExcelOutlined />}>
        Export to Excel
      </Menu.Item>
      <Menu.Item key="csv" icon={<FilePdfOutlined />}>
        Export to CSV
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="horizon-table-container">
      {/* Single Card Container */}
      <Card className="horizon-table-unified-card" bodyStyle={{ padding: '12px' }}>
        {/* Header Section */}
        <div className="table-header-section">
          <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
            <Col flex="auto">
              <Space align="center">
                {title && (
                  <div className="table-title-section">
                    <Text strong className="table-title">{title}</Text>
                    <Text className="table-subtitle">
                      {filteredData.length} of {dataSource.length} items
                    </Text>
                  </div>
                )}
                {/* Selection indicator - inline with title */}
                {selectedRowKeys.length > 0 && (
                  <div style={{
                    backgroundColor: '#e6f7ff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #91d5ff',
                    fontSize: '12px',
                    color: '#1890ff',
                    fontWeight: 500
                  }}>
                    <Badge count={selectedRowKeys.length} color="#1890ff" style={{ marginRight: '4px' }} />
                    {selectedRowKeys.length} selected
                  </div>
                )}
              </Space>
            </Col>
            <Col flex="none">
              <Space size="small" wrap>
                {/* Search */}
                {showSearch && (
                  <Input
                    placeholder={searchPlaceholder}
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="table-search"
                    allowClear
                    style={{ width: 180 }}
                  />
                )}

                {/* Print Selected Button - Compact version */}
                {selectedRowKeys.length > 0 && showDelete && onDelete && (
                  <Button
                    type={bulkActionType === 'delete' ? undefined : bulkActionType}
                    danger={bulkActionType === 'delete'}
                    icon={bulkActionIcon}
                    onClick={handleDelete}
                    size="small"
                    style={{ 
                      backgroundColor: bulkActionType === 'primary' ? '#1890ff' : undefined,
                      borderColor: bulkActionType === 'primary' ? '#1890ff' : undefined,
                      color: bulkActionType === 'primary' ? '#fff' : undefined
                    }}
                  >
                    {bulkActionText}
                  </Button>
                )}

                {/* Filters Toggle */}
                {showFilters && (
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setFiltersVisible(!filtersVisible)}
                    className={filtersVisible ? 'filter-btn active' : 'filter-btn'}
                    size="small"
                  >
                    Filters
                  </Button>
                )}

                {/* Clear All */}
                <Button icon={<ClearOutlined />} onClick={handleClearAll} size="small">
                  Clear
                </Button>

                {/* Export */}
                {showExport && (
                  <Dropdown overlay={exportMenu} trigger={['click']}>
                    <Button icon={<DownloadOutlined />} size="small">
                      Export
                    </Button>
                  </Dropdown>
                )}

                {/* Refresh */}
                {showRefresh && onRefresh && (
                  <Button icon={<ReloadOutlined />} onClick={onRefresh} size="small">
                    Refresh
                  </Button>
                )}

                {/* Column Settings */}
                {showColumnSettings && (
                  <Dropdown overlay={columnVisibilityMenu} trigger={['click']}>
                    <Button icon={<SettingOutlined />} size="small">
                      Columns
                    </Button>
                  </Dropdown>
                )}
              </Space>
            </Col>
          </Row>

          {/* Advanced Filters Row */}
          {filtersVisible && showFilters && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Row gutter={[12, 8]}>
                {initialColumns
                  .filter(col => col.filterable !== false)
                  .map((column) => (
                    <Col key={column.key} xs={24} sm={12} md={8} lg={6}>
                      <div className="filter-item">
                        <Text className="filter-label">{column.title}</Text>
                        {column.filterType === 'select' && column.filterOptions ? (
                          <Select
                            placeholder={`Filter by ${column.title}`}
                            value={columnFilters[column.key]}
                            onChange={(value) => setColumnFilters({
                              ...columnFilters,
                              [column.key]: value
                            })}
                            allowClear
                            style={{ width: '100%' }}
                          >
                            {column.filterOptions.map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        ) : column.filterType === 'date' ? (
                          <RangePicker
                            onChange={(dates) => setColumnFilters({
                              ...columnFilters,
                              [column.key]: dates
                            })}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          <Input
                            placeholder={`Filter by ${column.title}`}
                            value={columnFilters[column.key]}
                            onChange={(e) => setColumnFilters({
                              ...columnFilters,
                              [column.key]: e.target.value
                            })}
                            allowClear
                          />
                        )}
                      </div>
                    </Col>
                  ))}
              </Row>
            </>
          )}

        </div>

        {/* Divider before table */}
        <Divider style={{ margin: '8px 0 8px 0' }} />

        {/* Main Table with Virtual Scroll */}
        <div className="table-container" ref={tableContainerRef}>
          <Table
            {...tableProps}
            columns={enhancedColumns}
            dataSource={filteredData}
            rowSelection={showDelete ? {
              ...rowSelection,
              fixed: true,
              columnWidth: 48,
            } : undefined}
            loading={loading}
            onChange={handleTableChange}
            pagination={false}
            scroll={{
              x: 'max-content',
              y: calculatedHeight,
              scrollToFirstRowOnChange: false,
            }}
            size="middle"
            sticky={{
              offsetHeader: 0,
              offsetScroll: 0,
              getContainer: () => window,
            }}
          />
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        title={bulkActionType === 'delete' ? 'Delete Selected Items' : 'Confirm Action'}
        open={confirmModalVisible}
        onOk={handleConfirmAction}
        onCancel={handleCancelAction}
        okText={confirmModalLoading 
          ? 'Processing...' 
          : (bulkActionType === 'delete' ? 'Yes, Delete' : 'Yes, Continue')
        }
        cancelText="Cancel"
        okType={bulkActionType === 'delete' ? 'danger' : 'primary'}
        className="horizon-modal"
        confirmLoading={confirmModalLoading}
        closable={!confirmModalLoading}
        maskClosable={!confirmModalLoading}
        cancelButtonProps={{ disabled: confirmModalLoading }}
      >
        <p>
          {confirmModalLoading ? (
            bulkActionType === 'delete' 
              ? `Deleting ${selectedRowKeys.length} item(s)...`
              : `Processing ${selectedRowKeys.length} item(s)...`
          ) : (
            bulkActionType === 'delete' 
              ? `Are you sure you want to delete ${selectedRowKeys.length} selected item(s)?`
              : `Perform action on ${selectedRowKeys.length} selected item(s)?`
          )}
        </p>
      </Modal>
    </div>
  );
};

export default HorizonTable; 