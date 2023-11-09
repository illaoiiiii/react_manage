import React from 'react';
import "./header.css"
import route from "@/constant/coonstant.js";
import {Avatar} from "antd";
import {UserOutlined} from "@ant-design/icons";

function Header(props) {
    return (
        <div className={"header"}>
            <div className={"container"}>
                <div className={"router"}>
                    {
                        route.map((item,index)=>{
                            return (
                                <div className={"routerName"} key={index}>{item.name}</div>
                            )
                        })
                    }
                </div>
                <Avatar size={48} icon={<UserOutlined />} />
            </div>

        </div>
    );
}

export default Header;
