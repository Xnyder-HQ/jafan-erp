import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import usersService from '../../services/users.service';
import type { RoleOption } from '../../services/users.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface UserFormData {
  firstname: string;
  middlename: string;
  lastname: string;
  email: string;
  phone_number: string;
  alt_phone_number: string;
  gender: string;
  date_of_birth: string;
  address: string;
  country: string;
  state: string;
  city: string;
  profile_image: string;
  role_unique_id: string;
}

const AddUser = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const accessIds = getAccessIds('administration', 'users');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      firstname: '',
      middlename: '',
      lastname: '',
      email: '',
      phone_number: '',
      alt_phone_number: '',
      gender: '',
      date_of_birth: '',
      address: '',
      country: '',
      state: '',
      city: '',
      profile_image: '',
      role_unique_id: '',
    },
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await usersService.getRoles();
        if (response.success && response.data) {
          const rows = Array.isArray(response.data) ? response.data : response.data.rows;
          setRoles(rows || []);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const onSubmit = async (data: UserFormData) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        gender: data.gender,
        profile_image: data.profile_image,
        ...(data.middlename && { middlename: data.middlename }),
        ...(data.phone_number && { phone_number: data.phone_number }),
        ...(data.alt_phone_number && { alt_phone_number: data.alt_phone_number }),
        ...(data.date_of_birth && { date_of_birth: data.date_of_birth }),
        ...(data.address && { address: data.address }),
        ...(data.country && { country: data.country }),
        ...(data.state && { state: data.state }),
        ...(data.city && { city: data.city }),
        ...(data.role_unique_id && { role_unique_id: data.role_unique_id }),
      };

      const response = await usersService.addUser(payload, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success) {
        setSuccessMessage(response.message || 'User created successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/users');
        }, 1500);
      } else {
        setError(response.message || 'Failed to create user');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to create user'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRoles) {
    return (
      <div>
        <Navbar title="Add User" subtitle="Create a new user account" />
        <div className="xui-py-1">
          <p>Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Add User" subtitle="Create a new user account" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the user details below. Fields marked with * are required. A password will be auto-generated for the user.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="firstname">First Name *</label>
                <input
                  type="text"
                  id="firstname"
                  placeholder="Enter first name"
                  {...register('firstname', {
                    required: 'First name is required',
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.firstname && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.firstname.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="middlename">Middle Name</label>
                <input
                  type="text"
                  id="middlename"
                  placeholder="Enter middle name"
                  {...register('middlename')}
                />
              </div>

              <div className="xui-form-box">
                <label htmlFor="lastname">Last Name *</label>
                <input
                  type="text"
                  id="lastname"
                  placeholder="Enter last name"
                  {...register('lastname', {
                    required: 'Last name is required',
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.lastname && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.lastname.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter email address"
                  {...register('email', { required: 'Email is required' })}
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
              </div>

              <div className="xui-form-box">
                <label htmlFor="alt_phone_number">Alt Phone Number</label>
                <input
                  type="tel"
                  id="alt_phone_number"
                  placeholder="Enter alternative phone number"
                  {...register('alt_phone_number')}
                />
              </div>

              <div className="xui-form-box">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  {...register('gender', { required: 'Gender is required' })}
                >
                  <option value="">--Select gender--</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.gender.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input
                  type="date"
                  id="date_of_birth"
                  {...register('date_of_birth')}
                />
              </div>

              <div className="xui-form-box">
                <label htmlFor="role_unique_id">Role</label>
                <select
                  id="role_unique_id"
                  {...register('role_unique_id')}
                >
                  <option value="">--Select role (optional)--</option>
                  {roles.map((role) => (
                    <option key={role.unique_id} value={role.unique_id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xui-form-box">
                <label htmlFor="profile_image">Profile Image URL *</label>
                <input
                  type="url"
                  id="profile_image"
                  placeholder="Enter profile image URL"
                  {...register('profile_image', { required: 'Profile image URL is required' })}
                />
                {errors.profile_image && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.profile_image.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  placeholder="Enter address"
                  {...register('address', {
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 300, message: 'Maximum 300 characters' },
                  })}
                />
                {errors.address && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.address.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  placeholder="Enter country"
                  {...register('country', {
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.country && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.country.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  placeholder="Enter state"
                  {...register('state', {
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.state && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.state.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  placeholder="Enter city"
                  {...register('city', {
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.city && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.city.message}
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
            {loading ? 'Creating User...' : 'Create User'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddUser;
