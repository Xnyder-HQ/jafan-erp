import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Renew, Industry, UserMultiple, Settings } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { ProductionStats } from '../../services/analytics.service';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';

const ProductionOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('production-quality-control', 'production-quality-control-overview');
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
      const response = await analyticsService.getProductionStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load production stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load production stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Navbar title="Production Overview" subtitle="Production & Quality Control analytics" />

      <div className="xui-py-1-half">
        {loading ? (
          <div className="xui-py-3 xui-text-center">
            <p>Loading production analytics...</p>
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
                title="Production Batches"
                value={stats.total_production_batches}
                icon={<Industry size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
              <MetricCard
                title="Quantity Produced"
                value={stats.total_production_batch_quantity_produced ?? 0}
                icon={<Industry size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
              <MetricCard
                title="Production Teams"
                value={stats.total_production_teams}
                icon={<UserMultiple size={24} />}
                iconBgColor="var(--success-light)"
                iconColor="var(--success)"
              />
              <MetricCard
                title="Maintenance Cost"
                value={stats.total_machine_maintenance_log_cost ?? 0}
                prefix="₦"
                icon={<Settings size={24} />}
                iconBgColor="var(--warning-light)"
                iconColor="var(--warning)"
                useCompact
              />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Production Summary</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">QC Logs</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_production_qc_logs ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Fuel Logs</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_production_fuel_logs ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Fuel Dispensed</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_production_fuel_log_liters_dispensed ?? 0).toLocaleString()}L</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Maintenance Logs</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_machine_maintenance_logs ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Stacking Logs</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_stacking_logs ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Stacking Summary</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Blocks Stacked</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_stacking_log_blocks_stacked ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Breakage</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--error)' }}>{(stats.total_stacking_log_breakage_quantity ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Stacking Cost</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{formatCurrency(stats.total_stacking_log_total_cost ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Batches by Shift</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_production_batch_via_shift.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_production_batch_via_shift.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_production_batch_via_shift.map((item) => item.shift),
                        colors: ['#4361ee', '#f59e0b', '#06d6a0', '#f72585', '#8338ec'],
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

            {stats.productionBatchProductionDateAnalysisDaily.length > 0 && (
              <div className="xui-mb-1-half">
                <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                  <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                    <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Daily Production Trend</h3>
                  </div>
                  <div className="xui-p-1">
                    <Chart
                      type={stats.productionBatchProductionDateAnalysisDaily.length > 1 ? 'line' : 'bar'}
                      height={280}
                      series={[
                        {
                          name: 'Batches',
                          data: stats.productionBatchProductionDateAnalysisDaily.map((d) => d.total_count),
                        },
                        {
                          name: 'Qty Produced',
                          data: stats.productionBatchProductionDateAnalysisDaily.map((d) => d.quantity_produced),
                        },
                      ]}
                      options={{
                        chart: { toolbar: { show: false }, zoom: { enabled: false } },
                        xaxis: {
                          categories: stats.productionBatchProductionDateAnalysisDaily.map((d) => d.date),
                          labels: { style: { fontSize: '11px' }, rotate: -45, rotateAlways: stats.productionBatchProductionDateAnalysisDaily.length > 7 },
                        },
                        dataLabels: { enabled: false },
                        stroke: { curve: 'smooth', width: 3 },
                        colors: ['#4361ee', '#06d6a0'],
                        markers: { size: 4 },
                        plotOptions: { bar: { columnWidth: '35%', borderRadius: 4 } },
                        grid: { borderColor: '#e5e7eb' },
                        legend: { position: 'top', fontSize: '12px' },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Production by Machine</h3>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th>Batches</th>
                        <th>Qty Produced</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.total_production_batch_via_machine.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td className="xui-font-w-500">{item.Machine?.name}</td>
                          <td>{item.total_count.toLocaleString()}</td>
                          <td className="xui-font-w-600">{item.quantity_produced.toLocaleString()}</td>
                        </tr>
                      ))}
                      {stats.total_production_batch_via_machine.length === 0 && (
                        <tr>
                          <td colSpan={3} className="xui-text-center xui-py-2">
                            <p className="xui-opacity-5">No data</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Production by Team</h3>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>Team</th>
                        <th>Batches</th>
                        <th>Qty Produced</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.total_production_batch_via_production_team.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td className="xui-font-w-500">{item.ProductionTeam?.name}</td>
                          <td>{item.total_count.toLocaleString()}</td>
                          <td className="xui-font-w-600">{item.quantity_produced.toLocaleString()}</td>
                        </tr>
                      ))}
                      {stats.total_production_batch_via_production_team.length === 0 && (
                        <tr>
                          <td colSpan={3} className="xui-text-center xui-py-2">
                            <p className="xui-opacity-5">No data</p>
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

export default ProductionOverview;
