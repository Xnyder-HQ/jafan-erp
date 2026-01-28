import { Outlet } from 'react-router';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { LogoutModal } from '../modals';

const DashboardWrapper = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="xui-dashboard xui-d-flex xui-pos-relative">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="screen">
        <div className="content xui-px-1-half">
          <Outlet />
        </div>
      </div>

      <LogoutModal />
    </section>
  );
};

export default DashboardWrapper;
