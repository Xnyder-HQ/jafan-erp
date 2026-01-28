import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft, View } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import vendorsService from '../../services/vendors.service';
import purchaseOrdersService, { type PurchaseOrder } from '../../services/purchaseOrders.service';
import type { Vendor } from '../../services/vendors.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage, formatCurrency, formatDate } from '../../utils/formatters';

interface VendorFormData {
  name: string;
  contact_person: string;
  email: string;
  phone_number: string;
  alt_phone_number: string;
  address: string;
}

const EditVendor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingVendor, setLoadingVendor] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [originalVendor, setOriginalVendor] = useState<Vendor | null>(null);
  const [relatedPOs, setRelatedPOs] = useState<PurchaseOrder[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);

  const accessIds = getAccessIds('procurement-vendor-management', 'vendors');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const poAccessIds = getAccessIds('procurement-vendor-management', 'purchase-orders');
  const poModuleId = poAccessIds?.module_unique_id;
  const poSubModuleId = poAccessIds?.sub_module_unique_id;

  const fetchRelatedPOs = useCallback(async (vendorUniqueId: string) => {
    if (!poModuleId || !poSubModuleId) return;

    setLoadingPOs(true);
    try {
      const response = await purchaseOrdersService.getPurchaseOrders({
        page: 1,
        size: 10,
        module_unique_id: poModuleId,
        sub_module_unique_id: poSubModuleId,
        vendor_unique_id: vendorUniqueId,
      });

      if (response.success && response.data) {
        const orders = Array.isArray(response.data) ? response.data : response.data.rows || [];
        setRelatedPOs(orders);
      }
    } catch (err) {
      console.error('Failed to fetch related purchase orders:', err);
    } finally {
      setLoadingPOs(false);
    }
  }, [poModuleId, poSubModuleId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormData>({
    defaultValues: {
      name: '',
      contact_person: '',
      email: '',
      phone_number: '',
      alt_phone_number: '',
      address: '',
    },
  });

  useEffect(() => {
    if (!moduleId) {
      setLoadingVendor(false);
      return;
    }

    const fetchVendor = async () => {
      if (!id) {
        setLoadingVendor(false);
        return;
      }

      try {
        const response = await vendorsService.getVendor(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          const vendor = response.data;
          setOriginalVendor(vendor);
          reset({
            name: vendor.name,
            contact_person: vendor.contact_person || '',
            email: vendor.email || '',
            phone_number: vendor.phone_number || '',
            alt_phone_number: vendor.alt_phone_number || '',
            address: vendor.address || '',
          });
          if (vendor.unique_id) {
            fetchRelatedPOs(vendor.unique_id);
          }
        } else {
          setError('Vendor not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to fetch vendor'));
        showAlert('error-alert');
      } finally {
        setLoadingVendor(false);
      }
    };

    fetchVendor();
  }, [moduleId, subModuleId, id, reset, fetchRelatedPOs]);

  const onSubmit = async (data: VendorFormData) => {
    if (!accessIds || !id || !originalVendor) {
      setError('Unable to update vendor');
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
        data.name !== originalVendor.name ||
        data.contact_person !== (originalVendor.contact_person || '') ||
        data.email !== (originalVendor.email || '') ||
        data.phone_number !== (originalVendor.phone_number || '') ||
        data.alt_phone_number !== (originalVendor.alt_phone_number || '')
      ) {
        updatePromises.push(
          vendorsService.updateVendorDetails(
            id,
            {
              name: data.name,
              contact_person: data.contact_person || undefined,
              email: data.email || undefined,
              phone_number: data.phone_number || undefined,
              alt_phone_number: data.alt_phone_number || undefined,
            },
            params
          )
        );
      }

      if (data.address !== (originalVendor.address || '')) {
        updatePromises.push(
          vendorsService.updateVendorAddress(
            id,
            {
              address: data.address || undefined,
            },
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
        throw firstRejected?.reason || new Error('Failed to update vendor');
      }
      const results = settled
        .filter((r): r is PromiseFulfilledResult<{ success: boolean; message: string }> => r.status === 'fulfilled')
        .map(r => r.value);
      const failedUpdate = results.find((r) => !r.success);

      if (failedUpdate) {
        setError(failedUpdate.message || 'Failed to update some fields');
        showAlert('error-alert');
      } else {
        setSuccessMessage('Vendor updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/procurement/vendors');
        }, 1500);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update vendor'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingVendor) {
    return (
      <div>
        <Navbar title="Edit Vendor" subtitle="Update vendor information" />
        <div className="xui-py-1">
          <p>Loading vendor...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Vendor" subtitle="Update vendor information" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {originalVendor && (
          <div className="xui-mb-1">
            <span className="xui-badge xui-badge-blue xui-mr-half">{originalVendor.type}</span>
            <span className="xui-font-sz-80 xui-opacity-6">Reference: {originalVendor.reference}</span>
          </div>
        )}

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the vendor details below.</p>
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
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  placeholder="Enter vendor address"
                  rows={6}
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
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Updating Vendor...' : 'Update Vendor'}
          </button>
        </form>

        <div className="xui-bg-white xui-bdr-rad-half xui-mt-2 xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-p-1 xui-d-flex xui-flex-ai-center xui-flex-jc-space-between" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
            <div>
              <p className="xui-font-sz-90 xui-font-w-bold">Vendor Purchase Orders</p>
              <p className="xui-font-sz-75 xui-opacity-6">Recent purchase orders for this vendor</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/procurement/orders/add')}
              className="xui-btn xui-font-sz-80 xui-bdr-rad-half"
              style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
            >
              + New PO
            </button>
          </div>
          <div className="xui-table-responsive">
            {loadingPOs ? (
              <div className="xui-py-2 xui-text-center">
                <p className="xui-opacity-6">Loading purchase orders...</p>
              </div>
            ) : relatedPOs.length === 0 ? (
              <div className="xui-py-2 xui-text-center">
                <p className="xui-opacity-6">No purchase orders found for this vendor.</p>
              </div>
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {relatedPOs.map((po) => (
                    <tr key={po.unique_id}>
                      <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>{po.reference}</td>
                      <td className="xui-text-capitalize">{po.po_type}</td>
                      <td className="xui-font-w-500">{formatCurrency(po.total_amount)}</td>
                      <td>
                        <span className={`xui-badge xui-badge-${po.order_status?.toLowerCase() === 'completed' ? 'success' : po.order_status?.toLowerCase() === 'pending' ? 'warning' : 'info'}`}>
                          {po.order_status}
                        </span>
                      </td>
                      <td className="xui-font-sz-90 xui-opacity-7">{formatDate(po.order_date)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/procurement/orders/edit/${po.unique_id}`)}
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

export default EditVendor;
