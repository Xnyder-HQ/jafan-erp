import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import invoicesService, { type Invoice } from '../../services/invoices.service';
import { Alert, showAlert, ErrorState } from '../../components/common';

interface EditInvoiceForm {
  due_date: string;
  invoice_type: string;
  notes: string;
}

const EditInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'invoices');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditInvoiceForm>({
    defaultValues: {
      due_date: '',
      invoice_type: 'Immediate',
      notes: '',
    },
  });

  const fetchInvoice = useCallback(async () => {
    if (!moduleId || !subModuleId || !id) {
      setError('You do not have access to this module');
      setLoadingInvoice(false);
      return;
    }

    setLoadingInvoice(true);
    setError('');

    try {
      const response = await invoicesService.getInvoice(id, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success && response.data) {
        setInvoice(response.data);
        let formattedDueDate = '';
        if (response.data.due_date) {
          const date = new Date(response.data.due_date);
          if (!isNaN(date.getTime())) {
            formattedDueDate = date.toISOString().split('T')[0];
          }
        }
        reset({
          due_date: formattedDueDate,
          invoice_type: response.data.invoice_type || 'Immediate',
          notes: response.data.notes || '',
        });
      } else {
        setError(response.message || 'Failed to fetch invoice');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to fetch invoice'));
    } finally {
      setLoadingInvoice(false);
    }
  }, [moduleId, subModuleId, id, reset]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const onSubmit = async (data: EditInvoiceForm) => {
    if (!moduleId || !subModuleId || !invoice) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    const invoiceId = invoice.unique_id;
    setLoading(true);
    setError('');

    try {
      const dueDateResponse = await invoicesService.updateDueDate(
        invoiceId,
        { due_date: data.due_date },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (!dueDateResponse.success) {
        setError(dueDateResponse.message || 'Failed to update due date');
        showAlert('error-alert');
        setLoading(false);
        return;
      }
      const invoiceTypeResponse = await invoicesService.updateInvoiceType(
        invoiceId,
        { invoice_type: data.invoice_type },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (!invoiceTypeResponse.success) {
        setError(invoiceTypeResponse.message || 'Failed to update invoice type');
        showAlert('error-alert');
        setLoading(false);
        return;
      }

      const notesResponse = await invoicesService.updateNotes(
        invoiceId,
        { notes: data.notes || undefined },
        {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        }
      );

      if (!notesResponse.success) {
        setError(notesResponse.message || 'Failed to update notes');
        showAlert('error-alert');
        setLoading(false);
        return;
      }

      setSuccessMessage('Invoice updated successfully');
      showAlert('success-alert');
      setTimeout(() => {
        navigate('/dashboard/sales/invoices');
      }, 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update invoice'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <span className="xui-badge xui-badge-success">Paid</span>;
      case 'partially_paid':
        return <span className="xui-badge xui-badge-info">Partially Paid</span>;
      case 'unpaid':
        return <span className="xui-badge xui-badge-warning">Unpaid</span>;
      case 'cancelled':
        return <span className="xui-badge xui-badge-danger">Cancelled</span>;
      default:
        return <span className="xui-badge">{status}</span>;
    }
  };

  if (loadingInvoice) {
    return (
      <div>
        <Navbar title="Edit Invoice" subtitle="Update invoice details" />
        <div className="xui-py-3 xui-text-center">
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div>
        <Navbar title="Edit Invoice" subtitle="Update invoice details" />
        <div className="xui-py-1">
          <a
            onClick={() => navigate(-1)}
            className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
          >
            <span className="icon-container">
              <ArrowLeft size={20} />
            </span>
          </a>
          <ErrorState title="Failed to load invoice" message={error} onRetry={fetchInvoice} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Invoice" subtitle="Update invoice details" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container">
            <ArrowLeft size={20} />
          </span>
        </a>

        {invoice && (
          <>
            <div
              className="xui-bg-white xui-p-1 xui-bdr-rad-half xui-mb-2"
              style={{ border: '1px solid var(--neutral-200)' }}
            >
              <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
                <div>
                  <h3 className="xui-font-sz-90 xui-font-w-bold" style={{ color: 'var(--primary-600)' }}>
                    {invoice.SalesOrder?.reference || 'Invoice'}
                  </h3>
                  <p className="xui-font-sz-80 xui-opacity-6">
                    Invoice Date: {formatDate(invoice.invoice_date)}
                  </p>
                </div>
                {getStatusBadge(invoice.invoice_status)}
              </div>

              <div className="xui-d-grid xui-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1">
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Customer</p>
                  <p className="xui-font-sz-85 xui-font-w-500">{invoice.Customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Subtotal</p>
                  <p className="xui-font-sz-85 xui-font-w-500">{formatCurrency(invoice.subtotal_amount)}</p>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Discount</p>
                  <p className="xui-font-sz-85 xui-font-w-500" style={{ color: invoice.discount_amount > 0 ? 'var(--error)' : 'inherit' }}>
                    {invoice.discount_amount > 0 ? `-${formatCurrency(invoice.discount_amount)}` : formatCurrency(0)}
                  </p>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Outside Town Surcharge</p>
                  <p className="xui-font-sz-85 xui-font-w-500">{formatCurrency(invoice.outside_town_surcharge)}</p>
                </div>
              </div>

              <div className="xui-d-grid xui-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1 xui-mt-1 xui-pt-1" style={{ borderTop: '1px solid var(--neutral-200)' }}>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Total Amount</p>
                  <p className="xui-font-sz-85 xui-font-w-bold">{formatCurrency(invoice.total_amount)}</p>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Amount Paid</p>
                  <p className="xui-font-sz-85 xui-font-w-500" style={{ color: 'var(--success)' }}>
                    {formatCurrency(invoice.amount_paid)}
                  </p>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Balance Due</p>
                  <p className="xui-font-sz-85 xui-font-w-bold" style={{ color: invoice.balance_due > 0 ? 'var(--error)' : 'var(--success)' }}>
                    {formatCurrency(invoice.balance_due)}
                  </p>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Created By</p>
                  <p className="xui-font-sz-85 xui-font-w-500">
                    {invoice.User ? `${invoice.User.firstname} ${invoice.User.lastname}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <p className="xui-font-sz-80 xui-opacity-6 xui-mb-1">
              Update the invoice details below.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
              <div className="xui-d-grid xui-grid-col-1 xui-lg-grid-col-2 xui-grid-gap-2">
                <div>
                  <div className="xui-form-box">
                    <label htmlFor="invoice_type">Invoice Type *</label>
                    <select
                      id="invoice_type"
                      {...register('invoice_type', { required: 'Invoice type is required' })}
                      className={errors.invoice_type ? 'xui-bdr-red' : ''}
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="Credit">Credit</option>
                    </select>
                    {errors.invoice_type && (
                      <span className="xui-font-sz-80 xui-text-red">{errors.invoice_type.message}</span>
                    )}
                  </div>

                  <div className="xui-form-box">
                    <label htmlFor="due_date">Due Date *</label>
                    <input
                      type="date"
                      id="due_date"
                      {...register('due_date', { required: 'Due date is required' })}
                      className={errors.due_date ? 'xui-bdr-red' : ''}
                    />
                    {errors.due_date && (
                      <span className="xui-font-sz-80 xui-text-red">{errors.due_date.message}</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="xui-form-box">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      placeholder="Additional notes"
                      rows={5}
                      {...register('notes')}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isDirty}
                className="xui-btn xui-mt-1 xui-bdr-rad-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                {loading ? 'Updating Invoice...' : 'Update Invoice'}
              </button>
            </form>
          </>
        )}
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditInvoice;
