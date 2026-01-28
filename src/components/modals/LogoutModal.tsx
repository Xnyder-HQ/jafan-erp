import { Close } from '@carbon/icons-react';
import { modalHide } from '@richaadgigi/stylexui';
import { useNavigate } from 'react-router';
import { useGeneral } from '../../context/GeneralContext';

const LogoutModal = () => {
  const navigate = useNavigate();
  const { logout } = useGeneral();

  const handleLogout = () => {
    logout();
    modalHide('logout-modal');
    navigate('/login');
  };

  const closeModal = () => {
    modalHide('logout-modal');
  };

  return (
    <section className="xui-modal" xui-modal="logout-modal">
      <div className="xui-modal-content xui-max-w-[400px] xui-bdr-rad-[8px]">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
          <h3 className="xui-font-sz-[18px]">Log Out</h3>
          <div
            className="xui-bg-light xui-w-40 xui-h-40 xui-bdr-rad-[8px] xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
            onClick={closeModal}
          >
            <Close />
          </div>
        </div>
        <hr className="xui-my-1" />
        <p className="xui-font-sz-[14px] xui-opacity-8">
          Are you sure you want to log out of your account?
        </p>
        <div className="xui-d-grid xui-grid-gap-1 xui-grid-col-1 xui-lg-grid-col-2 xui-mt-2">
          <button
            className="xui-btn xui-btn-block xui-bdr-w-1 xui-bdr-s-solid xui-bdr-fade xui-bg-light xui-bdr-rad-[8px]"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="xui-btn xui-btn-block xui-btn-danger xui-bdr-rad-[8px]"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </section>
  );
};

export default LogoutModal;
