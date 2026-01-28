import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import finishedGoodsService from '../../services/finishedGoods.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface FinishedGoodFormData {
  name: string;
  type: string;
  description: string;
  unit_of_measure: string;
  current_quantity: string;
  unit_cost: string;
  selling_price: string;
}

const AddFinishedGood = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('inventory-stock-management', 'finished-goods');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FinishedGoodFormData>({
    defaultValues: {
      name: '',
      type: '',
      description: '',
      unit_of_measure: '',
      current_quantity: '',
      unit_cost: '',
      selling_price: '',
    },
  });

  const onSubmit = async (data: FinishedGoodFormData) => {
    if (!accessIds) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: data.name,
        type: data.type || undefined,
        description: data.description || undefined,
        unit_of_measure: data.unit_of_measure,
        current_quantity: Number(data.current_quantity),
        unit_cost: Number(data.unit_cost),
        selling_price: Number(data.selling_price),
      };

      const response = await finishedGoodsService.addFinishedGood(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('Finished good added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/inventory/finished-goods');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add finished good');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add finished good'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const goodTypes = [
    { value: 'Block', label: 'Block' },
    { value: 'Brick', label: 'Brick' },
    { value: 'Paver', label: 'Paver' },
    { value: 'Tile', label: 'Tile' },
    { value: 'Other', label: 'Other' },
  ];

  const unitOfMeasures = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'blocks', label: 'Blocks' },
    { value: 'bags', label: 'Bags' },
    { value: 'units', label: 'Units' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'tons', label: 'Tons' },
  ];

  return (
    <div>
      <Navbar title="Add Finished Good" subtitle="Create a new finished good record" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the finished good details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="name">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter product name"
                  {...register('name', {
                    required: 'Product name is required',
                    minLength: { value: 1, message: 'Name must be at least 1 character' },
                    maxLength: { value: 300, message: 'Name must be less than 300 characters' },
                  })}
                />
                {errors.name && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="type">Product Type</label>
                <select id="type" {...register('type')}>
                  <option value="">--Select product type--</option>
                  {goodTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xui-form-box">
                <label htmlFor="unit_of_measure">Unit of Measure *</label>
                <select
                  id="unit_of_measure"
                  {...register('unit_of_measure', {
                    required: 'Unit of measure is required',
                  })}
                >
                  <option value="">--Select unit of measure--</option>
                  {unitOfMeasures.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
                {errors.unit_of_measure && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.unit_of_measure.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="current_quantity">Current Quantity *</label>
                <input
                  type="number"
                  id="current_quantity"
                  placeholder="Enter current quantity"
                  min="0"
                  step="0.01"
                  {...register('current_quantity', {
                    required: 'Current quantity is required',
                    min: { value: 0, message: 'Quantity must be at least 0' },
                  })}
                />
                {errors.current_quantity && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.current_quantity.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="unit_cost">Unit Cost (₦) *</label>
                <input
                  type="number"
                  id="unit_cost"
                  placeholder="Enter unit cost"
                  min="0"
                  step="0.01"
                  {...register('unit_cost', {
                    required: 'Unit cost is required',
                    min: { value: 0, message: 'Unit cost must be at least 0' },
                  })}
                />
                {errors.unit_cost && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.unit_cost.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="selling_price">Selling Price (₦) *</label>
                <input
                  type="number"
                  id="selling_price"
                  placeholder="Enter selling price"
                  min="0"
                  step="0.01"
                  {...register('selling_price', {
                    required: 'Selling price is required',
                    min: { value: 0, message: 'Selling price must be at least 0' },
                  })}
                />
                {errors.selling_price && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.selling_price.message}
                  </span>
                )}
              </div>

              <div className="xui-form-box">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Enter product description"
                  rows={5}
                  {...register('description')}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Saving Finished Good...' : 'Save Finished Good'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddFinishedGood;
