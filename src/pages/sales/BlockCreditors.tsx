import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout';
import { Download, Renew, Phone } from '@carbon/icons-react';
import { formatCurrency, formatDate, extractErrorMessage } from '../../utils/formatters';
import { useGeneral } from '../../context/GeneralContext';
import salesOrdersService from '../../services/salesOrders.service';
import invoicesService from '../../services/invoices.service';
import type { SalesOrder } from '../../services/salesOrders.service';
import type { Invoice } from '../../services/invoices.service';
import { Alert, showAlert, EmptyState, ErrorState, SearchInput, DateRangeFilter } from '../../components/common';
import { ExportModal } from '../../components/modals';
import { modalShow } from '@richaadgigi/stylexui';

interface DateRange {
  start_date: string;
  end_date: string;
}

type TabType = 'blocks' | 'creditors';

const BlockCreditors = () => {
  const { getAccessIds } = useGeneral();
  const [activeTab, setActiveTab] = useState<TabType>('blocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange | null>(null);

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoicesError, setInvoicesError] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const salesOrderAccessIds = getAccessIds('sales-customer-management', 'sales-orders');
  const salesOrderModuleId = salesOrderAccessIds?.module_unique_id;
  const salesOrderSubModuleId = salesOrderAccessIds?.sub_module_unique_id;
  const invoiceAccessIds = getAccessIds('sales-customer-management', 'invoices');
  const invoiceModuleId = invoiceAccessIds?.module_unique_id;
  const invoiceSubModuleId = invoiceAccessIds?.sub_module_unique_id;

  const fetchOrders = useCallback(async () => {
    if (!salesOrderModuleId || !salesOrderSubModuleId) {
      setOrdersError('You do not have access to this module');
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    setOrdersError('');
    try {
      const response = await salesOrdersService.getSalesOrders({
        page: 1,
        size: 100,
        module_unique_id: salesOrderModuleId,
        sub_module_unique_id: salesOrderSubModuleId,
      });

      if (response.success && response.data) {
        const allOrders = Array.isArray(response.data) ? response.data : response.data.rows || [];
        
        const pendingDeliveries = allOrders.filter(
          (order: SalesOrder) =>
            order.total_items_ordered > order.total_items_dropped &&
            order.order_status?.toLowerCase() !== 'cancelled'
        );
        setOrders(pendingDeliveries);
        setFilteredOrders(pendingDeliveries);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (err: any) {
      setOrdersError(extractErrorMessage(err, 'Failed to fetch sales orders'));
    } finally {
      setLoadingOrders(false);
    }
  }, [salesOrderModuleId, salesOrderSubModuleId]);

  const fetchInvoices = useCallback(async () => {
    if (!invoiceModuleId || !invoiceSubModuleId) {
      setInvoicesError('You do not have access to this module');
      setLoadingInvoices(false);
      return;
    }

    setLoadingInvoices(true);
    setInvoicesError('');
    try {
      const response = await invoicesService.getInvoices({
        page: 1,
        size: 100,
        module_unique_id: invoiceModuleId,
        sub_module_unique_id: invoiceSubModuleId,
      });

      if (response.success && response.data) {
        const allInvoices = Array.isArray(response.data) ? response.data : response.data.rows || [];
        const outstandingInvoices = allInvoices.filter(
          (invoice: Invoice) =>
            invoice.balance_due > 0 &&
            invoice.invoice_status?.toLowerCase() !== 'cancelled'
        );
        setInvoices(outstandingInvoices);
        setFilteredInvoices(outstandingInvoices);
      } else {
        setInvoices([]);
        setFilteredInvoices([]);
      }
    } catch (err: any) {
      setInvoicesError(extractErrorMessage(err, 'Failed to fetch invoices'));
    } finally {
      setLoadingInvoices(false);
    }
  }, [invoiceModuleId, invoiceSubModuleId]);

  useEffect(() => {
    fetchOrders();
    fetchInvoices();
  }, [fetchOrders, fetchInvoices]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = orders.filter(order =>
      order.Customer?.name?.toLowerCase().includes(query) ||
      order.Customer?.phone_number?.includes(query) ||
      order.reference?.toLowerCase().includes(query)
    );
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInvoices(invoices);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = invoices.filter(invoice =>
      invoice.Customer?.name?.toLowerCase().includes(query) ||
      invoice.Customer?.phone_number?.includes(query) ||
      invoice.SalesOrder?.reference?.toLowerCase().includes(query)
    );
    setFilteredInvoices(filtered);
  }, [searchQuery, invoices]);

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilter(null);
    if (activeTab === 'blocks') {
      fetchOrders();
    } else {
      fetchInvoices();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleDateFilter = (range: DateRange) => {
    setDateFilter(range);
    setSearchQuery('');

    if (activeTab === 'blocks') {
      const filtered = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const startDate = new Date(range.start_date);
        const endDate = new Date(range.end_date);
        endDate.setHours(23, 59, 59, 999);
        return orderDate >= startDate && orderDate <= endDate;
      });
      setFilteredOrders(filtered);
    } else {
      const filtered = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        const startDate = new Date(range.start_date);
        const endDate = new Date(range.end_date);
        endDate.setHours(23, 59, 59, 999);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
      setFilteredInvoices(filtered);
    }
  };

  const handleClearFilter = () => {
    setDateFilter(null);
    if (activeTab === 'blocks') {
      setFilteredOrders(orders);
    } else {
      setFilteredInvoices(invoices);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
    setDateFilter(null);
  };

  const totalBlocksOrdered = filteredOrders.reduce((sum, order) => sum + order.total_items_ordered, 0);
  const totalBlocksSupplied = filteredOrders.reduce((sum, order) => sum + order.total_items_dropped, 0);
  const totalBlocksOutstanding = totalBlocksOrdered - totalBlocksSupplied;

  const totalAmountDue = filteredInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const totalAmountPaid = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount_paid, 0);
  const totalBalanceDue = filteredInvoices.reduce((sum, invoice) => sum + invoice.balance_due, 0);

  const loading = activeTab === 'blocks' ? loadingOrders : loadingInvoices;
  const error = activeTab === 'blocks' ? ordersError : invoicesError;

  return (
    <div>
      <Navbar title="Blocks & Creditors" subtitle="Track pending deliveries and outstanding payments" />

      <div className="xui-py-1-half">
        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1 xui-mb-1-half">
          <button
            onClick={() => handleTabChange('blocks')}
            className={`xui-btn xui-font-sz-85 xui-bdr-rad-half xui-font-w-500`}
            style={{
              backgroundColor: activeTab === 'blocks' ? 'var(--primary-600)' : 'transparent',
              color: activeTab === 'blocks' ? 'var(--secondary-700)' : 'var(--neutral-700)',
              border: activeTab === 'blocks' ? 'none' : '1px solid var(--neutral-300)',
            }}
          >
            Blocks Owed
            {orders.length > 0 && (
              <span
                className="xui-ml-half xui-px-half xui-bdr-rad-half xui-font-sz-75"
                style={{
                  backgroundColor: activeTab === 'blocks' ? 'rgba(255,255,255,0.2)' : 'var(--error-light)',
                  color: activeTab === 'blocks' ? 'var(--secondary-700)' : 'var(--error)'
                }}
              >
                {orders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('creditors')}
            className={`xui-btn xui-font-sz-85 xui-bdr-rad-half xui-font-w-500`}
            style={{
              backgroundColor: activeTab === 'creditors' ? 'var(--primary-600)' : 'transparent',
              color: activeTab === 'creditors' ? 'var(--secondary-700)' : 'var(--neutral-700)',
              border: activeTab === 'creditors' ? 'none' : '1px solid var(--neutral-300)',
            }}
          >
            Creditors
            {invoices.length > 0 && (
              <span
                className="xui-ml-half xui-px-half xui-bdr-rad-half xui-font-sz-75"
                style={{
                  backgroundColor: activeTab === 'creditors' ? 'rgba(255,255,255,0.2)' : 'var(--error-light)',
                  color: activeTab === 'creditors' ? 'var(--secondary-700)' : 'var(--error)'
                }}
              >
                {invoices.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'blocks' ? (
          <div
            className="xui-bg-white xui-p-1 xui-bdr-rad-half xui-mb-1-half"
            style={{ border: '1px solid var(--neutral-200)' }}
          >
            <div className="xui-d-grid xui-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1">
              <div>
                <p className="xui-font-sz-75 xui-opacity-6">Total Orders</p>
                <p className="xui-font-sz-120 xui-font-w-bold" style={{ color: 'var(--neutral-900)' }}>
                  {filteredOrders.length}
                </p>
              </div>
              <div>
                <p className="xui-font-sz-75 xui-opacity-6">Items Ordered</p>
                <p className="xui-font-sz-120 xui-font-w-bold" style={{ color: 'var(--neutral-900)' }}>
                  {totalBlocksOrdered.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="xui-font-sz-75 xui-opacity-6">Items Supplied</p>
                <p className="xui-font-sz-120 xui-font-w-bold" style={{ color: 'var(--success)' }}>
                  {totalBlocksSupplied.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="xui-font-sz-75 xui-opacity-6">Items Outstanding</p>
                <p className="xui-font-sz-120 xui-font-w-bold" style={{ color: 'var(--error)' }}>
                  {totalBlocksOutstanding.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="xui-bg-white xui-p-1 xui-bdr-rad-half xui-mb-1-half"
            style={{ border: '1px solid var(--neutral-200)' }}
          >
            <div className="xui-d-grid xui-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1">
              <div>
                <p className="xui-font-sz-75 xui-opacity-6">Total Invoices</p>
                <p className="xui-font-sz-120 xui-font-w-bold" style={{ color: 'var(--neutral-900)' }}>
                  {filteredInvoices.length}
                </p>
              </div>
              <div>
                <p className="xui-font-sz-75 xui-opacity-6">Total Amount</p>
                <p className="xui-font-sz-120 xui-font-w-bold" style={{ color: 'var(--neutral-900)' }}>
                  {formatCurrency(totalAmountDue)}
                </p>
              </div>
              <div>
                <p className="xui-font-sz-75 xui-opacity-6">Amount Paid</p>
                <p className="xui-font-sz-120 xui-font-w-bold" style={{ color: 'var(--success)' }}>
                  {formatCurrency(totalAmountPaid)}
                </p>
              </div>
              <div>
                <p className="xui-font-sz-75 xui-opacity-6">Balance Due</p>
                <p className="xui-font-sz-120 xui-font-w-bold" style={{ color: 'var(--error)' }}>
                  {formatCurrency(totalBalanceDue)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="xui-d-flex xui-flex-ai-center xui-flex-jc-space-between xui-mb-1-half">
          <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
            <SearchInput
              placeholder={activeTab === 'blocks' ? "Search by customer or reference..." : "Search by customer or invoice..."}
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              width="300px"
            />
            <DateRangeFilter
              id={`block-creditors-${activeTab}`}
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
              onClick={() => modalShow(activeTab === 'blocks' ? 'export-blocks-modal' : 'export-creditors-modal')}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
              disabled={loading || (activeTab === 'blocks' ? filteredOrders.length === 0 : filteredInvoices.length === 0)}
            >
              <span className="icon-container">
                <Download size={16} />
              </span>
              Export Report
            </button>
          </div>
        </div>

        <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
          <div className="xui-table-responsive">
            {loading ? (
              <div className="xui-py-3 xui-text-center">
                <p>Loading {activeTab === 'blocks' ? 'orders' : 'invoices'}...</p>
              </div>
            ) : error ? (
              <ErrorState
                title={`Failed to load ${activeTab === 'blocks' ? 'orders' : 'invoices'}`}
                message={error}
                onRetry={handleRefresh}
              />
            ) : activeTab === 'blocks' ? (
              filteredOrders.length === 0 ? (
                <EmptyState
                  title="No pending deliveries"
                  message={searchQuery || dateFilter ? "No orders match your search or filter criteria." : "All orders have been fully delivered."}
                />
              ) : (
                <table className="xui-table" xui-style="2">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Items Ordered</th>
                      <th>Items Supplied</th>
                      <th>Items Outstanding</th>
                      <th>Status</th>
                      <th>Order Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.unique_id}>
                        <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                          {order.reference}
                        </td>
                        <td className="xui-font-w-500">
                          {order.Customer?.name || 'N/A'}
                        </td>
                        <td>
                          {order.Customer?.phone_number ? (
                            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                              <span className="icon-container" style={{ color: 'var(--neutral-400)' }}>
                                <Phone size={14} />
                              </span>
                              {order.Customer.phone_number}
                            </div>
                          ) : (
                            <span className="xui-opacity-5">N/A</span>
                          )}
                        </td>
                        <td>{order.total_items_ordered.toLocaleString()}</td>
                        <td style={{ color: 'var(--success)' }}>
                          {order.total_items_dropped.toLocaleString()}
                        </td>
                        <td className="xui-font-w-bold" style={{ color: 'var(--error)' }}>
                          {(order.total_items_ordered - order.total_items_dropped).toLocaleString()}
                        </td>
                        <td>
                          <span
                            className="xui-badge"
                            style={{
                              backgroundColor: order.order_status?.toLowerCase() === 'approved'
                                ? 'var(--info-light)'
                                : order.order_status?.toLowerCase() === 'pending'
                                ? 'var(--warning-light)'
                                : 'var(--neutral-200)',
                              color: order.order_status?.toLowerCase() === 'approved'
                                ? 'var(--info)'
                                : order.order_status?.toLowerCase() === 'pending'
                                ? 'var(--warning)'
                                : 'var(--neutral-700)'
                            }}
                          >
                            {order.order_status || 'Unknown'}
                          </span>
                        </td>
                        <td className="xui-opacity-7 xui-font-sz-80">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              filteredInvoices.length === 0 ? (
                <EmptyState
                  title="No outstanding payments"
                  message={searchQuery || dateFilter ? "No invoices match your search or filter criteria." : "All invoices have been fully paid."}
                />
              ) : (
                <table className="xui-table" xui-style="2">
                  <thead>
                    <tr>
                      <th>Invoice Ref</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Total Amount</th>
                      <th>Amount Paid</th>
                      <th>Balance Due</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.unique_id}>
                        <td className="xui-font-w-500" style={{ color: 'var(--primary-600)' }}>
                          {invoice.SalesOrder?.reference || 'N/A'}
                        </td>
                        <td className="xui-font-w-500">
                          {invoice.Customer?.name || 'N/A'}
                        </td>
                        <td>
                          {invoice.Customer?.phone_number ? (
                            <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-half">
                              <span className="icon-container" style={{ color: 'var(--neutral-400)' }}>
                                <Phone size={14} />
                              </span>
                              {invoice.Customer.phone_number}
                            </div>
                          ) : (
                            <span className="xui-opacity-5">N/A</span>
                          )}
                        </td>
                        <td className="xui-font-w-500">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td style={{ color: 'var(--success)' }}>
                          {formatCurrency(invoice.amount_paid)}
                        </td>
                        <td className="xui-font-w-bold" style={{ color: 'var(--error)' }}>
                          {formatCurrency(invoice.balance_due)}
                        </td>
                        <td>
                          <span
                            className="xui-badge"
                            style={{
                              backgroundColor: invoice.invoice_status?.toLowerCase() === 'unpaid'
                                ? 'var(--warning-light)'
                                : invoice.invoice_status?.toLowerCase() === 'partially_paid'
                                ? 'var(--info-light)'
                                : 'var(--neutral-200)',
                              color: invoice.invoice_status?.toLowerCase() === 'unpaid'
                                ? 'var(--warning)'
                                : invoice.invoice_status?.toLowerCase() === 'partially_paid'
                                ? 'var(--info)'
                                : 'var(--neutral-700)'
                            }}
                          >
                            {invoice.invoice_status?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                        <td className="xui-opacity-7 xui-font-sz-80">
                          {formatDate(invoice.due_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>

      <Alert id="success-alert" type="success" title="Success" message={successMessage} />

      <ExportModal
        id="export-blocks-modal"
        title="Export Blocks Report"
        fileName="blocks-owed-report"
        columns={[
          { key: 'reference', header: 'Reference' },
          { key: 'Customer.name', header: 'Customer' },
          { key: 'Customer.phone_number', header: 'Phone' },
          { key: 'total_items_ordered', header: 'Items Ordered' },
          { key: 'total_items_dropped', header: 'Items Supplied' },
          { key: 'order_status', header: 'Status' },
          { key: 'createdAt', header: 'Order Date' },
        ]}
        data={filteredOrders.map(order => ({
          ...order,
          items_outstanding: order.total_items_ordered - order.total_items_dropped
        }))}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />

      <ExportModal
        id="export-creditors-modal"
        title="Export Creditors Report"
        fileName="creditors-report"
        columns={[
          { key: 'SalesOrder.reference', header: 'Invoice Ref' },
          { key: 'Customer.name', header: 'Customer' },
          { key: 'Customer.phone_number', header: 'Phone' },
          { key: 'total_amount', header: 'Total Amount' },
          { key: 'amount_paid', header: 'Amount Paid' },
          { key: 'balance_due', header: 'Balance Due' },
          { key: 'invoice_status', header: 'Status' },
          { key: 'due_date', header: 'Due Date' },
        ]}
        data={filteredInvoices}
        setSuccessMessage={setSuccessMessage}
        showAlert={showAlert}
      />
    </div>
  );
};

export default BlockCreditors;
