import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import businessRulesService from '../../services/businessRules.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface RuleFormData {
  rule_key: string;
  rule_value: string;
  value_type: string;
  applies_to: string;
  notes: string;
  is_active: string;
}

const AddBusinessRule = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('administration', 'business-rules');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RuleFormData>({
    defaultValues: {
      rule_key: '',
      rule_value: '',
      value_type: '',
      applies_to: '',
      notes: '',
      is_active: 'true',
    },
  });

  const onSubmit = async (data: RuleFormData) => {
    if (!accessIds) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        rule_key: data.rule_key,
        rule_value: Number(data.rule_value),
        value_type: data.value_type,
        applies_to: data.applies_to,
        is_active: data.is_active === 'true',
        ...(data.notes && { notes: data.notes }),
      };

      const response = await businessRulesService.addBusinessRule(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('Business rule added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/users/rules');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add business rule');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add business rule'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar title="Add Business Rule" subtitle="Create a new business rule" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the business rule details below. Fields marked with * are required. The rule key will be automatically converted to uppercase with underscores.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="rule_key">Rule Key *</label>
                <input
                  type="text"
                  id="rule_key"
                  placeholder="e.g. MAX_DISCOUNT_PERCENTAGE"
                  {...register('rule_key', {
                    required: 'Rule key is required',
                    minLength: { value: 1, message: 'Minimum 1 character' },
                    maxLength: { value: 100, message: 'Maximum 100 characters' },
                  })}
                />
                {errors.rule_key && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.rule_key.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="rule_value">Rule Value *</label>
                <input
                  type="number"
                  id="rule_value"
                  placeholder="Enter rule value"
                  min="0"
                  step="any"
                  {...register('rule_value', {
                    required: 'Rule value is required',
                    min: { value: 0, message: 'Must be 0 or greater' },
                  })}
                />
                {errors.rule_value && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.rule_value.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="value_type">Value Type *</label>
                <select id="value_type" {...register('value_type', { required: 'Value type is required' })}>
                  <option value="">--Select value type--</option>
                  <option value="Number">Number</option>
                  <option value="Percentage">Percentage</option>
                </select>
                {errors.value_type && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.value_type.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="applies_to">Applies To *</label>
                <input
                  type="text"
                  id="applies_to"
                  placeholder="e.g. Sales Orders, All Invoices"
                  {...register('applies_to', {
                    required: 'Applies to is required',
                    minLength: { value: 1, message: 'Minimum 1 character' },
                    maxLength: { value: 100, message: 'Maximum 100 characters' },
                  })}
                />
                {errors.applies_to && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.applies_to.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="is_active">Active *</label>
                <select id="is_active" {...register('is_active', { required: 'Active status is required' })}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <div className="xui-form-box xui-mt-1">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              placeholder="Enter any additional notes (optional)"
              rows={3}
              {...register('notes')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Adding Rule...' : 'Add Rule'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddBusinessRule;
