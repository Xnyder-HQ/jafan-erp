import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Renew, ShoppingCart, UserMultiple, Receipt, TagGroup, Money } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { SalesStats } from '../../services/analytics.service';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';

const SalesOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('sales-customer-management', 'sales-customer-management-overview');
  const moduleId = accessIds?.module_unique_id;
  const subModuleId = accessIds?.sub_module_unique_id;

  const fetchStats = useCallback(async () => {
    if (!moduleId) {
      setError('You do not have access to this module');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await analyticsService.getSalesStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load sales stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load sales stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Navbar title="Sales Overview" subtitle="Sales & Customer Management analytics" />

      <div className="xui-py-1-half">
        {loading ? (
          <div className="xui-py-3 xui-text-center">
            <p>Loading sales analytics...</p>
          </div>
        ) : error ? (
          <div className="xui-py-3 xui-text-center">
            <p className="xui-opacity-6 xui-mb-1">{error}</p>
            <button
              onClick={fetchStats}
              className="xui-btn xui-btn-text xui-font-sz-80 xui-bdr-rad-half xui-font-w-500 xui-d-inline-flex xui-flex-ai-center xui-grid-gap-half"
              style={{ border: '1px solid var(--neutral-300)', color: 'var(--neutral-700)' }}
            >
              <span className="icon-container"><Renew size={16} /></span>
              Retry
            </button>
          </div>
        ) : stats ? (
          <>
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-4 xui-grid-gap-1 xui-mb-1-half">
              <MetricCard
                title="Total Customers"
                value={stats.total_customers}
                icon={<UserMultiple size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
              <MetricCard
                title="Sales Orders"
                value={stats.total_sales_orders}
                icon={<ShoppingCart size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
              <MetricCard
                title="Total Invoices"
                value={stats.total_invoices}
                icon={<Receipt size={24} />}
                iconBgColor="var(--success-light)"
                iconColor="var(--success)"
              />
              <MetricCard
                title="Total Discounts"
                value={stats.total_discounts}
                icon={<TagGroup size={24} />}
                iconBgColor="var(--warning-light)"
                iconColor="var(--warning)"
              />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Financial Summary</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Customer Balances</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{formatCurrency(stats.customer_balance_sum)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Order Discounts</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--error)' }}>{formatCurrency(stats.sales_order_discount_sum)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Approved Discounts</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--error)' }}>{formatCurrency(stats.discount_sum)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Invoice Payments</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_invoice_payments.toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Total Products</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_products.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Orders by Status</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_sales_orders_via_order_status.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_sales_orders_via_order_status.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_sales_orders_via_order_status.map((item) => item.order_status),
                        colors: ['#4361ee', '#3a86ff', '#f72585', '#fca311', '#06d6a0', '#8338ec'],
                        legend: { position: 'bottom', fontSize: '12px' },
                        dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                        plotOptions: { pie: { donut: { size: '55%' } } },
                      }}
                    />
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Invoices by Status</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_invoices_via_invoice_status.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_invoices_via_invoice_status.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_invoices_via_invoice_status.map((item) => item.invoice_status),
                        colors: ['#06d6a0', '#fca311', '#f72585', '#4361ee', '#8338ec', '#3a86ff'],
                        legend: { position: 'bottom', fontSize: '12px' },
                        dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                        plotOptions: { pie: { donut: { size: '55%' } } },
                      }}
                    />
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>
            </div>

            {stats.salesOrderAnalysisDaily.length > 0 && (
              <div className="xui-mb-1-half">
                <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                  <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                    <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Daily Sales Trend</h3>
                  </div>
                  <div className="xui-p-1">
                    <Chart
                      type={stats.salesOrderAnalysisDaily.length > 1 ? 'area' : 'bar'}
                      height={280}
                      series={stats.salesOrderAnalysisDaily.length > 1 ? [
                        {
                          name: 'Sales Amount',
                          data: stats.salesOrderAnalysisDaily.map((d) => d.sales_total_amount),
                        },
                        {
                          name: 'Orders',
                          data: stats.salesOrderAnalysisDaily.map((d) => d.total_count),
                        },
                      ] : [
                        {
                          name: 'Sales Amount',
                          data: stats.salesOrderAnalysisDaily.map((d) => d.sales_total_amount),
                        },
                      ]}
                      options={{
                        chart: { toolbar: { show: false }, zoom: { enabled: false } },
                        xaxis: {
                          categories: stats.salesOrderAnalysisDaily.map((d) => d.date),
                          labels: { style: { fontSize: '11px' }, rotate: -45, rotateAlways: stats.salesOrderAnalysisDaily.length > 7 },
                        },
                        yaxis: stats.salesOrderAnalysisDaily.length > 1 ? [
                          {
                            title: { text: 'Amount' },
                            labels: { formatter: (val: number) => val >= 1000000 ? `₦${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `₦${(val / 1000).toFixed(0)}K` : `₦${val}` },
                          },
                          {
                            opposite: true,
                            title: { text: 'Orders' },
                            labels: { formatter: (val: number) => val.toFixed(0) },
                          },
                        ] : {
                          labels: {
                            formatter: (val: number) => val >= 1000000 ? `₦${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `₦${(val / 1000).toFixed(0)}K` : `₦${val}`,
                          },
                        },
                        dataLabels: { enabled: false },
                        stroke: { curve: 'smooth', width: 2 },
                        ...(stats.salesOrderAnalysisDaily.length > 1 ? { fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.1 } } } : {}),
                        colors: ['#4361ee', '#3b82f6'],
                        markers: { size: 4 },
                        grid: { borderColor: '#e5e7eb' },
                        legend: { position: 'top', fontSize: '12px' },
                        plotOptions: { bar: { columnWidth: '35%', borderRadius: 4 } },
                        tooltip: { y: { formatter: (val: number) => `₦${val.toLocaleString()}` } },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {(stats.invoiceOverdueAlerts.length > 0 || stats.customerBalanceAlerts.length > 0 || stats.excessiveDiscountAlerts.length > 0) && (
              <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1 xui-mb-1-half">
                {stats.invoiceOverdueAlerts.length > 0 && (
                  <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                    <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--error-light)' }}>
                      <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--error)' }}>
                        <span className="icon-container xui-mr-half"><Money size={16} /></span>
                        Overdue Invoices ({stats.invoiceOverdueAlerts.length})
                      </h3>
                    </div>
                    <div className="xui-p-1">
                      <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
                        {stats.invoiceOverdueAlerts.slice(0, 5).map((alert) => (
                          <div key={alert.unique_id} className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center xui-font-sz-85">
                            <span>{alert.Customer?.name || 'N/A'}</span>
                            <span className="xui-badge xui-badge-danger">{alert.days_overdue} days</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {stats.customerBalanceAlerts.length > 0 && (
                  <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                    <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--warning-light)' }}>
                      <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--warning)' }}>
                        Customer Balance Alerts ({stats.customerBalanceAlerts.length})
                      </h3>
                    </div>
                    <div className="xui-p-1">
                      <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
                        {stats.customerBalanceAlerts.slice(0, 5).map((alert) => (
                          <div key={alert.unique_id} className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center xui-font-sz-85">
                            <span>{alert.name}</span>
                            <span className="xui-font-w-600" style={{ color: 'var(--error)' }}>{formatCurrency(alert.balance)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {stats.excessiveDiscountAlerts.length > 0 && (
                  <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                    <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--warning-light)' }}>
                      <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--warning)' }}>
                        Excessive Discounts ({stats.excessiveDiscountAlerts.length})
                      </h3>
                    </div>
                    <div className="xui-p-1">
                      <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
                        {stats.excessiveDiscountAlerts.slice(0, 5).map((alert, idx) => (
                          <div key={idx} className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center xui-font-sz-85">
                            <span>{alert.User?.firstname} {alert.User?.lastname}</span>
                            <span className="xui-font-w-600" style={{ color: 'var(--error)' }}>{alert.discount_percentage.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Top Customers by Orders</h3>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Orders</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.total_sales_orders_via_customer.slice(0, 10).map((customer, idx) => (
                        <tr key={idx}>
                          <td className="xui-font-w-500">{customer.Customer?.name}</td>
                          <td>{customer.total_count}</td>
                          <td className="xui-font-w-600">{formatCurrency(customer.total_amount)}</td>
                        </tr>
                      ))}
                      {stats.total_sales_orders_via_customer.length === 0 && (
                        <tr>
                          <td colSpan={3} className="xui-text-center xui-py-2">
                            <p className="xui-opacity-5">No customer data</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Top Products by Orders</h3>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty Ordered</th>
                        <th>Qty Supplied</th>
                        <th>Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.total_sales_order_items_via_product.slice(0, 10).map((product, idx) => (
                        <tr key={idx}>
                          <td className="xui-font-w-500">{product.Product?.name}</td>
                          <td>{product.quantity_ordered.toLocaleString()}</td>
                          <td>{product.quantity_supplied.toLocaleString()}</td>
                          <td className="xui-font-w-600">{formatCurrency(product.total_price)}</td>
                        </tr>
                      ))}
                      {stats.total_sales_order_items_via_product.length === 0 && (
                        <tr>
                          <td colSpan={4} className="xui-text-center xui-py-2">
                            <p className="xui-opacity-5">No product data</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default SalesOverview;
