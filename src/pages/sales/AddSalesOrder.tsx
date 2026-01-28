import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { ArrowLeft, Add, TrashCan } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';
import salesOrdersService from '../../services/salesOrders.service';
import customersService, { type Customer } from '../../services/customers.service';
import productsService, { type Product } from '../../services/products.service';
import { Alert, showAlert } from '../../components/common';

interface OrderItemForm {
  product_unique_id: string;
  quantity_ordered: number;
}

interface SalesOrderForm {
  customer_unique_id: string;
  outside_town: boolean;
  outside_town_location: string;
  outside_town_surcharge: number;
  estimated_trip_liters: number;
  notes: string;
  items: OrderItemForm[];
}

const AddSalesOrder = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const accessIds = getAccessIds('sales-customer-management', 'sales-orders');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const productAccessIds = getAccessIds('sales-customer-management', 'products');
  const productModuleId = productAccessIds?.module_unique_id;
  const productSubModuleId = productAccessIds?.sub_module_unique_id;

  const customerAccessIds = getAccessIds('sales-customer-management', 'customers');
  const customerModuleId = customerAccessIds?.module_unique_id;
  const customerSubModuleId = customerAccessIds?.sub_module_unique_id;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SalesOrderForm>({
    defaultValues: {
      customer_unique_id: '',
      outside_town: false,
      outside_town_location: '',
      outside_town_surcharge: 0,
      estimated_trip_liters: 0,
      notes: '',
      items: [{ product_unique_id: '', quantity_ordered: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const watchOutsideTown = watch('outside_town');
  // const watchSurcharge = watch('outside_town_surcharge') || 0;

  const calculateItemTotal = (item: OrderItemForm): number => {
    const product = products.find((p) => p.unique_id === item.product_unique_id);
    if (!product) return 0;
    return product.price * (item.quantity_ordered || 0);
  };

  const getSubtotal = (): number => {
    return watchItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const getGrandTotal = (): number => {
    const subtotal = getSubtotal();
    // const surcharge = watchOutsideTown ? watchSurcharge : 0;
    return subtotal;
  };

  const getTotalItemsOrdered = (): number => {
    return watchItems.reduce((sum, item) => sum + (item.quantity_ordered || 0), 0);
  };

  const fetchCustomers = useCallback(async () => {
    if (!customerModuleId || !customerSubModuleId) return;

    try {
      const response = await customersService.getCustomers({
        page: 1,
        size: 100,
        module_unique_id: customerModuleId,
        sub_module_unique_id: customerSubModuleId,
      });

      if (response.success && response.data && 'rows' in response.data) {
        setCustomers(response.data.rows);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  }, [customerModuleId, customerSubModuleId]);

  const fetchProducts = useCallback(async () => {
    if (!productModuleId || !productSubModuleId) return;

    try {
      const response = await productsService.getProducts({
        page: 1,
        size: 100,
        module_unique_id: productModuleId,
        sub_module_unique_id: productSubModuleId,
      });

      if (response.success && response.data && 'rows' in response.data) {
        setProducts(response.data.rows);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, [productModuleId, productSubModuleId]);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      await Promise.all([fetchCustomers(), fetchProducts()]);
      setLoadingData(false);
    };
    loadData();
  }, [fetchCustomers, fetchProducts]);

  const onSubmit = async (data: SalesOrderForm) => {
    if (!moduleId || !subModuleId) {
      setError('You do not have access to this module');
      showAlert('error-alert');
      return;
    }

    const validItems = data.items.filter((item) => item.product_unique_id && item.quantity_ordered > 0);
    if (validItems.length === 0) {
      setError('Please add at least one valid order item');
      showAlert('error-alert');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customer_unique_id: data.customer_unique_id,
        outside_town: data.outside_town,
        outside_town_location: data.outside_town ? data.outside_town_location : undefined,
        // outside_town_surcharge: data.outside_town ? data.outside_town_surcharge : undefined,
        estimated_trip_liters: data.estimated_trip_liters || undefined,
        notes: data.notes || undefined,
        items: validItems.map((item) => ({
          product_unique_id: item.product_unique_id,
          quantity_ordered: item.quantity_ordered,
        })),
      };

      const response = await salesOrdersService.addSalesOrder(payload, {
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      if (response.success) {
        setSuccessMessage('Sales order created successfully');
        showAlert('success-alert');
        setTimeout(() => {
          navigate('/dashboard/sales/orders');
        }, 1500);
      } else {
        setError(response.message || 'Failed to create sales order');
        showAlert('error-alert');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to create sales order'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  };

  const getProductPrice = (productId: string): number => {
    const product = products.find((p) => p.unique_id === productId);
    return product?.price || 0;
  };

  if (loadingData) {
    return (
      <div>
        <Navbar title="Create Sales Order" subtitle="Create a new sales order" />
        <div className="xui-py-3 xui-text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Create Sales Order" subtitle="Create a new sales order" />
      <div className="xui-py-1">
        <a
          onClick={() => navigate(-1)}
          className="xui-w-40 xui-h-40 xui-bdr-rad-circle xui-bg-light xui-text-inherit xui-d-inline-flex xui-flex-ai-center xui-flex-jc-center xui-mb-1 xui-cursor-pointer"
        >
          <span className="icon-container">
            <ArrowLeft size={20} />
          </span>
        </a>

        <p className="xui-font-sz-80 xui-opacity-6">
          Fill in the order details below. Fields marked with * are required.
        </p>
        <hr className="xui-my-2" />

        <form onSubmit={handleSubmit(onSubmit)} className="xui-form">
          <div className="xui-d-grid xui-grid-col-1 xui-lg-grid-col-2 xui-grid-gap-2">
            <div>
              <div className="xui-form-box">
                <label htmlFor="customer_unique_id">Customer *</label>
                <select
                  id="customer_unique_id"
                  {...register('customer_unique_id', { required: 'Customer is required' })}
                  className={errors.customer_unique_id ? 'xui-bdr-red' : ''}
                >
                  <option value="">--Select customer--</option>
                  {customers.map((customer) => (
                    <option key={customer.unique_id} value={customer.unique_id}>
                      {customer.name} ({customer.reference})
                    </option>
                  ))}
                </select>
                {errors.customer_unique_id && (
                  <span className="xui-font-sz-80 xui-text-red">{errors.customer_unique_id.message}</span>
                )}
              </div>

              <div className="xui-form-box">
                <label className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                  <input
                    type="checkbox"
                    {...register('outside_town')}
                    style={{ width: 'auto' }}
                  />
                  <span>Outside Town Delivery</span>
                </label>
              </div>

              {watchOutsideTown && (
                <>
                  <div className="xui-form-box">
                    <label htmlFor="outside_town_location">Outside Town Location *</label>
                    <input
                      type="text"
                      id="outside_town_location"
                      placeholder="Enter delivery location"
                      {...register('outside_town_location', {
                        required: watchOutsideTown ? 'Location is required for outside town delivery' : false,
                      })}
                      className={errors.outside_town_location ? 'xui-bdr-red' : ''}
                    />
                    {errors.outside_town_location && (
                      <span className="xui-font-sz-80 xui-text-red">{errors.outside_town_location.message}</span>
                    )}
                  </div>

                  {/*
                  <div className="xui-form-box">
                    <label htmlFor="outside_town_surcharge">Outside Town Surcharge *</label>
                    <input
                      type="number"
                      id="outside_town_surcharge"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      {...register('outside_town_surcharge', {
                        required: watchOutsideTown ? 'Surcharge is required for outside town delivery' : false,
                        valueAsNumber: true,
                        min: { value: 0, message: 'Surcharge cannot be negative' },
                      })}
                      className={errors.outside_town_surcharge ? 'xui-bdr-red' : ''}
                    />
                    {errors.outside_town_surcharge && (
                      <span className="xui-font-sz-80 xui-text-red">{errors.outside_town_surcharge.message}</span>
                    )}
                  </div>
                  */}
                </>
              )}
            </div>

            <div>
              <div className="xui-form-box">
                <label htmlFor="estimated_trip_liters">Estimated Trip Liters</label>
                <input
                  type="number"
                  id="estimated_trip_liters"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  {...register('estimated_trip_liters', {
                    valueAsNumber: true,
                    min: { value: 0, message: 'Cannot be negative' },
                  })}
                  className={errors.estimated_trip_liters ? 'xui-bdr-red' : ''}
                />
                {errors.estimated_trip_liters && (
                  <span className="xui-font-sz-80 xui-text-red">{errors.estimated_trip_liters.message}</span>
                )}
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

          <hr className="xui-my-2" />
          <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1">
            <p className="xui-font-sz-90 xui-font-w-bold">Order Items</p>
            <button
              type="button"
              onClick={() => append({ product_unique_id: '', quantity_ordered: 1 })}
              className="xui-btn xui-btn-default xui-bdr-rad-half xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half"
            >
              <span className="icon-container">
                <Add size={16} />
              </span>
              <span>Add Item</span>
            </button>
          </div>

          <div
            className="xui-bdr-rad-half xui-overflow-hidden xui-mb-1"
            style={{ border: '1px solid var(--neutral-200)' }}
          >
            <div className="xui-table-responsive">
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Product *</th>
                    <th>Quantity *</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td>
                        <select
                          {...register(`items.${index}.product_unique_id` as const, {
                            required: 'Product is required',
                          })}
                          className="xui-form-input"
                          style={{ minWidth: '200px' }}
                        >
                          <option value="">--Select product--</option>
                          {products.map((product) => (
                            <option key={product.unique_id} value={product.unique_id}>
                              {product.name} ({formatCurrency(product.price)})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          {...register(`items.${index}.quantity_ordered` as const, {
                            required: 'Quantity is required',
                            valueAsNumber: true,
                            min: { value: 1, message: 'Minimum 1' },
                          })}
                          className="xui-form-input"
                          min="1"
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td className="xui-opacity-7">
                        {formatCurrency(getProductPrice(watchItems[index]?.product_unique_id || ''))}
                      </td>
                      <td className="xui-font-w-600">
                        {formatCurrency(calculateItemTotal(watchItems[index] || { product_unique_id: '', quantity_ordered: 0 }))}
                      </td>
                      <td>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="xui-w-32 xui-h-32 xui-bdr-rad-half xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', border: 'none' }}
                          >
                            <span className="icon-container">
                              <TrashCan size={14} />
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="xui-text-align-right xui-opacity-7">
                      Subtotal:
                    </td>
                    <td className="xui-font-w-500">{formatCurrency(getSubtotal())}</td>
                    <td></td>
                  </tr>
                  {/*
                  {watchOutsideTown && watchSurcharge > 0 && (
                    <tr>
                      <td colSpan={3} className="xui-text-align-right xui-opacity-7">
                        Surcharge:
                      </td>
                      <td className="xui-font-w-500">{formatCurrency(watchSurcharge)}</td>
                      <td></td>
                    </tr>
                  )}
                  */}
                  <tr>
                    <td colSpan={3} className="xui-text-align-right xui-font-w-bold">
                      Grand Total:
                    </td>
                    <td className="xui-font-w-bold xui-font-sz-90">{formatCurrency(getGrandTotal())}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="xui-text-align-right xui-opacity-7">
                      Total Items Ordered:
                    </td>
                    <td className="xui-font-w-500">{getTotalItemsOrdered()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="xui-btn xui-mt-1 xui-bdr-rad-half"
            style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </form>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={error} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />
    </div>
  );
};

export default AddSalesOrder;
