import { useContext,useEffect } from "react"
import { ActionTypes,AuthProps,UserType, GoogleDriveSettingsProps, ProductProps, AccountProps, PackingSlipProps} from "./types"
import { authHandler, getUsers, getGoogleDriveSettings, getProducts, getAccounts, getPackingSlips} from "./functions"
import { store } from "./store"




export const useAuth =async({errorCallBack,successCallBack}:AuthProps)=>{
    const{dispatch}=useContext(store)
    
    useEffect(()=>{
        const checkUser=async () => {
            const user: UserType|null=await authHandler()
            if(!user){
                if(errorCallBack){
                    errorCallBack()
                }
                return
            }
            if(successCallBack){
                dispatch({type:ActionTypes.UPDATE_USER_INFO,payload:user})
                successCallBack()
            }
            
        }
        checkUser()
    },[])
}





export const useGetUsers = (setUsers: (data: any) => void, setFetching: (val: boolean) => void) => {
  useEffect(() => {
    setFetching(true);
    getUsers(setUsers, setFetching);
  }, [setUsers, setFetching]);
};

export const useGetGoogleDriveSettings = (setSettings: (data: GoogleDriveSettingsProps[]) => void, setFetching: (val: boolean) => void) => {
  useEffect(() => {
    setFetching(true);
    getGoogleDriveSettings(setSettings, setFetching);
  }, [setSettings, setFetching]);
};

export const useGetProducts = (setProducts: (data: ProductProps[]) => void, setFetching: (val: boolean) => void) => {
  useEffect(() => {
    setFetching(true);
    getProducts(setProducts, setFetching);
  }, [setProducts, setFetching]);
};

export const useGetAccounts = (setAccounts: (data: AccountProps[]) => void, setFetching: (val: boolean) => void) => {
  useEffect(() => {
    setFetching(true);
    getAccounts(setAccounts, setFetching);
  }, [setAccounts, setFetching]);
};

export const useGetPackingSlips = (setPackingSlips: (data: PackingSlipProps[]) => void, setFetching: (val: boolean) => void) => {
  useEffect(() => {
    setFetching(true);
    getPackingSlips(setPackingSlips, setFetching);
  }, [setPackingSlips, setFetching]);
};


