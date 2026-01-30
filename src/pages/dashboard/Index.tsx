import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard, QuickActions } from '../../components/overview';
import {
  Money,
  ShoppingCart,
  Purchase,
  UserMultiple,
  Renew,
} from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { GeneralStats } from '../../services/analytics.service';
import { formatCurrency } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/formatters';

const Dashboard = () => {
  const { user, acls } = useGeneral();
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const moduleId = acls.length > 0 ? acls[0].module_unique_id : '';
  const userRole = acls[0]?.Role?.name || 'User';
  const isAdministrator = userRole.toLowerCase() === 'administrator';

  const fetchStats = useCallback(async () => {
    if (!isAdministrator) {
      setLoading(false);
      return;
    }

    if (!moduleId) {
      setError('No module access found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await analyticsService.getGeneralStats({ module_unique_id: moduleId });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load dashboard stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, isAdministrator]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getTodayTotal = (dailyData: { date: string; total_amount?: number }[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = dailyData.find((d) => d.date === today);
    return todayEntry?.total_amount || 0;
  };

  const todaySales = stats ? getTodayTotal(stats.daily_sales_orders) : 0;

  return (
    <div>
      <Navbar title="Dashboard" />

      <div className="xui-py-1-half">
        <div className="xui-mb-1-half">
          <h2 className="xui-font-sz-120 xui-font-w-600" style={{ color: 'var(--neutral-800)' }}>
            Welcome back, <span style={{ color: 'var(--primary-600)' }}>{userRole} {user?.fullname?.split(' ')[0] || 'User'}</span>!
          </h2>
          <p className="xui-font-sz-90 xui-mt-half" style={{ color: 'var(--neutral-500)' }}>
            Here's what's happening today.
          </p>
        </div>

        {!isAdministrator ? (
          <div className="xui-py-3 xui-text-center xui-bg-white xui-bdr-rad-half" style={{ border: '1px solid var(--neutral-200)' }}>
            <p className="xui-font-sz-90 xui-opacity-6">You do not have access to view the dashboard data.</p>
            <p className="xui-font-sz-80 xui-opacity-5 xui-mt-half">Please contact an administrator if you believe this is an error.</p>
          </div>
        ) : loading ? (
          <div className="xui-py-3 xui-text-center">
            <p>Loading dashboard...</p>
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
                title="Today's Sales"
                value={todaySales}
                prefix="₦"
                icon={<Money size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
                useCompact
              />
              <MetricCard
                title="Total Sales Orders"
                value={stats.total_sales_orders}
                suffix="orders"
                icon={<ShoppingCart size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
              <MetricCard
                title="Total Customers"
                value={stats.total_customers}
                suffix="customers"
                icon={<UserMultiple size={24} />}
                iconBgColor="var(--success-light)"
                iconColor="var(--success)"
              />
              <MetricCard
                title="Total Vendors"
                value={stats.total_vendors}
                suffix="vendors"
                icon={<Purchase size={24} />}
                iconBgColor="var(--warning-light)"
                iconColor="var(--warning)"
              />
            </div>

            <div className="xui-mb-1-half">
              <QuickActions />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-lg-grid-col-2 xui-grid-gap-1-half xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Daily Sales Trend</h3>
                </div>
                <div className="xui-p-1">
                  {stats.daily_sales_orders.length > 0 ? (
                    <Chart
                      type={stats.daily_sales_orders.length > 1 ? 'line' : 'bar'}
                      height={280}
                      series={[{
                        name: 'Sales Amount',
                        data: stats.daily_sales_orders.map((d) => Number(d.total_amount) || 0),
                      }]}
                      options={{
                        chart: { toolbar: { show: false }, zoom: { enabled: false } },
                        xaxis: {
                          categories: stats.daily_sales_orders.map((d) => d.date),
                          labels: { style: { fontSize: '11px' }, rotate: -45, rotateAlways: stats.daily_sales_orders.length > 7 },
                        },
                        yaxis: {
                          labels: {
                            formatter: (val: number) => val >= 1000000 ? `₦${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `₦${(val / 1000).toFixed(0)}K` : `₦${val}`,
                          },
                        },
                        dataLabels: { enabled: false },
                        stroke: { curve: 'smooth', width: 3 },
                        colors: ['#4361ee'],
                        markers: { size: 4 },
                        plotOptions: { bar: { columnWidth: '35%', borderRadius: 4 } },
                        tooltip: { y: { formatter: (val: number) => `₦${val.toLocaleString()}` } },
                        grid: { borderColor: '#e5e7eb' },
                      }}
                    />
                  ) : (
                    <div className="xui-py-2 xui-text-center">
                      <p className="xui-opacity-5 xui-font-sz-85">No sales data available</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Daily Activity</h3>
                </div>
                <div className="xui-p-1">
                  {stats.daily_invoices.length > 0 || stats.daily_fuel_purchases.length > 0 || stats.daily_expenses.length > 0 ? (
                    <Chart
                      type="bar"
                      height={280}
                      series={[
                        { name: 'Invoices', data: stats.daily_invoices.map((d) => d.total_count) },
                        { name: 'Fuel Purchases', data: stats.daily_fuel_purchases.map((d) => d.total_count) },
                        { name: 'Expenses', data: stats.daily_expenses.map((d) => d.total_count) },
                      ]}
                      options={{
                        chart: { toolbar: { show: false }, zoom: { enabled: false } },
                        xaxis: {
                          categories: stats.daily_invoices.map((d) => d.date),
                          labels: { style: { fontSize: '11px' }, rotate: -45, rotateAlways: stats.daily_invoices.length > 7 },
                        },
                        dataLabels: { enabled: false },
                        colors: ['#3b82f6', '#f59e0b', '#ef4444'],
                        plotOptions: { bar: { columnWidth: '35%', borderRadius: 3 } },
                        grid: { borderColor: '#e5e7eb' },
                        legend: { position: 'top', fontSize: '12px' },
                      }}
                    />
                  ) : (
                    <div className="xui-py-2 xui-text-center">
                      <p className="xui-opacity-5 xui-font-sz-85">No activity data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Sales Summary</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Total Sales Amount</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{formatCurrency(stats.total_sales_order_amount)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Total Invoices</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_invoices.toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Invoice Amount</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{formatCurrency(stats.total_invoice_amount)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Total Products</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_products.toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Total Discounts</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_discounts.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Procurement Summary</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Purchase Orders</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_purchase_orders.toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Total Expenses</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--error)' }}>{formatCurrency(stats.total_expense_amount)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Fuel Purchases</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_fuel_purchases.toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Fuel Cost</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{formatCurrency(stats.total_fuel_purchase_cost)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Fuel Liters</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_fuel_purchase_liters.toLocaleString()}L</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Operations Summary</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Production Batches</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_production_batches.toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Delivery Assignments</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_delivery_assignments.toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Raw Materials</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_raw_materials.toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Finished Goods</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_finished_goods.toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Total Users</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{stats.total_users.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
