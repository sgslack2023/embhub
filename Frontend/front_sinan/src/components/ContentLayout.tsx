import { FC } from "react";
import HorizonTable, { HorizonTableColumn } from "./HorizonTable";

interface ContentLayoutProps {
  pageTitle: string;
  buttontitle: string;
  setModalState: (val: boolean) => void;
  dataSource: any[];
  columns: HorizonTableColumn[];
  fetching: boolean;
  includeFilters: boolean;
  model_name?: string;
  onAddRow: () => void;
  onDeleteSelected: (ids: number[]) => void;
  onRefresh?: () => void;
}

const ContentLayout: FC<ContentLayoutProps> = ({
  pageTitle,
  buttontitle,
  setModalState,
  dataSource,
  columns,
  fetching,
  model_name,
  includeFilters,
  onAddRow,
  onDeleteSelected,
  onRefresh,
}) => {

  const handleDelete = (selectedKeys: React.Key[]) => {
    onDeleteSelected(selectedKeys as number[]);
  };

  const handleExport = (data: any[], type: 'excel' | 'csv') => {
    // Custom export logic can be implemented here if needed
    console.log(`Exporting ${data.length} records as ${type}`);
  };

  return (
    <div className="horizon-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{pageTitle}</h2>
          <p className="page-subtitle">
            Manage your {pageTitle.toLowerCase()} data with advanced filtering and search
          </p>
        </div>
        <div className="page-actions">
          <button onClick={onAddRow} className="horizon-primary-btn">
            {buttontitle}
          </button>
        </div>
      </div>

      <HorizonTable
        title={`${pageTitle} Management`}
        columns={columns}
        dataSource={dataSource}
        loading={fetching}
        showSearch={true}
        showFilters={includeFilters}
        showExport={true}
        showRefresh={!!onRefresh}
        showDelete={true}
        showColumnSettings={true}
        onRefresh={onRefresh}
        onDelete={handleDelete}
        onExport={handleExport}
        searchPlaceholder={`Search ${pageTitle.toLowerCase()}...`}
        exportFileName={pageTitle.toLowerCase().replace(/\s+/g, '_')}
        virtualScrollHeight={400}
        rowKey="id"
      />
    </div>
  );
};

export default ContentLayout;
