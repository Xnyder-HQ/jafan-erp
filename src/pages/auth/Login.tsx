import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { View, ViewOff } from '@carbon/icons-react';
import { APP_NAME, COMPANY_NAME } from '../../Globals';
import { useGeneral } from '../../context/GeneralContext';
import authService from '../../services/auth.service';
import { Alert, showAlert } from '../../components/common';

interface LoginFormData {
  email: string;
  password: string;
  remember_me: boolean;
}

const Login = () => {
  const navigate = useNavigate();
  const { login } = useGeneral();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      remember_me: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
        remember_me: data.remember_me,
      });

      if (response.success && response.data) {
        const { token, fullname, acls } = response.data;
        setSuccessMessage('Login successful! Redirecting...');
        showAlert('success-alert');
        setTimeout(() => {
          login(token, { fullname }, acls, data.remember_me);
          navigate('/dashboard');
        }, 1500);
      } else {
        setErrorMessage(response.message || 'Login failed. Please try again.');
        showAlert('error-alert');
        setIsLoading(false);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'An error occurred. Please try again.';
      setErrorMessage(message);
      showAlert('error-alert');
      setIsLoading(false);
    }
  };

  return (
    <div className="xui-max-w-[360px] xui-w-fluid-100 xui-mx-auto">
      <div
        className="xui-w-64 xui-h-64 xui-bdr-rad-half xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center"
        style={{ backgroundColor: 'var(--primary-600)' }}
      >
        <span
          className="xui-font-sz-200 xui-font-w-bold"
          style={{ color: 'var(--secondary-700)' }}
        >
          JB
        </span>
      </div>
      <div className="xui-mt-2 xui-md-mt-4">
        <h1 className="xui-font-sz-[28px]">Sign In</h1>
        <p className="xui-font-sz-[14px] xui-mt-1">
          <span className="xui-opacity-4">Welcome to {APP_NAME}</span>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form xui-mt-1">
          <div className="xui-form-box">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <span className="xui-font-sz-80 xui-text-red">{errors.email.message}</span>
            )}
          </div>

          <div className="xui-form-box">
            <label htmlFor="password">Password</label>
            <div className="xui-pos-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                style={{ paddingRight: '40px' }}
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                className="xui-pos-absolute xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
                style={{
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--neutral-400)',
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <ViewOff size={20} /> : <View size={20} />}
              </button>
            </div>
            {errors.password && (
              <span className="xui-font-sz-80 xui-text-red">{errors.password.message}</span>
            )}
          </div>

          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
            <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half xui-cursor-pointer xui-font-sz-[12px]">
              <input
                type="checkbox"
                {...register('remember_me')}
                className="xui-cursor-pointer"
              />
              <span className="xui-opacity-6">Remember me</span>
            </label>
            <Link to="/forgot-password" className="xui-text-blue xui-font-sz-[12px]">
              Forgot Password?
            </Link>
          </div>

          <div className="xui-form-box">
            <button
              type="submit"
              className="xui-btn xui-btn-block xui-btn-blue xui-bdr-rad-[8px] xui-font-sz-[13px] xui-py-[16px]"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        <p className="xui-text-center xui-font-sz-80 xui-mt-2 xui-opacity-4">
          {COMPANY_NAME} &bull; v1.0
        </p>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={errorMessage} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default Login;
