
import { useContext,useEffect } from "react"
import {useState} from 'react' 
import AuthComponent from '../components/AuthComponent'
import {ActionTypes, CustomAxiosError,DataProps} from '../utils/types'
import axios from 'axios'

import {notification} from 'antd' 
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/hooks'
import { store } from '../utils/store'
import { UpdatePasswordUrl } from '../utils/network'


function UpdateUserPassword() {

    
    const [loading,setLoading]= useState(false) 
    const {state:{updatePasswordUserId},dispatch}= useContext(store)
    const history=useNavigate()

    useEffect(()=>{
        if(!updatePasswordUserId){
            history("/")
        }

    },[])


    useAuth({
        
        successCallBack:()=>{
            history("/")
        }
    })

    const onSubmit =async (values:DataProps)=>{
        
        if(values["password"]!==values["cpassword"]){
            notification.error({message:"Passwords don't match"})
            return
        }
        setLoading(true)
        const response = await axios.post(UpdatePasswordUrl,{...values,user_id:updatePasswordUserId}).catch(
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
                payload:null
            })
            notification.success({
                message:"Password Set up",
                description:"Login with the new password"
        })
            history("/")
       }
        setLoading(false)
    }
    return <AuthComponent 
    titleText="Create Password"
    isUpdatePassword={true}
    bottonText="Update"
    linkText="Go back"
    linkPath="/check-user"
    loading={loading}
    onSubmit={onSubmit}
    />

}
export default UpdateUserPassword