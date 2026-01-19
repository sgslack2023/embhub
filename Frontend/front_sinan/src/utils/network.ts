//export const BaseUrl = "http://127.0.0.1:8000/api/"

export const BaseUrl="http://3.209.226.240/api/"

// Helper function to get the API base URL (with /api included)
export const getApiBaseUrl = (): string => {
  // Return the base URL with /api included (without trailing slash)
  return BaseUrl.replace(/\/$/, '');
}


export const LoginUrl = BaseUrl + "user/login"
export const MeUrl = BaseUrl + "user/Me"
export const CreateUserUrl = BaseUrl + "user/create-user"
export const UsersUrl = BaseUrl + "user/users"
export const UpdatePasswordUrl = BaseUrl + "user/update-password"
export const ForgotPasswordUrl = BaseUrl + "user/ForgotPasswordView"
export const ResetPasswordUrl = BaseUrl + "user/ResetPasswordView"

export const CreateGoogleDriveSettingsUrl = BaseUrl + "user/create-googledrive-settings"
export const GoogleDriveSettingsUrl = BaseUrl + "user/googledrive-settings"

// EMB HUB Google Drive Management
export const EMBHubAccountsUrl = BaseUrl + "masterdata/emb-hub/accounts/"
export const EMBHubFolderTreeUrl = BaseUrl + "masterdata/emb-hub/tree/"
export const EMBHubCreateFolderUrl = BaseUrl + "masterdata/emb-hub/folder/create/"
export const EMBHubDeleteFolderUrl = BaseUrl + "masterdata/emb-hub/folder/delete/"
export const EMBHubFolderContentsUrl = BaseUrl + "masterdata/emb-hub/folder/contents/"
export const EMBHubUploadFileUrl = BaseUrl + "masterdata/emb-hub/file/upload/"
export const EMBHubDeleteFileUrl = BaseUrl + "masterdata/emb-hub/file/delete/"
export const EMBHubSearchUrl = BaseUrl + "masterdata/emb-hub/search/"
export const EMBHubRunAutomationUrl = BaseUrl + "masterdata/emb-hub/run-automation/"

// Product Management
export const ProductsUrl = BaseUrl + "masterdata/products"
export const ProductTemplateUrl = ProductsUrl + "/template"
export const ProductBulkCreateUrl = ProductsUrl + "/bulk-create"

// Account Management
export const AccountsUrl = BaseUrl + "masterdata/accounts"

// Expense Management
export const ExpensesUrl = BaseUrl + "masterdata/expenses"

// Packing Slips Management
export const PackingSlipsUrl = BaseUrl + "masterdata/packing-slips"



