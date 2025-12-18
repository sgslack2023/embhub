import {useState} from 'react' 
import AuthComponent from '../components/AuthComponent'
import {CustomAxiosError,DataProps} from '../utils/types'
import axios from 'axios'
import { fullname, id, role, tokenName } from '../utils/data'

import { LoginUrl } from '../utils/network'
import {notification} from 'antd' 
import {useNavigate} from 'react-router-dom'
import { useAuth } from '../utils/hooks'

interface LoginDataProps{
    data:{
        access:string,
        id:number,
        role:string,
        fullname:string,

    }
}

function Login() {
    
    const [loading,setLoading]= useState(false) 
    const history=useNavigate()

    useAuth({
        successCallBack:()=>{
            history("/")
        }
    })

    const onSubmit =async (values:DataProps)=>{
        setLoading(true)
        const response :LoginDataProps = await axios.post(LoginUrl,values).catch(
            (e:CustomAxiosError)=>{
                notification.error({
                    message:"Login Error",
                    description:e.response?.data.error
                })
            }
        ) as LoginDataProps
        if(response){
            localStorage.setItem(tokenName,response.data.access)
            localStorage.setItem(id, response.data.id.toString());
            localStorage.setItem(role, response.data.role);
            localStorage.setItem(fullname, response.data.fullname);
            history("/") 
        }
        setLoading(false)
    }
    return <AuthComponent onSubmit={onSubmit}
    loading={loading}
    />

}
export default Login