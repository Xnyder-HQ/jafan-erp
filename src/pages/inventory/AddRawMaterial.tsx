import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import rawMaterialsService from '../../services/rawMaterials.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface RawMaterialFormData {
  name: string;
  type: string;
  description: string;
  unit_of_measure: string;
  current_quantity: string;
  reorder_level: string;
}

const AddRawMaterial = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessIds = getAccessIds('inventory-stock-management', 'raw-materials');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RawMaterialFormData>({
    defaultValues: {
      name: '',
      type: '',
      description: '',
      unit_of_measure: '',
      current_quantity: '',
      reorder_level: '',
    },
  });

  const onSubmit = async (data: RawMaterialFormData) => {
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
        unit_of_measure: data.unit_of_measure || undefined,
        current_quantity: Number(data.current_quantity),
        reorder_level: data.reorder_level ? Number(data.reorder_level) : undefined,
      };

      const response = await rawMaterialsService.addRawMaterial(payload, {
        module_unique_id: accessIds.module_unique_id,
        sub_module_unique_id: accessIds.sub_module_unique_id,
      });

      if (response.success) {
        setSuccessMessage('Raw material added successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/inventory/raw-materials');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add raw material');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to add raw material'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const materialTypes = [
    { value: 'Cement', label: 'Cement' },
    { value: 'Sand', label: 'Sand' },
    { value: 'Aggregate', label: 'Aggregate' },
    { value: 'Water', label: 'Water' },
    { value: 'Fuel', label: 'Fuel' },
    { value: 'Chemical', label: 'Chemical' },
    { value: 'Other', label: 'Other' },
  ];

  const unitOfMeasures = [
    { value: 'bags', label: 'Bags' },
    { value: 'trips', label: 'Trips' },
    { value: 'liters', label: 'Liters' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'tons', label: 'Tons' },
    { value: 'units', label: 'Units' },
    { value: 'pieces', label: 'Pieces' },
  ];

  return (
    <div>
      <Navbar title="Add Raw Material" subtitle="Create a new raw material record" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Fill in the raw material details below. Fields marked with * are required.</p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="name">Material Name *</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter material name"
                  {...register('name', {
                    required: 'Material name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
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
                <label htmlFor="type">Material Type</label>
                <select id="type" {...register('type')}>
                  <option value="">--Select material type--</option>
                  {materialTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xui-form-box">
                <label htmlFor="unit_of_measure">Unit of Measure</label>
                <select id="unit_of_measure" {...register('unit_of_measure')}>
                  <option value="">--Select unit of measure--</option>
                  {unitOfMeasures.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
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
                <label htmlFor="reorder_level">Reorder Level</label>
                <input
                  type="number"
                  id="reorder_level"
                  placeholder="Enter minimum stock level"
                  min="0"
                  step="0.01"
                  {...register('reorder_level', {
                    min: { value: 0, message: 'Reorder level must be at least 0' },
                  })}
                />
                {errors.reorder_level && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.reorder_level.message}
                  </span>
                )}
                <small className="xui-opacity-5 xui-d-block xui-mt-half">
                  You will be alerted when stock falls below this level
                </small>
              </div>

              <div className="xui-form-box">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Enter material description"
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
            {loading ? 'Saving Material...' : 'Save Material'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddRawMaterial;
