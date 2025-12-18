import React, { useState } from "react";
import { notification, Form, Input, Button } from 'antd';
import axios from 'axios';
import { ResetPasswordUrl } from '../utils/network'; // Assuming you have a URL for reset password endpoint
import { useNavigate } from 'react-router-dom';

function ResetPassword() {
    const [loading, setLoading] = useState(false);
    const history = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const response = await axios.post(ResetPasswordUrl, values);
            notification.success({
                message: "Password Reset Successful",
                description: "Your password has been reset successfully."
            });
            history("/login"); // Redirect to login page after password reset
        } catch (error) {
            notification.error({
                message: "Password Reset Error",
                description: "An error occurred while resetting your password."
            });
        }
        setLoading(false);
    };

    return (
        <div className="login">
            <div className="inner">
                <div className="header">
                    <h3>Reset Password</h3>
                </div>
                <Form
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="Token"
                        name="token"
                        rules={[{ required: true, message: 'Please input the token!' }]}
                    >
                        <Input placeholder="Token" />
                    </Form.Item>
                    <Form.Item
                        label="New Password"
                        name="password"
                        rules={[{ required: true, message: 'Please input your new password!' }]}
                    >
                        <Input.Password placeholder="New Password" />
                    </Form.Item>
                    <Form.Item
                        label="Confirm Password"
                        name="cpassword"
                        rules={[{ required: true, message: 'Please input your password confirmation!' }]}
                    >
                        <Input.Password placeholder="Confirm Password" />
                    </Form.Item>
                    <Form.Item>
                        <Button htmlType="submit" type="primary" block loading={loading}>
                            Submit
                        </Button>
                    </Form.Item>
                </Form>
                <p><a href="/login">Go back to Login</a></p>
            </div>
        </div>
    );
}

export default ResetPassword;