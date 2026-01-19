import React, { FC, useState } from "react";
import {
    Modal,
    Upload,
    Button,
    Table,
    Space,
    Typography,
    notification,
    Alert
} from "antd";
import {
    UploadOutlined,
    CloudUploadOutlined,
    FileExcelOutlined,
    CheckCircleOutlined,
    DeleteOutlined
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import axios from "axios";
import { ProductBulkCreateUrl } from "../utils/network";
import { getAuthToken } from "../utils/functions";
import { AuthTokenType } from "../utils/types";

const { Text, Title, Paragraph } = Typography;
const { Dragger } = Upload;

interface ProductBulkUploadModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ProductBulkUploadModal: FC<ProductBulkUploadModalProps> = ({
    isVisible,
    onClose,
    onSuccess,
}) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState<string>("");

    const handleClose = () => {
        setData([]);
        setFileName("");
        setLoading(false);
        onClose();
    };

    const processFile = (file: File) => {
        setLoading(true);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const bstr = e.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Basic validation or transformation if needed
                const formattedData = data.map((item: any, index: number) => ({
                    ...item,
                    key: index,
                    // Ensure numeric fields are numbers
                    sku_buy_cost: Number(item.sku_buy_cost) || 0,
                    sku_price: Number(item.sku_price) || 0,
                }));

                setData(formattedData);
                setLoading(false);
                notification.success({
                    message: "File Parsed",
                    description: `Successfully loaded ${formattedData.length} records.`,
                });
            } catch (error) {
                console.error(error);
                setLoading(false);
                notification.error({
                    message: "Parsing Error",
                    description: "Failed to parse the Excel file. Please ensure it follows the template format.",
                });
            }
        };
        reader.readAsBinaryString(file);
        return false; // Prevent default upload behavior
    };

    const handleSubmit = async () => {
        if (data.length === 0) return;

        setUploading(true);
        try {
            const headers = getAuthToken() as AuthTokenType;
            await axios.post(ProductBulkCreateUrl, data, {
                headers: headers.headers,
            });

            notification.success({
                message: "Upload Successful",
                description: `${data.length} products have been created successfully.`,
            });
            setUploading(false);
            handleClose();
            onSuccess();
        } catch (error: any) {
            console.error(error);
            let errorMessage = "Failed to bulk upload products";

            if (error.response?.data) {
                const data = error.response.data;
                if (Array.isArray(data)) {
                    // Find first non-empty error to display
                    const firstError = data.find((item: any) => Object.keys(item).length > 0);
                    if (firstError) {
                        const firstKey = Object.keys(firstError)[0];
                        const firstMsg = firstError[firstKey];
                        errorMessage = `Row validation error - ${firstKey}: ${Array.isArray(firstMsg) ? firstMsg[0] : firstMsg}`;
                    }
                } else if (data.error) {
                    errorMessage = data.error;
                } else if (typeof data === 'string') {
                    errorMessage = data;
                }
            }

            notification.error({
                message: "Upload Failed",
                description: errorMessage,
            });
            setUploading(false);
        }
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name', width: 200 },
        { title: 'Code', dataIndex: 'code', key: 'code', width: 100 },
        { title: 'Description', dataIndex: 'sku_description', key: 'sku_description', ellipsis: true },
        { title: 'UOM', dataIndex: 'sku_uom', key: 'sku_uom', width: 80 },
        {
            title: 'Buy Cost', dataIndex: 'sku_buy_cost', key: 'sku_buy_cost', width: 100,
            render: (val: number) => `$${val.toFixed(2)}`
        },
        {
            title: 'Sell Price', dataIndex: 'sku_price', key: 'sku_price', width: 100,
            render: (val: number) => `$${val.toFixed(2)}`
        },
        { title: 'Color', dataIndex: 'color', key: 'color', width: 100 },
    ];

    return (
        <Modal
            title={
                <Space>
                    <CloudUploadOutlined />
                    <span>Bulk Upload Products</span>
                </Space>
            }
            open={isVisible}
            onCancel={handleClose}
            width={1000}
            style={{ top: 20 }}
            bodyStyle={{ 
                maxHeight: 'calc(100vh - 200px)', 
                overflowY: 'auto',
                paddingBottom: '10px'
            }}
            footer={[
                <Button key="cancel" onClick={handleClose}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={handleSubmit}
                    loading={uploading}
                    disabled={data.length === 0}
                >
                    {uploading ? "Uploading..." : `Data Verified - Upload ${data.length} Records`}
                </Button>,
            ]}
            className="horizon-modal"
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">

                {data.length === 0 ? (
                    <div style={{ padding: '20px 0' }}>
                        <Paragraph>
                            Upload a filled Excel template to bulk add products.
                            Ensure all required fields are filled correctly.
                        </Paragraph>
                        <Dragger
                            name="file"
                            multiple={false}
                            accept=".xlsx, .xls"
                            showUploadList={false}
                            beforeUpload={processFile}
                            style={{ padding: '20px' }}
                        >
                            <p className="ant-upload-drag-icon">
                                <CloudUploadOutlined style={{ color: '#1890ff' }} />
                            </p>
                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                            <p className="ant-upload-hint">
                                Support for valid Excel files only.
                            </p>
                        </Dragger>
                    </div>
                ) : (
                    <>
                        <Alert
                            message="Review Data"
                            description={`Found ${data.length} records in "${fileName}". Please review below before submitting.`}
                            type="info"
                            showIcon
                            action={
                                <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => setData([])} danger>
                                    Clear & Re-upload
                                </Button>
                            }
                        />

                        <Table
                            dataSource={data}
                            columns={columns}
                            size="small"
                            scroll={{ y: 'calc(100vh - 400px)', x: 900 }}
                            pagination={false}
                            bordered
                        />
                    </>
                )}
            </Space>
        </Modal>
    );
};

export default ProductBulkUploadModal;
