import  {AxiosError} from 'axios'

export interface DataProps{
    [key: string]:string|boolean|number|null|React.ReactElement|((text: string) => React.ReactNode)| undefined;
    
 
}

export interface CustomAxiosError extends Omit<AxiosError,'response'>{
    response? :{
        data:{
            error:string
        } 
    }
}

export interface AuthTokenType{
    headers:{
        Authorization:string}
}

export interface UserType{
    email:string
    fullname:string
    id:number
    created_at:string
    role:string
    last_login:string
    
}

export interface AuthProps{
    errorCallBack?:()=>void,
    successCallBack?:()=>void,
}


export interface StoreProps{
    user:UserType | null,
    updatePasswordUserId:number|null
}

export enum ActionTypes{
    UPDATE_USER_INFO ="[action] update user info",
    UPDATE_PASSWORD_USER_ID ="[action] update password id"
}

export type ActionProps={
    type: ActionTypes.UPDATE_USER_INFO,
    payload:UserType | null
}| {
    type: ActionTypes.UPDATE_PASSWORD_USER_ID,
    payload:number | null
}

export interface StoreProviderProps{
    state:StoreProps,
    dispatch:(arg:ActionProps)=>void
}




export interface UserProps{
    created_at:string
    email:string
    fullname:string
    is_active:string
    last_login:string
    role:string
    key?:number
    id:number
  
  }
  

 
  export interface AddUserFormModalProps{
    isVisible?:boolean
    onSuccessCallBack:()=>void
    onClose: () =>void
    editingUser?: UserProps | null;
    onCloseWithoutEditing:()=>void

}
  
export interface GoogleDriveSettingsProps{
    id: number
    email: string
    service_account_json: string
    service_account_filename?: string
    shared_drive_name: string
    root_folder_name: string
    track123_api_key?: string
    created_by: number
    created_by_name: string
    created_at: string
    updated_at: string
    is_active: boolean
    key?: number
}

export interface AddGoogleDriveFormModalProps{
    isVisible?: boolean
    onSuccessCallBack: () => void
    onClose: () => void
    editingSettings?: GoogleDriveSettingsProps | null;
    onCloseWithoutEditing: () => void
}

export interface ProductProps{
    id: number
    name: string
    code: string
    image?: string
    sku_description: string
    sku_uom: string
    sku_buy_cost: string
    sku_price: string
    color: string
    created_at: string
    updated_at: string
    key?: number
}

export interface AddProductFormModalProps{
    isVisible?: boolean
    onSuccessCallBack: () => void
    onClose: () => void
    editingProduct?: ProductProps | null;
    onCloseWithoutEditing: () => void
}

export interface FileProps{
    id: number
    packing_slip: number
    file_type: string
    file_path: string
    page_number?: number
    created_at: string
}

export interface PackingSlipProps{
    id: number
    ship_to: string
    order_id: string
    asin: string
    product?: number  // Product ID (write-only field, might not always be present in response)
    product_code: string
    product_name: string
    customizations: string
    quantity: number
    folder_path: string
    status: string
    shipping_labels: FileProps[]
    dst_files: FileProps[]
    dgt_files: FileProps[]
    // New financial fields
    sales_price: string
    shipping_price: string
    item_cost: string
    shipping_cost: string
    platform_fee_percent: string
    platform_fee_calculated: string
    profit: string
    tracking_ids: string
    // New tracking fields
    tracking_vendor: string
    tracking_status: string
    created_at: string
    updated_at: string
    key?: number
}

export interface AccountProps{
    id: number
    account_name: string
    active: boolean
    created_at: string
    updated_at: string
    key?: number
}

export interface AddAccountFormModalProps{
    isVisible?: boolean
    onSuccessCallBack: () => void
    onClose: () => void
    editingAccount?: AccountProps | null;
    onCloseWithoutEditing: () => void
}

export interface ExpenseProps{
    id: number
    account: number
    account_name: string
    expense_type: string
    expense_type_display: string
    date: string
    amount: string
    description: string
    created_at: string
    updated_at: string
    key?: number
}

// EMB HUB Types
export interface DriveAccount {
  id: number;  // GoogleDriveSettings record ID
  email: string;
  created_by__fullname: string;
}

export interface DriveFolder {
    id: string
    name: string
    createdTime?: string
    modifiedTime?: string
    parents?: string[]
    type: 'folder'
    children?: DriveFolder[]
    files?: DriveFile[]
}

export interface DriveFile {
    id: string
    name: string
    size?: string
    mimeType?: string
    createdTime?: string
    modifiedTime?: string
    webViewLink?: string
    type?: 'file'
}

export interface FolderPath {
    id: string
    name: string
}

export interface EMBHubState {
    selectedAccount: string | null
    currentFolderId: string | null
    folderTree: DriveFolder | null
    currentPath: FolderPath[]
    folders: DriveFolder[]
    files: DriveFile[]
    loading: boolean
    searchQuery: string
    searchResults: DriveFile[]
}
 



