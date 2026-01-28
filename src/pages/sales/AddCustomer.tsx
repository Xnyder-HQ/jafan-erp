import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import customersService from '../../services/customers.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface CustomerFormData {
  type: string;
  name: string;
  email: string;
  phone_number: string;
  alt_phone_number: string;
  billing_address: string;
  other_address: string;
  balance: string;
}

const AddCustomer = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('sales-customer-management', 'customers');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    defaultValues: {
      type: '',
      name: '',
      email: '',
      phone_number: '',
      alt_phone_number: '',
      billing_address: '',
      other_address: '',
      balance: '',
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    if (!accessIds) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: data.type,
        name: data.name,
        email: data.email || undefined,
        phone_number: data.phone_number || undefined,
        alt_phone_number: data.alt_phone_number || undefined,
        billing_address: data.billing_address || undefined,
        other_address: data.other_address || undefined,
        balance: data.balance ? Number(data.balance) : undefined,
      };

      const response = await customersService.addCustomer(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('Customer added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/sales/customers');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add customer');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add customer'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const customerTypes = [
    { value: 'Individual', label: 'Individual' },
    { value: 'Company', label: 'Company' },
    { value: 'Contractor', label: 'Contractor' },
    { value: 'Developer', label: 'Developer' },
    { value: 'Engineer', label: 'Engineer' },
    { value: 'Government', label: 'Government' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div>
      <Navbar title="Add Customer" subtitle="Create a new customer record" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the customer details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="name">Customer Name *</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter customer name"
                  {...register('name', {
                    required: 'Customer name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    maxLength: { value: 200, message: 'Name must be less than 200 characters' },
                  })}
                />
                {errors.name && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="type">Customer Type *</label>
                <select
                  id="type"
                  {...register('type', {
                    required: 'Customer type is required',
                  })}
                >
                  <option value="" disabled>--Select customer type--</option>
                  {customerTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.type.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter email address"
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="phone_number">Phone Number</label>
                <input
                  type="tel"
                  id="phone_number"
                  placeholder="Enter phone number"
                  {...register('phone_number')}
                />
                {errors.phone_number && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.phone_number.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="alt_phone_number">Alternative Phone</label>
                <input
                  type="tel"
                  id="alt_phone_number"
                  placeholder="Enter alternative phone number"
                  {...register('alt_phone_number')}
                />
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="billing_address">Billing Address</label>
                <textarea
                  id="billing_address"
                  placeholder="Enter billing address"
                  rows={3}
                  {...register('billing_address', {
                    maxLength: { value: 300, message: 'Address must be less than 300 characters' },
                  })}
                />
                {errors.billing_address && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.billing_address.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="other_address">Delivery/Other Address</label>
                <textarea
                  id="other_address"
                  placeholder="Enter delivery or other address"
                  rows={3}
                  {...register('other_address', {
                    maxLength: { value: 300, message: 'Address must be less than 300 characters' },
                  })}
                />
                {errors.other_address && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.other_address.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="balance">Opening Balance</label>
                <input
                  type="number"
                  id="balance"
                  placeholder="Enter opening balance (optional)"
                  min="0"
                  step="0.01"
                  {...register('balance', {
                    min: { value: 0, message: 'Balance must be at least 0' },
                  })}
                />
                {errors.balance && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.balance.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Saving Customer...' : 'Save Customer'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddCustomer;
