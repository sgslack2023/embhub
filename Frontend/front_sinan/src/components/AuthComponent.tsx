import { Form, Input, Button, Typography, Space, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { DataProps } from '../utils/types';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import logo from '../assets/logo.png';

const { Title, Text } = Typography;

interface AuthComponentProps {
  titleText?: string;
  isPassword?: boolean;
  bottonText?: string;
  linkText?: string;
  linkPath?: string;
  onSubmit: (value: DataProps) => void;
  loading?: boolean;
  isUpdatePassword?: boolean;
}

function AuthComponent({
  titleText = 'Sign in',
  isPassword = true,
  bottonText = 'Login',
  linkText = 'Forgot Password?',
  linkPath = '/forgotpassword',
  onSubmit,
  loading = false,
  isUpdatePassword = false,
}: AuthComponentProps) {
  return (
    <div className="horizon-auth-container">
      <div className="horizon-auth-card">
        <div className="auth-header">
          <div className="logo-section">
            <img src={logo} alt="logo" className="auth-logo" />
          </div>
          <Title level={2} className="auth-title">{titleText}</Title>
          <Text className="auth-subtitle">
            {isUpdatePassword ? 'Update your password' : 'Enter your credentials to access your account'}
          </Text>
        </div>

        <Divider className="auth-divider" />

        <Form layout="vertical" onFinish={onSubmit} className="auth-form">
          {!isUpdatePassword && (
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input 
                placeholder="Enter your email" 
                type="email" 
                prefix={<MailOutlined className="input-icon" />}
                size="large"
                className="horizon-input"
              />
            </Form.Item>
          )}
          
          {isPassword && (
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password 
                placeholder="Enter your password" 
                prefix={<LockOutlined className="input-icon" />}
                size="large"
                className="horizon-input"
              />
            </Form.Item>
          )}
          
          {isUpdatePassword && (
            <Form.Item
              name="cpassword"
              rules={[{ required: true, message: 'Please input your password confirmation!' }]}
            >
              <Input.Password 
                placeholder="Confirm your password" 
                prefix={<LockOutlined className="input-icon" />}
                size="large"
                className="horizon-input"
              />
            </Form.Item>
          )}
          
          <Form.Item className="auth-button-item">
            <Button 
              htmlType="submit" 
              type="primary" 
              block 
              loading={loading}
              size="large"
              className="horizon-primary-btn"
            >
              {bottonText}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Link to={linkPath} className="auth-link">{linkText}</Link>
        </div>
      </div>
    </div>
  );
}

export default AuthComponent;