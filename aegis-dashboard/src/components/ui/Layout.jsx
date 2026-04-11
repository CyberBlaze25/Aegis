import React from 'react';
import Sidebar from '../Sidebar';
import TopBar from '../TopBar';
import "../../styles/global.css";

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
