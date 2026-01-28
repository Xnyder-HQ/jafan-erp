import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Renew, Purchase, Money, GasStation, UserMultiple } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { ProcurementStats } from '../../services/analytics.service';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';

const ProcurementOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<ProcurementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('procurement-vendor-management', 'procurement-vendor-management-overview');
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
      const response = await analyticsService.getProcurementStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load procurement stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load procurement stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Navbar title="Procurement Overview" subtitle="Procurement & Vendor Management analytics" />

      <div className="xui-py-1-half">
        {loading ? (
          <div className="xui-py-3 xui-text-center">
            <p>Loading procurement analytics...</p>
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
                title="Total Vendors"
                value={stats.total_vendors}
                icon={<UserMultiple size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
              <MetricCard
                title="Purchase Orders"
                value={stats.total_purchase_orders}
                icon={<Purchase size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
              <MetricCard
                title="Total Expenses"
                value={stats.total_expense_amount}
                prefix="₦"
                icon={<Money size={24} />}
                iconBgColor="var(--error-light)"
                iconColor="var(--error)"
                useCompact
              />
              <MetricCard
                title="Fuel Purchases"
                value={stats.total_fuel_purchases}
                icon={<GasStation size={24} />}
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
                      <span className="xui-font-sz-85 xui-opacity-6">Total Vendor Spend</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{formatCurrency(stats.total_vendor_spend ?? 0)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">PO Amount Paid</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{formatCurrency(stats.total_purchase_order_amount_paid ?? 0)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">PO Balance Due</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--error)' }}>{formatCurrency(stats.total_purchase_order_balance_due ?? 0)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Vendor Payments</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{formatCurrency(stats.total_vendor_payment_amount_paid ?? 0)}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Fuel Total Cost</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{formatCurrency(stats.total_fuel_purchase_total_cost ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>PO by Payment Status</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_purchase_order_via_payment_status.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_purchase_order_via_payment_status.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_purchase_order_via_payment_status.map((item) => item.payment_status),
                        colors: ['#4361ee', '#06d6a0', '#fca311', '#f72585', '#8338ec', '#3a86ff'],
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
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Expenses by Category</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_expense_via_category.length > 0 ? (
                    <Chart
                      type="bar"
                      height={250}
                      series={[{
                        name: 'Amount',
                        data: stats.total_expense_via_category.map((item) => item.total_amount),
                      }]}
                      options={{
                        chart: { toolbar: { show: false } },
                        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
                        xaxis: {
                          categories: stats.total_expense_via_category.map((item) => item.category),
                          labels: {
                            formatter: (val: string) => {
                              const num = Number(val);
                              return num >= 1000000 ? `₦${(num / 1000000).toFixed(1)}M` : num >= 1000 ? `₦${(num / 1000).toFixed(0)}K` : `₦${num}`;
                            },
                          },
                        },
                        yaxis: {
                          labels: { style: { fontSize: '11px' } },
                        },
                        colors: ['#ef4444'],
                        dataLabels: { enabled: false },
                        grid: { borderColor: '#e5e7eb' },
                        tooltip: { y: { formatter: (val: number) => `₦${val.toLocaleString()}` } },
                      }}
                    />
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Fuel by Type</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_fuel_purchase_via_fuel_type.length > 0 ? (
                    <>
                      <Chart
                        type="donut"
                        height={220}
                        series={stats.total_fuel_purchase_via_fuel_type.map((item) => item.total_count)}
                        options={{
                          labels: stats.total_fuel_purchase_via_fuel_type.map((item) => item.fuel_type),
                          colors: ['#f59e0b', '#3b82f6', '#8338ec', '#06d6a0'],
                          legend: { position: 'bottom', fontSize: '12px' },
                          dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                          plotOptions: { pie: { donut: { size: '55%' } } },
                        }}
                      />
                      <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center xui-mt-1">
                        <span className="xui-font-sz-85 xui-opacity-6">Total Liters</span>
                        <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_fuel_purchase_liters_purchased ?? 0).toLocaleString()}L</span>
                      </div>
                    </>
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>PO Delivery Status</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_purchase_order_via_delivery_status.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_purchase_order_via_delivery_status.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_purchase_order_via_delivery_status.map((item) => item.delivery_status),
                        colors: ['#06d6a0', '#fca311', '#f72585', '#4361ee', '#8338ec'],
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
            {stats.purchaseOrderDateAnalysisDaily.length > 0 && (
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Daily Purchase Orders</h3>
                </div>
                <div className="xui-p-1">
                  <Chart
                    type={stats.purchaseOrderDateAnalysisDaily.length > 1 ? 'line' : 'bar'}
                    height={280}
                    series={[{
                      name: 'Purchase Orders',
                      data: stats.purchaseOrderDateAnalysisDaily.map((d) => d.total_count),
                    }]}
                    options={{
                      chart: { toolbar: { show: false }, zoom: { enabled: false } },
                      xaxis: {
                        categories: stats.purchaseOrderDateAnalysisDaily.map((d) => d.date),
                        labels: { style: { fontSize: '11px' }, rotate: -45, rotateAlways: stats.purchaseOrderDateAnalysisDaily.length > 7 },
                      },
                      dataLabels: { enabled: false },
                      stroke: { curve: 'smooth', width: 3 },
                      colors: ['#4361ee'],
                      markers: { size: 4 },
                      plotOptions: { bar: { columnWidth: '35%', borderRadius: 4 } },
                      grid: { borderColor: '#e5e7eb' },
                    }}
                  />
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProcurementOverview;
