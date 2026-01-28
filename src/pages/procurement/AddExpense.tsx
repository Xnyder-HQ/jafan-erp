import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { extractErrorMessage } from '../../utils/formatters';
import expensesService from '../../services/expenses.service';
import { Alert, showAlert } from '../../components/common';

interface ExpenseForm {
  category: string;
  amount: number;
  expense_date: string;
  notes: string;
}

const AddExpense = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('procurement-vendor-management', 'expenses');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseForm>({
    defaultValues: {
      category: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const onSubmit = async (data: ExpenseForm) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        category: data.category,
        amount: data.amount,
        expense_date: data.expense_date,
        notes: data.notes || undefined,
      };

      const response = await expensesService.addExpense(payload, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success) {
        setSuccessMessage('Expense recorded successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/procurement/expenses');
        }, 1500);
      } else {
        setError(response.message || 'Failed to record expense');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to record expense'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar title="Record Expense" subtitle="Record a new expense" />
      <div className="xui-py-1">
        <a onClick={() => navigate(-1)} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the expense details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="category">Category *</label>
                <input
                  type="text"
                  id="category"
                  {...register('category', {
                    required: 'Category is required',
                    minLength: { value: 2, message: 'Category must be at least 2 characters' },
                    maxLength: { value: 50, message: 'Category must be at most 50 characters' },
                  })}
                  className={errors.category ? 'xui-bdr-red' : ''}
                  placeholder="e.g. Utilities, Transport, Maintenance"
                />
                {errors.category && <span className="xui-font-sz-80 xui-text-red">{errors.category.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="amount">Amount (₦) *</label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  {...register('amount', {
                    required: 'Amount is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Amount cannot be negative' },
                  })}
                  className={errors.amount ? 'xui-bdr-red' : ''}
                  placeholder="Enter expense amount"
                />
                {errors.amount && <span className="xui-font-sz-80 xui-text-red">{errors.amount.message}</span>}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="expense_date">Expense Date *</label>
                <input
                  type="date"
                  id="expense_date"
                  {...register('expense_date', { required: 'Expense date is required' })}
                  className={errors.expense_date ? 'xui-bdr-red' : ''}
                />
                {errors.expense_date && <span className="xui-font-sz-80 xui-text-red">{errors.expense_date.message}</span>}
              </div>

              <div className="xui-form-box">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional notes about the expense"
                  rows={4}
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
            {loading ? 'Recording Expense...' : 'Record Expense'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddExpense;
