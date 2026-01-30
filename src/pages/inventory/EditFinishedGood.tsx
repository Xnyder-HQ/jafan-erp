import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import finishedGoodsService from '../../services/finishedGoods.service';
import productsService, { type Product } from '../../services/products.service';
import type { FinishedGood } from '../../services/finishedGoods.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage, formatCurrency } from '../../utils/formatters';

interface FinishedGoodFormData {
  name: string;
  type: string;
  description: string;
  unit_of_measure: string;
  unit_cost: string;
  selling_price: string;
  product_unique_id: string;
}

const EditFinishedGood = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingGood, setLoadingGood] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [originalGood, setOriginalGood] = useState<FinishedGood | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const accessIds = getAccessIds('inventory-stock-management', 'finished-goods');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FinishedGoodFormData>({
    defaultValues: {
      name: '',
      type: '',
      description: '',
      unit_of_measure: '',
      unit_cost: '',
      selling_price: '',
      product_unique_id: '',
    },
  });

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productsService.getProductsForDropdown();

      if (response.success && response.data && 'rows' in response.data) {
        setProducts(response.data.rows);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  useEffect(() => {
    if (!moduleId) {
      setLoadingGood(false);
      return;
    }

    const fetchGood = async () => {
      if (!id) {
        setLoadingGood(false);
        return;
      }

      try {
        fetchProducts();

        const response = await finishedGoodsService.getFinishedGood(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          const good = response.data;
          setOriginalGood(good);
          reset({
            name: good.name,
            type: good.type || '',
            description: good.description || '',
            unit_of_measure: good.unit_of_measure || '',
            unit_cost: good.unit_cost?.toString() || '',
            selling_price: good.selling_price?.toString() || '',
            product_unique_id: good.product_unique_id || '',
          });
        } else {
          setError('Finished good not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to fetch finished good'));
        showAlert('error-alert');
      } finally {
        setLoadingGood(false);
      }
    };

    fetchGood();
  }, [moduleId, subModuleId, id, reset, fetchProducts]);

  const onSubmit = async (data: FinishedGoodFormData) => {
    if (!accessIds || !id || !originalGood) {
      setError('Unable to update finished good');
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
        data.name !== originalGood.name ||
        data.type !== (originalGood.type || '') ||
        data.unit_of_measure !== (originalGood.unit_of_measure || '')
      ) {
        updatePromises.push(
          finishedGoodsService.updateFinishedGoodDetails(
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

      if (data.description !== (originalGood.description || '')) {
        updatePromises.push(
          finishedGoodsService.updateFinishedGoodDescription(
            id,
            {
              description: data.description || undefined,
            },
            params
          )
        );
      }

      const newUnitCost = Number(data.unit_cost);
      const newSellingPrice = Number(data.selling_price);
      if (newUnitCost !== originalGood.unit_cost || newSellingPrice !== originalGood.selling_price) {
        updatePromises.push(
          finishedGoodsService.updateFinishedGoodCost(
            id,
            {
              unit_cost: newUnitCost,
              selling_price: newSellingPrice,
            },
            params
          )
        );
      }

      const originalProductId = originalGood.product_unique_id || '';
      if (data.product_unique_id !== originalProductId) {
        updatePromises.push(
          finishedGoodsService.updateFinishedGoodProduct(
            id,
            {
              product_unique_id: data.product_unique_id || null,
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
        throw firstRejected?.reason || new Error('Failed to update finished good');
      }
      const results = settled
        .filter((r): r is PromiseFulfilledResult<{ success: boolean; message: string }> => r.status === 'fulfilled')
        .map(r => r.value);
      const failedUpdate = results.find((r) => !r.success);

      if (failedUpdate) {
        setError(failedUpdate.message || 'Failed to update some fields');
        showAlert('error-alert');
      } else {
        setSuccessMessage('Finished good updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/inventory/finished-goods');
        }, 1500);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update finished good'));
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

  if (loadingGood) {
    return (
      <div>
        <Navbar title="Edit Finished Good" subtitle="Update finished good information" />
        <div className="xui-py-1">
          <p>Loading finished good...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Finished Good" subtitle="Update finished good information" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        {originalGood && (
          <div className="xui-mb-1">
            <span className="xui-font-sz-80 xui-opacity-6">Reference: {originalGood.reference}</span>
            <span className="xui-ml-1 xui-font-sz-80 xui-opacity-6">
              | Current Stock: <strong>{originalGood.current_quantity.toLocaleString()} {originalGood.unit_of_measure || ''}</strong>
            </span>
            <span className="xui-ml-1 xui-font-sz-80 xui-opacity-6">
              | Unit Cost: <strong>{formatCurrency(originalGood.unit_cost)}</strong>
            </span>
            {originalGood.Product && (
              <span className="xui-ml-1 xui-font-sz-80">
                | Linked Product: <strong style={{ color: 'var(--primary-600)' }}>{originalGood.Product.name}</strong>
              </span>
            )}
          </div>
        )}

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the finished good details below.</p>
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
            </div>

            <div>
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
                  rows={4}
                  {...register('description')}
                />
              </div>

              <div className="xui-form-box">
                <label htmlFor="product_unique_id">
                  Linked Sales Product
                  <span className="xui-font-sz-80 xui-opacity-6 xui-ml-half">(for supply logs)</span>
                </label>
                <select id="product_unique_id" {...register('product_unique_id')}>
                  <option value="">--No product linked--</option>
                  {products.map((product) => (
                    <option key={product.unique_id} value={product.unique_id}>
                      {product.name} {product.Category?.name ? `(${product.Category.name})` : ''}
                    </option>
                  ))}
                </select>
                <p className="xui-font-sz-75 xui-opacity-5 xui-mt-half">
                  Link this finished good to a sales product to enable supply log tracking.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Updating Finished Good...' : 'Update Finished Good'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default EditFinishedGood;
