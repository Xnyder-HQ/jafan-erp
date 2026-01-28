import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import vendorsService from '../../services/vendors.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface VendorFormData {
  type: string;
  name: string;
  contact_person: string;
  email: string;
  phone_number: string;
  alt_phone_number: string;
  address: string;
  total_spend: string;
}

const AddVendor = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('procurement-vendor-management', 'vendors');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormData>({
    defaultValues: {
      type: '',
      name: '',
      contact_person: '',
      email: '',
      phone_number: '',
      alt_phone_number: '',
      address: '',
      total_spend: '',
    },
  });

  const onSubmit = async (data: VendorFormData) => {
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
        contact_person: data.contact_person || undefined,
        email: data.email || undefined,
        phone_number: data.phone_number || undefined,
        alt_phone_number: data.alt_phone_number || undefined,
        address: data.address || undefined,
        total_spend: data.total_spend ? Number(data.total_spend) : undefined,
      };

      const response = await vendorsService.addVendor(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('Vendor added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/procurement/vendors');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add vendor');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add vendor'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const vendorTypes = [
    { value: 'Supplier', label: 'Supplier' },
    { value: 'Manufacturer', label: 'Manufacturer' },
    { value: 'Distributor', label: 'Distributor' },
    { value: 'Wholesaler', label: 'Wholesaler' },
    { value: 'Service Provider', label: 'Service Provider' },
    { value: 'Contractor', label: 'Contractor' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div>
      <Navbar title="Add Vendor" subtitle="Create a new vendor record" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the vendor details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="name">Vendor Name *</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter vendor name"
                  {...register('name', {
                    required: 'Vendor name is required',
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
                <label htmlFor="type">Vendor Type *</label>
                <select
                  id="type"
                  {...register('type', {
                    required: 'Vendor type is required',
                  })}
                >
                  <option value="" disabled>--Select vendor type--</option>
                  {vendorTypes.map((type) => (
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
                <label htmlFor="contact_person">Contact Person</label>
                <input
                  type="text"
                  id="contact_person"
                  placeholder="Enter contact person name"
                  {...register('contact_person', {
                    maxLength: { value: 200, message: 'Contact person must be less than 200 characters' },
                  })}
                />
                {errors.contact_person && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.contact_person.message}
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
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="alt_phone_number">Alternative Phone</label>
                <input
                  type="tel"
                  id="alt_phone_number"
                  placeholder="Enter alternative phone number"
                  {...register('alt_phone_number')}
                />
              </div>

              <div className="xui-form-box">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  placeholder="Enter vendor address"
                  rows={4}
                  {...register('address', {
                    maxLength: { value: 500, message: 'Address must be less than 500 characters' },
                  })}
                />
                {errors.address && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.address.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="total_spend">Opening Balance (Total Spend)</label>
                <input
                  type="number"
                  id="total_spend"
                  placeholder="Enter opening balance (optional)"
                  min="0"
                  step="0.01"
                  {...register('total_spend', {
                    min: { value: 0, message: 'Total spend must be at least 0' },
                  })}
                />
                {errors.total_spend && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.total_spend.message}
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
            {loading ? 'Saving Vendor...' : 'Save Vendor'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddVendor;
