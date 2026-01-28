import { Outlet } from 'react-router';

const AuthWrapper = () => {
  return (
    <section className="xui-min-h-[100vh] xui-d-flex xui-flex-ai-center xui-flex-jc-center">
      <Outlet />
    </section>
  );
};

export default AuthWrapper;
