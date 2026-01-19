import { useContext} from "react"
import {useState} from 'react' 
import AuthComponent from '../components/AuthComponent'
import {ActionTypes, CustomAxiosError,DataProps} from '../utils/types'
import axios from 'axios'
import { LoginUrl } from '../utils/network'
import {notification} from 'antd' 
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/hooks'
import { store } from '../utils/store'

interface CheckUserProps{
    user_id:number
}


function CheckUser() {

    
    const [loading,setLoading]= useState(false) 
    const {dispatch}= useContext(store)
    const history=useNavigate()

    useAuth({
        
        successCallBack:()=>{
            history("/")
        }
    })

    const onSubmit =async (values:DataProps)=>{
        setLoading(true)
        const response = await axios.post<CheckUserProps>(LoginUrl,{...values,is_new_user:true}).catch(
            (e:CustomAxiosError)=>{
                notification.error({
                    message:"User Check Error",
                    description:e.response?.data.error
                })
            }
        )
        if(response){
            dispatch({
                type:ActionTypes.UPDATE_PASSWORD_USER_ID,
                payload:response.data.user_id
            })
            history("/create-password")
        }
        setLoading(false)
    }
    return <AuthComponent 
    titleText="Verify Yourself"
    isPassword={false}
    bottonText="Submit"
    linkText="Go back"
    linkPath="/login"
    loading={loading}
    onSubmit={onSubmit}
    />

}
export default CheckUser