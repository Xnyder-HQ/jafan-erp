import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/layout';
import { Add, Download, Edit, TrashCan, Renew } from '@carbon/icons-react';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import productsService from '../../services/products.service';
import type { Product } from '../../services/products.service';
import { Alert, showAlert, Pagination, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { DeleteModal, ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

const Products = () => {
  const navigate = useNavigate();
  const { getAccessIds } = useGeneral();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const accessIds = getAccessIds('sales-customer-management', 'products');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const handleResponse = (response: any) => {
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        setProducts(response.data);
        setTotalPages(1);
      } else {
        setProducts(response.data.rows || []);
        setTotalPages(response.data.pages || 1);
      }
    } else {
      setProducts([]);
    }
  };

  const fetchProducts = useCallback(async () => {
    if (!moduleId || !subModuleId) {
      setFetchError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await productsService.getProducts({
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      console.log(err);
      setFetchError(extractErrorMessage(err, 'Failed to fetch products. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const searchProducts = useCallback(async (query: string) => {
    if (!moduleId || !subModuleId) return;

    if (!query.trim()) {
      fetchProducts();
      return;
    }

    setLoading(true);
    setFetchError('');
    try {
      const response = await productsService.searchProducts({
        search: query,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to search products'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize, fetchProducts]);

  const filterProducts = useCallback(async (range: DateRange) => {
    if (!moduleId || !subModuleId) return;

    setLoading(true);
    setFetchError('');
    try {
      const response = await productsService.filterProducts({
        start_date: range.start_date,
        end_date: range.end_date,
        page: currentPage,
        size: pageSize,
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });

      handleResponse(response);
    } catch (err: any) {
      setFetchError(extractErrorMessage(err, 'Failed to filter products'));
      showAlert('error-alert');
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId, currentPage, pageSize]);

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    modalShow('delete-product-modal');
  };

  const handleDeleteProduct = async () => {
    if (!moduleId || !subModuleId || !selectedProduct) {
      return { success: false, message: 'Unable to delete product' };
    }

    return productsService.deleteProduct(selectedProduct.unique_id, {
      module_unique_id: moduleId,
      sub_module_unique_id: subModuleId,
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    if (value) {
      setDateFilter(null);
    }
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      searchProducts(value);
    } else {
      fetchProducts();
    }
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');
    setCurrentPage(1);
    filterProducts(range);
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    setCurrentPage(1);
    fetchProducts();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    setCurrentPage(1);
    fetchProducts();
  };

  useEffect(() => {
    if (!moduleId || !subModuleId) return;

    if (!searchQuery && !dateFilter) {
      fetchProducts();
    }
  }, [moduleId, subModuleId, currentPage, fetchProducts]);

  return (
    <div>
      <Navbar title="Products" subtitle="Manage your product catalog" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id="products"
              onFilter={handleDateFilter}
              onClear={handleClearFilter}
              isFiltered={!!dateFilter}
            />
          </div>
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
            <button
              onClick={handleRefresh}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading}
            >
              <span className="icon-container">
                <Renew size={16} />
              </span>
              Refresh
            </button>
            <button
              onClick={() => modalShow('export-products-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || products.length === 0}
            >
              <span className="icon-container">
                <Download size={16} />
              </span>
              Export
            </button>
            <button onClick={() => navigate('/dashboard/sales/products/add')} className="xui-btn xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half" style={{ backgroundColor: 'var(--primary-600)', color: 'var(--secondary-700)' }}>
              <span className="icon-container">
                <Add size={16} />
              </span>
              Add Product
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading products...</p>
              </div>
            ) : fetchError ? (
              <ErrorState
                title="Failed to load products"
                message={fetchError}
                onRetry={handleRefresh}
              />
            ) : products.length === 0 ? (
              <EmptyState
                title="No products found"
                message={searchQuery || dateFilter ? "No products match your search or filter criteria." : "There are no products to display. Click 'Add Product' to create one."}
              />
            ) : (
              <table className="xui-table" xui-style="2">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.unique_id}>
                      <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                        {product.reference}
                      </td>
                      <td>{product.name}</td>
                      <td>
                        <span className="xui-badge xui-badge-blue">{product.Category?.name || 'N/A'}</span>
                      </td>
                      <td>{product.quantity}</td>
                      <td className="xui-font-w-500">{formatCurrency(product.price)}</td>
                      <td>
                        <span className={`xui-badge ${product.status === 1 ? 'xui-badge-success' : 'xui-badge-danger'}`}>
                          {product.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                          <button
                            onClick={() => navigate(`/dashboard/sales/products/edit/${product.unique_id}`)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--info-light)', border: 'none', color: 'var(--info)' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(product)}
                            className="xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-w-32 xui-h-32 xui-bdr-rad-half xui-cursor-pointer"
                            style={{ backgroundColor: 'var(--error-light)', border: 'none', color: 'var(--error)' }}
                          >
                            <TrashCan size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      <Alert id="error-alert" type="error" title="Error" message={actionError} />
      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <DeleteModal
        id="delete-product-modal"
        title="Delete Product"
        message="Are you sure you want to delete this product"
        itemName={selectedProduct?.name}
        onDelete={handleDeleteProduct}
        onSuccess={handleRefresh}
        setError={setActionError}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-products-modal"
        title="Export Products"
        fileName="products"
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'name', header: 'Name' },
          { key: 'Category.name', header: 'Category' },
          { key: 'quantity', header: 'Quantity' },
          { key: 'price', header: 'Unit Price' },
          { key: 'status', header: 'Status' },
        ]}
        data={products.map((p) => ({
          ...p,
          status: p.status === 1 ? 'Active' : 'Inactive',
        }))}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default Products;
