import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { COMPANY_NAME } from '../../Globals';
import authService from '../../services/auth.service';
import { Alert, showAlert } from '../../components/common';

interface ForgotPasswordFormData {
  login_id: string;
}

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await authService.passwordRecovery({
        login_id: data.login_id,
      });

      if (response.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(response.message || 'Password recovery failed. Please try again.');
        showAlert('error-alert');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'An error occurred. Please try again.';
      setErrorMessage(message);
      showAlert('error-alert');
    } finally {
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
        <h1 className="xui-font-sz-[28px]">Forgot Password</h1>
        <p className="xui-font-sz-[14px] xui-mt-1">
          <span className="xui-opacity-4">Remember your account?</span>{' '}
          <Link to="/login" className="xui-font-w-700 xui-text-blue">
            Back to sign in
          </Link>
        </p>

        {submitted ? (
          <div
            className="xui-p-1 xui-bdr-rad-half xui-mt-1"
            style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}
          >
            <p className="xui-font-sz-85">
              A new password has been sent to your registered email address.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="xui-form xui-mt-1">
            <div className="xui-form-box">
              <label htmlFor="login_id">Username / Email / Phone</label>
              <input
                type="text"
                id="login_id"
                {...register('login_id', { required: 'Username, email or phone is required' })}
              />
              {errors.login_id && (
                <span className="xui-font-sz-80 xui-text-red">{errors.login_id.message}</span>
              )}
            </div>

            <div className="xui-form-box">
              <button
                type="submit"
                className="xui-btn xui-btn-block xui-btn-blue xui-bdr-rad-[8px] xui-font-sz-[13px] xui-py-[16px]"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}

        <p className="xui-text-center xui-font-sz-80 xui-mt-2 xui-opacity-4">
          {COMPANY_NAME} &bull; v1.0
        </p>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={errorMessage} />
    </div>
  );
};

export default ForgotPassword;
