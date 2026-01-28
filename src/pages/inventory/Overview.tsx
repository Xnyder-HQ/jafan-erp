import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Renew, Cube, Report, Box } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { InventoryStats } from '../../services/analytics.service';
import { extractErrorMessage } from '../../utils/formatters';

const InventoryOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('inventory-stock-management', 'inventory-stock-management-overview');
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
      const response = await analyticsService.getInventoryStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load inventory stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load inventory stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Navbar title="Inventory Overview" subtitle="Inventory & Stock Management analytics" />

      <div className="xui-py-1-half">
        {loading ? (
          <div className="xui-py-3 xui-text-center">
            <p>Loading inventory analytics...</p>
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
                title="Raw Materials"
                value={stats.total_raw_materials}
                icon={<Cube size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
              <MetricCard
                title="Raw Material Logs"
                value={stats.total_raw_material_stock_logs}
                icon={<Report size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
              <MetricCard
                title="Finished Goods"
                value={stats.total_finished_goods}
                icon={<Box size={24} />}
                iconBgColor="var(--success-light)"
                iconColor="var(--success)"
              />
              <MetricCard
                title="Finished Good Logs"
                value={stats.total_finished_good_stock_logs}
                icon={<Report size={24} />}
                iconBgColor="var(--warning-light)"
                iconColor="var(--warning)"
              />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Raw Material Logs by Movement</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_raw_material_stock_log_via_movement_type.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_raw_material_stock_log_via_movement_type.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_raw_material_stock_log_via_movement_type.map((item) => item.movement_type),
                        colors: ['#4361ee', '#06d6a0', '#fca311', '#f72585', '#8338ec'],
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
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Raw Material Logs by Source</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_raw_material_stock_log_via_source_module.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_raw_material_stock_log_via_source_module.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_raw_material_stock_log_via_source_module.map((item) => item.source_module),
                        colors: ['#3a86ff', '#f59e0b', '#ef4444', '#06d6a0', '#8338ec'],
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
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Finished Good Logs by Movement</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_finished_good_stock_log_via_movement_type.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_finished_good_stock_log_via_movement_type.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_finished_good_stock_log_via_movement_type.map((item) => item.movement_type),
                        colors: ['#06d6a0', '#4361ee', '#fca311', '#f72585', '#8338ec'],
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
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Finished Good Logs by Source</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_finished_good_stock_log_via_source_module.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_finished_good_stock_log_via_source_module.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_finished_good_stock_log_via_source_module.map((item) => item.source_module),
                        colors: ['#f59e0b', '#3a86ff', '#ef4444', '#06d6a0', '#8338ec'],
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
          </>
        ) : null}
      </div>
    </div>
  );
};

export default InventoryOverview;
