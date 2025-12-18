import {useState,FC} from "react"
import { useAuth } from "../utils/hooks"
import { logout } from "../utils/functions"
import Layout from "./Layout";

interface Props {
    children: React.ReactNode;
  }

const AuthRoute:React.FC<Props> = ({ children }) =>{
    const [loading,setLoading]= useState(true)
    useAuth({
        errorCallBack:()=>{
            logout()},
        successCallBack:()=>{
            setLoading(false)
        }
    })

    if(loading) {
        return <i>loading...</i>
    }
    return <Layout>{children}</Layout>

}
export default AuthRoute