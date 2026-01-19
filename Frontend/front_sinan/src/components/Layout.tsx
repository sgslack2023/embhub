import {FC} from "react";
import React from "react";
import MysideBar from "./MysideBar";


interface Props {
    children: React.ReactNode;
}

const Layout:FC<Props>=({children}) => {
    return (
        <div className="layout">     
            <div className="bodyHolder">
                <MysideBar></MysideBar>
                <div className="mainContent">
                    
                    {children}
                </div>
            </div>
        </div>
    )
}
export default Layout