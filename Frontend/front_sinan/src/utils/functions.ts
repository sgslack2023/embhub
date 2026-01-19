import axios, { AxiosResponse } from "axios"
import { tokenName } from "./data"
import { MeUrl, UsersUrl, GoogleDriveSettingsUrl, ProductsUrl, AccountsUrl, PackingSlipsUrl, EMBHubRunAutomationUrl } from "./network"
import { AuthTokenType, UserType, GoogleDriveSettingsProps, ProductProps, AccountProps, PackingSlipProps } from "./types"

export const getAuthToken= ():AuthTokenType|null=>{
    const accessToken =localStorage.getItem(tokenName)
    if(!accessToken){
        return null
    }

    return {headers:{Authorization:`Bearer ${accessToken}`}}

}

export const logout =()=>{
    localStorage.removeItem(tokenName)
    window.location.href="/login"

}

export const authHandler=async ():Promise<UserType | null>=>{
    const headers=getAuthToken()
        if(!headers){
            return null
    }
    const response:AxiosResponse =await axios.get(MeUrl,headers).catch(
        (e)=>{}
    ) as AxiosResponse
    if(response){
        return response.data as UserType
    }
    return null

}


export const getUsers = async (
  setUsers: (data: any) => void,
  setFetching: (val: boolean) => void
) => {
  const headers = getAuthToken() as AuthTokenType;
  setFetching(true);

  try {
    const response: AxiosResponse = await axios.get(UsersUrl, headers);
    
    setUsers(response.data);
  } finally {
    setFetching(false);
  }
};

export const getGoogleDriveSettings = async (
  setSettings: (data: GoogleDriveSettingsProps[]) => void,
  setFetching: (val: boolean) => void
) => {
  const headers = getAuthToken() as AuthTokenType;
  setFetching(true);

  try {
    const response: AxiosResponse = await axios.get(GoogleDriveSettingsUrl, headers);
    setSettings(response.data);
  } finally {
    setFetching(false);
  }
};

export const getProducts = async (
  setProducts: (data: ProductProps[]) => void,
  setFetching: (val: boolean) => void
) => {
  const headers = getAuthToken() as AuthTokenType;
  setFetching(true);

  try {
    const response: AxiosResponse = await axios.get(ProductsUrl, headers);
    setProducts(response.data);
  } finally {
    setFetching(false);
  }
};

export const getAccounts = async (
  setAccounts: (data: AccountProps[]) => void,
  setFetching: (val: boolean) => void
) => {
  const headers = getAuthToken() as AuthTokenType;
  setFetching(true);

  try {
    const response: AxiosResponse = await axios.get(AccountsUrl, headers);
    setAccounts(response.data);
  } finally {
    setFetching(false);
  }
};

export const getPackingSlips = async (
  setPackingSlips: (data: PackingSlipProps[]) => void,
  setFetching: (val: boolean) => void
) => {
  const headers = getAuthToken() as AuthTokenType;
  setFetching(true);

  try {
    const response: AxiosResponse = await axios.get(PackingSlipsUrl, headers);
    setPackingSlips(response.data);
  } finally {
    setFetching(false);
  }
};

export const runEMBHubAutomation = async (
  googleDriveEmail: string
): Promise<any> => {
  const headers = getAuthToken() as AuthTokenType;
  
  try {
    const response: AxiosResponse = await axios.post(EMBHubRunAutomationUrl, {
      google_drive_email: googleDriveEmail
    }, headers);
    
    return response.data;
  } catch (error: any) {
    throw error;
  }
};






