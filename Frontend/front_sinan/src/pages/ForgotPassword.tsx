import { useContext, useState } from "react";
import AuthComponent from '../components/AuthComponent';
import { notification } from 'antd';
import axios from 'axios';
import { ForgotPasswordUrl } from '../utils/network'; // Assuming you have a URL for forgot password endpoint
import { useNavigate } from 'react-router-dom';

function ForgetPassword() {
    const [loading, setLoading] = useState(false);
    const history = useNavigate();

    const onSubmit = async (values:any) => {
        setLoading(true);
        try {
            const response = await axios.post(ForgotPasswordUrl, values);
            notification.success({
                message: "Reset Password Link Sent",
                description: "A reset password link has been sent to your email."
            });
            history("/"); // Redirect to home or login page after sending reset password link
        } catch (error) {
            notification.error({
                message: "Forgot Password Error",
                          });
        }
        setLoading(false);
    };

    return (
        <AuthComponent 
            titleText="Forgot Password"
            isPassword={false}
            bottonText="Submit"
            linkText="Go back to Login"
            linkPath="/login"
            loading={loading}
            onSubmit={onSubmit}
        />
    );
}

export default ForgetPassword;