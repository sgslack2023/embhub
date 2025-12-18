import { BrowserRouter, Route, Routes  } from 'react-router-dom';
import Login from "./pages/Login"
import CheckUser from "./pages/CheckUser"
import Home from "./pages/Home"
import AuthRoute from './components/AuthRoute';
import User from './pages/User';
import Product from './pages/Product';
import Account from './pages/Account';
import Expense from './pages/Expense';
import PackingSlips from './pages/PackingSlips';
import UpdateUserPassword from './pages/UpdateUserPassword';
import ResetPassword from './pages/ResetPassword';
import ForgetPassword from './pages/ForgotPassword';
import GoogleDriveSettings from './pages/GoogleDriveSettings';
import EMBHub from './pages/EMBHub';


function Router() {
  return (
  <BrowserRouter>
      <Routes>
      
      <Route path="/Login"  element={<Login/>}/>
      <Route path="/check-user"  element={<CheckUser/>}/>
      <Route path="/create-password"  element={<UpdateUserPassword/>}/>
      <Route path="/forgotpassword" element={<ForgetPassword/>}/>
      <Route path="/resetpassword" element={<ResetPassword/>}/>


      <Route path="/" element={<AuthRoute><Home/></AuthRoute>}/>
      <Route path="/users" element={<AuthRoute><User/></AuthRoute>}/>
      <Route path="/products" element={<AuthRoute><Product/></AuthRoute>}/>
      <Route path="/accounts" element={<AuthRoute><Account/></AuthRoute>}/>
      <Route path="/expenses" element={<AuthRoute><Expense/></AuthRoute>}/>
      <Route path="/packing-slips" element={<AuthRoute><PackingSlips/></AuthRoute>}/>
      <Route path="/googledrive-settings" element={<AuthRoute><GoogleDriveSettings/></AuthRoute>}/>
      <Route path="/emb-hub" element={<AuthRoute><EMBHub/></AuthRoute>}/>

   
   

      </Routes>
  </BrowserRouter>
  )
}
export default Router