import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';
import invoicesService, { type Invoice } from '../../services/invoices.service';
import invoicePaymentsService from '../../services/invoicePayments.service';
import { Alert, showAlert, ErrorState } from '../../components/common';

interface PaymentFormData {
  payment_date: string;
  payment_method: string;
  amount_paid: string;
  receipt_reference: string;
  notes: string;
}

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Transfer', label: 'Bank Transfer' },
  { value: 'POS', label: 'POS' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Account Balance', label: 'Account Balance' },
];

const AddInvoicePayment = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();
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
    formState: { errors },
  } = useForm<PaymentFormData>({
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      amount_paid: '',
      receipt_reference: '',
      notes: '',
    },
  });

  const fetchInvoice = useCallback(async () => {
    if (!moduleId || !subModuleId || !invoiceId) {
      setError('You do not have access to this module');
      setLoadingInvoice(false);
      return;
    }

    setLoadingInvoice(true);
    setError('');

    try {
      const response = await invoicesService.getInvoice(invoiceId, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success && response.data) {
        setInvoice(response.data);
      } else {
        setError(response.message || 'Failed to fetch invoice');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to fetch invoice'));
    } finally {
      setLoadingInvoice(false);
    }
  }, [moduleId, subModuleId, invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!moduleId || !subModuleId || !invoice) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    const amountPaid = parseFloat(data.amount_paid);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      setError('Please enter a valid payment amount');
      showAlert('error-alert');
      return;
    }

    if (amountPaid > invoice.balance_due) {
      setError(`Payment amount cannot exceed the balance due (${formatCurrency(invoice.balance_due)})`);
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        invoice_unique_id: invoice.unique_id,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        amount_paid: amountPaid,
        ...(data.receipt_reference && { receipt_reference: data.receipt_reference }),
        ...(data.notes && { notes: data.notes }),
      };

      const response = await invoicePaymentsService.addInvoicePayment(payload, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success) {
        setSuccessMessage(response.message || 'Payment recorded successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/sales/invoices');
        }, 1500);
      } else {
        setError(response.message || 'Failed to record payment');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to record payment'));
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
        <Navbar title="Add Payment" subtitle="Record a payment for an invoice" />
        <div className="xui-py-3 xui-text-center">
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div>
        <Navbar title="Add Payment" subtitle="Record a payment for an invoice" />
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

  if (invoice?.invoice_status?.toLowerCase() === 'paid') {
    return (
      <div>
        <Navbar title="Add Payment" subtitle="Record a payment for an invoice" />
        <div className="xui-py-1">
          <a
            onClick={() => navigate(-1)}
            className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
          >
            <span className="icon-container">
              <ArrowLeft size={20} />
            </span>
          </a>
          <div className="xui-bg-white xui-p-2 xui-bdr-rad-half xui-text-center" style={{ border: '1px solid var(--neutral-200)' }}>
            <p className="xui-font-sz-90 xui-font-w-500" style={{ color: 'var(--success)' }}>
              This invoice has already been fully paid.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (invoice?.invoice_status?.toLowerCase() === 'cancelled') {
    return (
      <div>
        <Navbar title="Add Payment" subtitle="Record a payment for an invoice" />
        <div className="xui-py-1">
          <a
            onClick={() => navigate(-1)}
            className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
          >
            <span className="icon-container">
              <ArrowLeft size={20} />
            </span>
          </a>
          <div className="xui-bg-white xui-p-2 xui-bdr-rad-half xui-text-center" style={{ border: '1px solid var(--neutral-200)' }}>
            <p className="xui-font-sz-90 xui-font-w-500" style={{ color: 'var(--error)' }}>
              Cannot add payment to a cancelled invoice.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Add Payment" subtitle="Record a payment for an invoice" />
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
                    Customer: {invoice.Customer?.name || 'N/A'}
                  </p>
                </div>
                {getStatusBadge(invoice.invoice_status)}
              </div>

              <div className="xui-d-grid xui-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1">
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
                  <p className="xui-font-sz-85 xui-font-w-bold" style={{ color: 'var(--error)' }}>
                    {formatCurrency(invoice.balance_due)}
                  </p>
                </div>
                <div>
                  <p className="xui-font-sz-75 xui-opacity-6">Invoice Type</p>
                  <p className="xui-font-sz-85 xui-font-w-500">{invoice.invoice_type}</p>
                </div>
              </div>
            </div>

            <p className="xui-font-sz-80 xui-opacity-6 xui-mb-1">
              Enter the payment details below.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
              <div className="xui-d-grid xui-grid-col-1 xui-lg-grid-col-2 xui-grid-gap-2">
                <div>
                  <div className="xui-form-box">
                    <label htmlFor="payment_date">Payment Date *</label>
                    <input
                      type="date"
                      id="payment_date"
                      {...register('payment_date', { required: 'Payment date is required' })}
                    />
                    {errors.payment_date && (
                      <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                        {errors.payment_date.message}
                      </span>
                    )}
                  </div>

                  <div className="xui-form-box">
                    <label htmlFor="payment_method">Payment Method *</label>
                    <select
                      id="payment_method"
                      {...register('payment_method', { required: 'Payment method is required' })}
                    >
                      <option value="">-- Select payment method --</option>
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    {errors.payment_method && (
                      <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                        {errors.payment_method.message}
                      </span>
                    )}
                  </div>

                  <div className="xui-form-box">
                    <label htmlFor="amount_paid">Amount Paid *</label>
                    <input
                      type="number"
                      id="amount_paid"
                      step="0.01"
                      min="0"
                      max={invoice.balance_due}
                      placeholder={`Max: ${formatCurrency(invoice.balance_due)}`}
                      {...register('amount_paid', {
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Amount must be greater than 0' },
                        max: { value: invoice.balance_due, message: `Amount cannot exceed ${formatCurrency(invoice.balance_due)}` },
                      })}
                    />
                    {errors.amount_paid && (
                      <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                        {errors.amount_paid.message}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="xui-form-box">
                    <label htmlFor="receipt_reference">Receipt/Transaction Reference</label>
                    <input
                      type="text"
                      id="receipt_reference"
                      placeholder="Enter reference number"
                      {...register('receipt_reference')}
                    />
                  </div>

                  <div className="xui-form-box">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      placeholder="Additional notes"
                      rows={4}
                      {...register('notes')}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="xui-btn xui-mt-1 xui-bdr-rad-half"
                style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
              >
                {loading ? 'Recording Payment...' : 'Record Payment'}
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

export default AddInvoicePayment;
