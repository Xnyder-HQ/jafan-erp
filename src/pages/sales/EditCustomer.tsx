import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft, View } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import customersService from '../../services/customers.service';
import salesOrdersService, { type SalesOrder } from '../../services/salesOrders.service';
import type { Customer } from '../../services/customers.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage, formatCurrency, formatDate } from '../../utils/formatters';

interface CustomerFormData {
  name: string;
  email: string;
  phone_number: string;
  alt_phone_number: string;
  billing_address: string;
  other_address: string;
  balance: string;
}

const EditCustomer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [originalCustomer, setOriginalCustomer] = useState<Customer | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<SalesOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const accessIds = getAccessIds('sales-customer-management', 'customers');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const orderAccessIds = getAccessIds('sales-customer-management', 'sales-orders');
  const orderModuleId = orderAccessIds?.module_unique_id;
  const orderSubModuleId = orderAccessIds?.sub_module_unique_id;

  const fetchRelatedOrders = useCallback(async (customerUniqueId: string) => {
    if (!orderModuleId || !orderSubModuleId) return;

    setLoadingOrders(true);
    try {
      const response = await salesOrdersService.getSalesOrders({
        page: 1,
        size: 10,
        module_unique_id: orderModuleId,
        sub_module_unique_id: orderSubModuleId,
        customer_unique_id: customerUniqueId,
      });

      if (response.success && response.data) {
        const orders = Array.isArray(response.data) ? response.data : response.data.rows || [];
        setRelatedOrders(orders);
      }
    } catch (err) {
      console.error('Failed to fetch related orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [orderModuleId, orderSubModuleId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      alt_phone_number: '',
      billing_address: '',
      other_address: '',
      balance: '',
    },
  });

  useEffect(() => {
    if (!moduleId) {
      setLoadingCustomer(false);
      return;
    }

    const fetchCustomer = async () => {
      if (!id) {
        setLoadingCustomer(false);
        return;
      }

      try {
        const response = await customersService.getCustomer(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          const customer = response.data;
          setOriginalCustomer(customer);
          reset({
            name: customer.name,
            email: customer.email || '',
            phone_number: customer.phone_number || '',
            alt_phone_number: customer.alt_phone_number || '',
            billing_address: customer.billing_address || '',
            other_address: customer.other_address || '',
            balance: customer.balance.toString(),
          });
          if (customer.unique_id) {
            fetchRelatedOrders(customer.unique_id);
          }
        } else {
          setError('Customer not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to fetch customer'));
        showAlert('error-alert');
      } finally {
        setLoadingCustomer(false);
      }
    };

    fetchCustomer();
  }, [moduleId, subModuleId, id, reset, fetchRelatedOrders]);

  const onSubmit = async (data: CustomerFormData) => {
    if (!accessIds || !id || !originalCustomer) {
      setError('Unable to update customer');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const params = {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      };

      const updatePromises: Promise<{ success: boolean; message: string }>[] = [];

      if (
        data.name !== originalCustomer.name ||
        data.email !== (originalCustomer.email || '') ||
        data.phone_number !== (originalCustomer.phone_number || '') ||
        data.alt_phone_number !== (originalCustomer.alt_phone_number || '')
      ) {
        updatePromises.push(
          customersService.updateCustomerDetails(
            id,
            {
              name: data.name,
              email: data.email || undefined,
              phone_number: data.phone_number || undefined,
              alt_phone_number: data.alt_phone_number || undefined,
            },
            params
          )
        );
      }

      if (
        data.billing_address !== (originalCustomer.billing_address || '') ||
        data.other_address !== (originalCustomer.other_address || '')
      ) {
        updatePromises.push(
          customersService.updateCustomerAddress(
            id,
            {
              billing_address: data.billing_address || undefined,
              other_address: data.other_address || undefined,
            },
            params
          )
        );
      }

      if (Number(data.balance) !== originalCustomer.balance) {
        updatePromises.push(
          customersService.updateCustomerBalance(
            id,
            { balance: Number(data.balance) },
            params
          )
        );
      }

      if (updatePromises.length === 0) {
        setError('No changes detected');
        showAlert('error-alert');
        setLoading(false);
        return;
      }

      const settled = await Promise.allSettled(updatePromises);
      if (settled.every(r => r.status === 'rejected')) {
        const firstRejected = settled.find((r): r is PromiseRejectedResult => r.status === 'rejected');
        throw firstRejected?.reason || new Error('Failed to update customer');
      }
      const results = settled
        .filter((r): r is PromiseFulfilledResult<{ success: boolean; message: string }> => r.status === 'fulfilled')
        .map(r => r.value);
      const failedUpdate = results.find((r) => !r.success);

      if (failedUpdate) {
        setError(failedUpdate.message || 'Failed to update some fields');
        showAlert('error-alert');
      } else {
        setSuccessMessage('Customer updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/sales/customers');
        }, 1500);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update customer'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCustomer) {
    return (
      <div>
        <Navbar title="Edit Customer" subtitle="Update customer information" />
        <div className="xui-py-1">
          <p>Loading customer...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Customer" subtitle="Update customer information" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {originalCustomer && (
          <div className="xui-mb-1">
            <span className="xui-badge xui-badge-blue xui-mr-half">{originalCustomer.type}</span>
            <span className="xui-font-sz-80 xui-opacity-6">Reference: {originalCustomer.reference}</span>
          </div>
        )}

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the customer details below.</p>
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
                <label htmlFor="balance">Account Balance</label>
                <input
                  type="number"
                  id="balance"
                  placeholder="Enter account balance"
                  min="0"
                  step="0.01"
                  {...register('balance', {
                    required: 'Balance is required',
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
            {loading ? 'Updating Customer...' : 'Update Customer'}
          </button>
        </form>
        <div className="xui-bg-white xui-bdr-rad-half xui-mt-2 xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-p-1 xui-d-flex xui-flex-ai-center xui-flex-jc-space-between" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
            <div>
              <p className="xui-font-sz-90 xui-font-w-bold">Customer Orders</p>
              <p className="xui-font-sz-75 xui-opacity-6">Recent sales orders for this customer</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/sales/orders/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              + New Order
            </button>
          </div>
          <div className="xui-table-responsive">
            {loadingOrders ? (
              <div className="xui-py-2 xui-text-center">
                <p className="xui-opacity-6">Loading orders...</p>
              </div>
            ) : relatedOrders.length === 0 ? (
              <div className="xui-py-2 xui-text-center">
                <p className="xui-opacity-6">No orders found for this customer.</p>
              </div>
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {relatedOrders.map((order) => (
                    <tr key={order.unique_id}>
                      <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>{order.reference}</td>
                      <td className="xui-font-w-500">{formatCurrency(order.amount_payable)}</td>
                      <td>
                        <span className={`xui-badge xui-badge-${order.order_status?.toLowerCase() === 'completed' ? 'success' : order.order_status?.toLowerCase() === 'pending' ? 'warning' : 'info'}`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="xui-font-sz-90 xui-opacity-7">{formatDate(order.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/sales/orders/edit/${order.unique_id}`)}
                          className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                          style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                          title="View Order"
                        >
                          <View size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditCustomer;
