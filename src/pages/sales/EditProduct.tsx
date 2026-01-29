import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Navbar } from '../../components/layout';
import { ArrowLeft } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import productsService from '../../services/products.service';
import type { Product } from '../../services/products.service';
// import categoriesService from '../../services/categories.service';
// import type { Category } from '../../services/categories.service';
import { Alert, showAlert } from '../../components/common';
import { extractErrorMessage } from '../../utils/formatters';
// import { AddCategoryModal } from '../../components/modals';

interface ProductFormData {
  // category_unique_id: string;
  name: string;
  type: string;
  description: string;
  unit_of_measure: string;
  quantity: string;
  total_quantity: string;
  price: string;
  cost_price: string;
  is_outside_town_eligible: boolean;
  is_inventory_tracked: boolean;
}

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  // const [categories, setCategories] = useState<Category[]>([]);
  // const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'products');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const {
    register,
    handleSubmit,
    // setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      // category_unique_id: '',
      name: '',
      type: '',
      description: '',
      unit_of_measure: '',
      quantity: '',
      total_quantity: '',
      price: '',
      cost_price: '',
      is_outside_town_eligible: false,
      is_inventory_tracked: true,
    },
  });

  useEffect(() => {
    if (!moduleId) {
      // setLoadingCategories(false);
      setLoadingProduct(false);
      return;
    }

    // const fetchCategories = async () => {
    //   try {
    //     const response = await categoriesService.getCategories({
    //       page: 1,
    //       size: 100,
    //       module_unique_id: moduleId,
    //       sub_module_unique_id: subModuleId,
    //     });

    //     if (response.success && response.data) {
    //       if (Array.isArray(response.data)) {
    //         setCategories(response.data);
    //       } else {
    //         setCategories(response.data.rows || []);
    //       }
    //     }
    //   } catch (err: any) {
    //     console.error('Failed to fetch categories:', err);
    //   } finally {
    //     setLoadingCategories(false);
    //   }
    // };

    const fetchProduct = async () => {
      if (!id) {
        setLoadingProduct(false);
        return;
      }

      try {
        const response = await productsService.getProduct(id, {
          module_unique_id: moduleId,
          sub_module_unique_id: subModuleId,
        });

        if (response.success && response.data) {
          const product = response.data;
          setOriginalProduct(product);
          reset({
            // category_unique_id: product.category_unique_id,
            name: product.name,
            type: product.type || '',
            description: product.description || '',
            unit_of_measure: product.unit_of_measure || '',
            quantity: product.quantity.toString(),
            total_quantity: product.total_quantity.toString(),
            price: product.price.toString(),
            cost_price: product.cost_price.toString(),
            is_outside_town_eligible: product.is_outside_town_eligible,
            is_inventory_tracked: product.is_inventory_tracked,
          });
        } else {
          setError('Product not found');
          showAlert('error-alert');
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, 'Failed to fetch product'));
        showAlert('error-alert');
      } finally {
        setLoadingProduct(false);
      }
    };

    // fetchCategories();
    fetchProduct();
  }, [moduleId, subModuleId, id, reset]);

  // const handleCategoryAdded = async (categoryId?: string) => {
  //   if (!moduleId) return;

  //   try {
  //     const response = await categoriesService.getCategories({
  //       page: 1,
  //       size: 100,
  //       module_unique_id: moduleId,
  //       sub_module_unique_id: subModuleId,
  //     });

  //     if (response.success && response.data) {
  //       if (Array.isArray(response.data)) {
  //         setCategories(response.data);
  //       } else {
  //         setCategories(response.data.rows || []);
  //       }
  //     }
  //   } catch (err: any) {
  //     console.error('Failed to fetch categories:', err);
  //   }

  //   if (categoryId) {
  //     setValue('category_unique_id', categoryId);
  //   }
  // };

  const onSubmit = async (data: ProductFormData) => {
    if (!accessIds || !id || !originalProduct) {
      setError('Unable to update product');
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

      // Category update commented out
      // if (data.category_unique_id !== originalProduct.category_unique_id) {
      //   updatePromises.push(
      //     productsService.updateProductCategory(id, { category_unique_id: data.category_unique_id }, params)
      //   );
      // }

      if (
        data.name !== originalProduct.name ||
        data.type !== (originalProduct.type || '') ||
        data.unit_of_measure !== (originalProduct.unit_of_measure || '')
      ) {
        updatePromises.push(
          productsService.updateProductDetails(
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

      if (data.description !== (originalProduct.description || '')) {
        updatePromises.push(
          productsService.updateProductDescription(id, { description: data.description || undefined }, params)
        );
      }

      if (
        Number(data.price) !== originalProduct.price ||
        Number(data.cost_price) !== originalProduct.cost_price
      ) {
        updatePromises.push(
          productsService.updateProductPrice(
            id,
            {
              price: Number(data.price),
              cost_price: data.cost_price ? Number(data.cost_price) : undefined,
            },
            params
          )
        );
      }

      if (
        Number(data.quantity) !== originalProduct.quantity ||
        Number(data.total_quantity) !== originalProduct.total_quantity
      ) {
        updatePromises.push(
          productsService.updateProductQuantity(
            id,
            {
              quantity: Number(data.quantity),
              total_quantity: Number(data.total_quantity),
            },
            params
          )
        );
      }

      if (
        data.is_outside_town_eligible !== originalProduct.is_outside_town_eligible ||
        data.is_inventory_tracked !== originalProduct.is_inventory_tracked
      ) {
        updatePromises.push(
          productsService.updateProductToggles(
            id,
            {
              is_outside_town_eligible: data.is_outside_town_eligible,
              is_inventory_tracked: data.is_inventory_tracked,
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
        throw firstRejected?.reason || new Error('Failed to update product');
      }
      const results = settled
        .filter((r): r is PromiseFulfilledResult<{ success: boolean; message: string }> => r.status === 'fulfilled')
        .map(r => r.value);
      const failedUpdate = results.find((r) => !r.success);

      if (failedUpdate) {
        setError(failedUpdate.message || 'Failed to update some fields');
        showAlert('error-alert');
      } else {
        setSuccessMessage('Product updated successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/sales/products');
        }, 1500);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to update product'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div>
        <Navbar title="Edit Product" subtitle="Update product information" />
        <div className="xui-py-1">
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Edit Product" subtitle="Update product information" />
      <div className="xui-py-1">
        <a onClick={() => navigate(-1)} className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer">
          <span className="icon-container"><ArrowLeft size={20} /></span>
        </a>

        <p className="xui-font-sz-[16px] xui-opacity-4">Update the product details below. Fields marked with * are required.</p>
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
                    minLength: { value: 1, message: 'Name is required' },
                    maxLength: { value: 300, message: 'Name must be less than 300 characters' },
                  })}
                />
                {errors.name && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.name.message}
                  </span>
                )}
              </div>
              {/* Category field commented out - backend doesn't require it
              <div className="xui-form-box">
                <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between">
                  <label htmlFor="category_unique_id">Category *</label>
                  <span
                    className="xui-font-sz-80 xui-cursor-pointer"
                    style={{ color: 'var(--primary-600)', textDecoration: 'underline' }}
                    xui-modal-open="add-category-modal"
                  >
                    Add Category
                  </span>
                </div>
                <select
                  id="category_unique_id"
                  disabled={loadingCategories}
                  {...register('category_unique_id', {
                    required: 'Category is required',
                  })}
                >
                  <option value="" disabled>
                    {loadingCategories ? 'Loading categories...' : '--Select category--'}
                  </option>
                  {categories.map((category) => (
                    <option key={category.unique_id} value={category.unique_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_unique_id && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.category_unique_id.message}
                  </span>
                )}
              </div>
              */}
              <div className="xui-form-box">
                <label htmlFor="type">Product Type</label>
                <input
                  type="text"
                  id="type"
                  placeholder="Enter product type (e.g., Finished, Raw)"
                  {...register('type', {
                    maxLength: { value: 50, message: 'Type must be less than 50 characters' },
                  })}
                />
                {errors.type && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.type.message}
                  </span>
                )}
              </div>
              <div className="xui-form-box">
                <label htmlFor="unit_of_measure">Unit of Measure *</label>
                <input
                  type="text"
                  id="unit_of_measure"
                  placeholder="e.g., Pieces, KG, Litres"
                  {...register('unit_of_measure', {
                    required: 'Unit of measure is required',
                    maxLength: { value: 100, message: 'Unit must be less than 100 characters' },
                  })}
                />
                {errors.unit_of_measure && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.unit_of_measure.message}
                  </span>
                )}
              </div>
              <div className="xui-form-box">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Enter product description"
                  rows={3}
                  {...register('description')}
                />
              </div>
            </div>
            <div>
              <div className="xui-form-box">
                <label htmlFor="price">Selling Price *</label>
                <input
                  type="number"
                  id="price"
                  placeholder="Enter selling price"
                  min="0"
                  step="0.01"
                  {...register('price', {
                    required: 'Selling price is required',
                    min: { value: 0, message: 'Price must be at least 0' },
                  })}
                />
                {errors.price && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.price.message}
                  </span>
                )}
              </div>
              <div className="xui-form-box">
                <label htmlFor="cost_price">Cost Price</label>
                <input
                  type="number"
                  id="cost_price"
                  placeholder="Enter cost price"
                  min="0"
                  step="0.01"
                  {...register('cost_price', {
                    min: { value: 0, message: 'Cost price must be at least 0' },
                  })}
                />
                {errors.cost_price && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.cost_price.message}
                  </span>
                )}
              </div>
              <div className="xui-form-box">
                <label htmlFor="quantity">Current Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  placeholder="Enter current quantity"
                  min="0"
                  {...register('quantity', {
                    required: 'Quantity is required',
                    min: { value: 0, message: 'Quantity must be at least 0' },
                  })}
                />
                {errors.quantity && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.quantity.message}
                  </span>
                )}
              </div>
              <div className="xui-form-box">
                <label htmlFor="total_quantity">Total Quantity</label>
                <input
                  type="number"
                  id="total_quantity"
                  placeholder="Enter total quantity"
                  min="0"
                  {...register('total_quantity', {
                    min: { value: 0, message: 'Total quantity must be at least 0' },
                  })}
                />
                {errors.total_quantity && (
                  <span className="xui-font-sz-80 xui-mt-half" style={{ color: 'var(--error)' }}>
                    {errors.total_quantity.message}
                  </span>
                )}
              </div>
              <div className="xui-form-box xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                <input
                  type="checkbox"
                  id="is_inventory_tracked"
                  className="xui-w-20 xui-h-20"
                  {...register('is_inventory_tracked')}
                />
                <label htmlFor="is_inventory_tracked" className="xui-mb-0">Track Inventory</label>
              </div>
              <div className="xui-form-box xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                <input
                  type="checkbox"
                  id="is_outside_town_eligible"
                  className="xui-w-20 xui-h-20"
                  {...register('is_outside_town_eligible')}
                />
                <label htmlFor="is_outside_town_eligible" className="xui-mb-0">Eligible for Outside Town Delivery</label>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-[4px]"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Updating Product...' : 'Update Product'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      {/* AddCategoryModal commented out - category field disabled
      <AddCategoryModal
        accessIds={accessIds}
        onSuccess={handleCategoryAdded}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />
      */}
    </div>
  );
};

export default EditProduct;
