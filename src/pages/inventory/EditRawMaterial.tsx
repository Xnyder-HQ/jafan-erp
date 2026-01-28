import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import rawMaterialsService from '../../services/rawMaterials.service';
import type { RawMaterial } from '../../services/rawMaterials.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';

interface RawMaterialFormData {
  name: string;
  type: string;
  description: string;
  unit_of_measure: string;
  reorder_level: string;
}

const EditRawMaterial = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [originalMaterial, setOriginalMaterial] = useState<RawMaterial | null>(null);

  const accessIds = getAccessIds('inventory-stock-management', 'raw-materials');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RawMaterialFormData>({
    defaultValues: {
      name: '',
      type: '',
      description: '',
      unit_of_measure: '',
      reorder_level: '',
    },
  });

  useEffect(() => {
    if (!moduleId) {
      setLoadingMaterial(false);
      return;
    }

    const fetchMaterial = async () => {
      if (!id) {
        setLoadingMaterial(false);
        return;
      }

      try {
        const response = await rawMaterialsService.getRawMaterial(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          const material = response.data;
          setOriginalMaterial(material);
          reset({
            name: material.name,
            type: material.type || '',
            description: material.description || '',
            unit_of_measure: material.unit_of_measure || '',
            reorder_level: material.reorder_level?.toString() || '',
          });
        } else {
          setError('Raw material not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to fetch raw material'));
        showAlert('error-alert');
      } finally {
        setLoadingMaterial(false);
      }
    };

    fetchMaterial();
  }, [moduleId, subModuleId, id, reset]);

  const onSubmit = async (data: RawMaterialFormData) => {
    if (!accessIds || !id || !originalMaterial) {
      setError('Unable to update raw material');
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
        data.name !== originalMaterial.name ||
        data.type !== (originalMaterial.type || '') ||
        data.unit_of_measure !== (originalMaterial.unit_of_measure || '')
      ) {
        updatePromises.push(
          rawMaterialsService.updateRawMaterialDetails(
            id,
            {
              name: data.name,
              type: data.type || undefined,
              unit_of_measure: data.unit_of_measure || undefined,
            },
            params
          )
        );
      }

      if (data.description !== (originalMaterial.description || '')) {
        updatePromises.push(
          rawMaterialsService.updateRawMaterialDescription(
            id,
            {
              description: data.description || undefined,
            },
            params
          )
        );
      }

      const newReorderLevel = data.reorder_level ? Number(data.reorder_level) : null;
      if (newReorderLevel !== originalMaterial.reorder_level) {
        updatePromises.push(
          rawMaterialsService.updateRawMaterialReorderLevel(
            id,
            {
              reorder_level: newReorderLevel || undefined,
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
        throw firstRejected?.reason || new Error('Failed to update raw material');
      }
      const results = settled
        .filter((r): r is PromiseFulfilledResult<{ success: boolean; message: string }> => r.status === 'fulfilled')
        .map(r => r.value);
      const failedUpdate = results.find((r) => !r.success);

      if (failedUpdate) {
        setError(failedUpdate.message || 'Failed to update some fields');
        showAlert('error-alert');
      } else {
        setSuccessMessage('Raw material updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/inventory/raw-materials');
        }, 1500);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update raw material'));
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

  if (loadingMaterial) {
    return (
      <div>
        <Navbar title="Edit Raw Material" subtitle="Update raw material information" />
        <div className="xui-py-1">
          <p>Loading raw material...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Raw Material" subtitle="Update raw material information" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {originalMaterial && (
          <div className="xui-mb-1">
            <span className="xui-font-sz-80 xui-opacity-6">Reference: {originalMaterial.reference}</span>
            <span className="xui-ml-1 xui-font-sz-80 xui-opacity-6">
              | Current Stock: <strong>{originalMaterial.current_quantity.toLocaleString()} {originalMaterial.unit_of_measure || ''}</strong>
            </span>
          </div>
        )}

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the raw material details below.</p>
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
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Enter material description"
                  rows={8}
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
            {loading ? 'Updating Material...' : 'Update Material'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditRawMaterial;
