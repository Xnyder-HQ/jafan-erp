import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import discountsService from '../../services/discounts.service';
import type { Discount } from '../../services/discounts.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

interface DiscountFormData {
  discount_amount: string;
  reason: string;
}

const EditDiscount = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingDiscount, setLoadingDiscount] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [originalDiscount, setOriginalDiscount] = useState<Discount | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'sales-orders');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiscountFormData>({
    defaultValues: {
      discount_amount: '',
      reason: '',
    },
  });

  useEffect(() => {
    if (!moduleId) {
      setLoadingDiscount(false);
      return;
    }

    const fetchDiscount = async () => {
      if (!id) {
        setLoadingDiscount(false);
        return;
      }

      try {
        const response = await discountsService.getDiscount(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          const discount = response.data;
          setOriginalDiscount(discount);
          reset({
            discount_amount: discount.discount_amount.toString(),
            reason: discount.reason || '',
          });
        } else {
          setError('Discount not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to fetch discount'));
        showAlert('error-alert');
      } finally {
        setLoadingDiscount(false);
      }
    };

    fetchDiscount();
  }, [moduleId, subModuleId, id, reset]);

  const onSubmit = async (data: DiscountFormData) => {
    if (!accessIds || !id || !originalDiscount) {
      setError('Unable to update discount');
      showAlert('error-alert');
      return;
    }

    if (
      Number(data.discount_amount) === originalDiscount.discount_amount &&
      data.reason === (originalDiscount.reason || '')
    ) {
      setError('No changes detected');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const response = await discountsService.updateDiscount(
        id,
        {
          discount_amount: Number(data.discount_amount),
          reason: data.reason || undefined,
        },
        {
          module_unique_id: accessIds.module_unique_id,
          sub_module_unique_id: accessIds.sub_module_unique_id,
        }
      );

      if (response.success) {
        setSuccessMessage('Discount updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/sales/discounts');
        }, 1500);
      } else {
        setError(response.message || 'Failed to update discount');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update discount'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDiscount) {
    return (
      <div>
        <Navbar title="Edit Discount" subtitle="Update discount information" />
        <div className="xui-py-1">
          <p>Loading discount...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Discount" subtitle="Update discount information" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {originalDiscount && (
          <div
            className="xui-p-1 xui-bdr-rad-half xui-mb-1"
            style={{ backgroundColor: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}
          >
            <p className="xui-font-sz-80 xui-font-w-600 xui-mb-half">Sales Order Details:</p>
            <div className="xui-d-grid xui-grid-col-2 xui-grid-gap-half xui-font-sz-80" style={{ maxWidth: '400px' }}>
              <span className="xui-opacity-6">Reference:</span>
              <span className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                {originalDiscount.SalesOrder?.reference || 'N/A'}
              </span>
              <span className="xui-opacity-6">Customer:</span>
              <span className="xui-font-w-500">{originalDiscount.SalesOrder?.Customer?.name || 'N/A'}</span>
              <span className="xui-opacity-6">Order Total:</span>
              <span className="xui-font-w-500">{formatCurrency(originalDiscount.SalesOrder?.total_amount || 0)}</span>
              <span className="xui-opacity-6">Status:</span>
              <span>
                {originalDiscount.approved_by ? (
                  <span className="xui-badge xui-badge-success">Approved</span>
                ) : (
                  <span className="xui-badge xui-badge-warning">Pending</span>
                )}
              </span>
            </div>
          </div>
        )}

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the discount details below.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="discount_amount">Discount Amount *</label>
                <input
                  type="number"
                  id="discount_amount"
                  placeholder="Enter discount amount"
                  min="0"
                  step="0.01"
                  {...register('discount_amount', {
                    required: 'Discount amount is required',
                    min: { value: 0, message: 'Amount must be at least 0' },
                    validate: (value) => {
                      const orderTotal = originalDiscount?.SalesOrder?.total_amount;
                      if (orderTotal && Number(value) > orderTotal) {
                        return `Discount cannot exceed the order total of ${formatCurrency(orderTotal)}`;
                      }
                      return true;
                    },
                  })}
                />
                {errors.discount_amount && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.discount_amount.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="reason">Reason for Discount</label>
                <textarea
                  id="reason"
                  placeholder="Enter reason for applying this discount"
                  rows={5}
                  {...register('reason', {
                    maxLength: { value: 1000, message: 'Reason must be less than 1000 characters' },
                  })}
                />
                {errors.reason && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.reason.message}
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
            {loading ? 'Updating Discount...' : 'Update Discount'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditDiscount;
