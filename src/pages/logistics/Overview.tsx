import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Renew, DeliveryParcel, Report, GasStation } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { LogisticsStats } from '../../services/analytics.service';
import { extractErrorMessage } from '../../utils/formatters';

const LogisticsOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<LogisticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('logistics-supply-chain', 'logistics-supply-chain-overview');
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
      const response = await analyticsService.getLogisticsStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load logistics stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load logistics stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Navbar title="Logistics Overview" subtitle="Logistics & Supply Chain analytics" />

      <div className="xui-py-1-half">
        {loading ? (
          <div className="xui-py-3 xui-text-center">
            <p>Loading logistics analytics...</p>
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
                title="Delivery Assignments"
                value={stats.total_delivery_assignments}
                icon={<DeliveryParcel size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
              <MetricCard
                title="Supply Logs"
                value={stats.total_supply_logs}
                icon={<Report size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
              <MetricCard
                title="Fuel Logs"
                value={stats.total_logistics_fuel_logs}
                icon={<GasStation size={24} />}
                iconBgColor="var(--success-light)"
                iconColor="var(--success)"
              />
              <MetricCard
                title="Fuel Dispensed"
                value={stats.total_logistics_fuel_log_liters_dispensed ?? 0}
                suffix="L"
                icon={<GasStation size={24} />}
                iconBgColor="var(--warning-light)"
                iconColor="var(--warning)"
              />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Supply Summary</h3>
                </div>
                <div className="xui-p-1">
                  <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-1">
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Blocks Loaded</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_supply_log_blocks_loaded ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Blocks Dropped</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_supply_log_blocks_dropped ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Blocks Returned</span>
                      <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_supply_log_blocks_returned ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                      <span className="xui-font-sz-85 xui-opacity-6">Breakage</span>
                      <span className="xui-font-sz-85 xui-font-w-600" style={{ color: 'var(--error)' }}>{(stats.total_supply_log_breakage_quantity ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Assignment Status</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_delivery_assignment_via_assignment_status.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_delivery_assignment_via_assignment_status.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_delivery_assignment_via_assignment_status.map((item) => item.assignment_status),
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
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Fuel by Type</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_logistics_fuel_log_via_fuel_type.length > 0 ? (
                    <>
                      <Chart
                        type="donut"
                        height={220}
                        series={stats.total_logistics_fuel_log_via_fuel_type.map((item) => item.total_count)}
                        options={{
                          labels: stats.total_logistics_fuel_log_via_fuel_type.map((item) => item.fuel_type),
                          colors: ['#f59e0b', '#3b82f6', '#8338ec', '#06d6a0'],
                          legend: { position: 'bottom', fontSize: '12px' },
                          dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                          plotOptions: { pie: { donut: { size: '55%' } } },
                        }}
                      />
                      <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half xui-mt-1">
                        <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                          <span className="xui-font-sz-85 xui-opacity-6">Expected Trips</span>
                          <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_logistics_fuel_log_expected_trips ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="xui-d-flex xui-flex-jc-space-between xui-flex-ai-center">
                          <span className="xui-font-sz-85 xui-opacity-6">Actual Trips</span>
                          <span className="xui-font-sz-85 xui-font-w-600">{(stats.total_logistics_fuel_log_actual_trips ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="xui-font-sz-85 xui-opacity-5 xui-text-center">No data</p>
                  )}
                </div>
              </div>
            </div>

            {stats.deliveryAssignmentScheduledDateAnalysisDaily.length > 0 && (
              <div className="xui-mb-1-half">
                <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                  <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                    <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Daily Delivery Assignments</h3>
                  </div>
                  <div className="xui-p-1">
                    <Chart
                      type={stats.deliveryAssignmentScheduledDateAnalysisDaily.length > 1 ? 'line' : 'bar'}
                      height={280}
                      series={[{
                        name: 'Assignments',
                        data: stats.deliveryAssignmentScheduledDateAnalysisDaily.map((d) => d.total_count),
                      }]}
                      options={{
                        chart: { toolbar: { show: false }, zoom: { enabled: false } },
                        xaxis: {
                          categories: stats.deliveryAssignmentScheduledDateAnalysisDaily.map((d) => d.date),
                          labels: { style: { fontSize: '11px' }, rotate: -45, rotateAlways: stats.deliveryAssignmentScheduledDateAnalysisDaily.length > 7 },
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
              </div>
            )}

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Deliveries by Vehicle</h3>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>Vehicle</th>
                        <th>Plate</th>
                        <th>Deliveries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.total_delivery_assignment_via_vehicle.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td className="xui-font-w-500">{item.Vehicle?.type}</td>
                          <td>{item.Vehicle?.plate_number}</td>
                          <td className="xui-font-w-600">{item.total_count.toLocaleString()}</td>
                        </tr>
                      ))}
                      {stats.total_delivery_assignment_via_vehicle.length === 0 && (
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
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>Supply Log by User</h3>
                </div>
                <div className="xui-table-responsive">
                  <table className="xui-table" xui-style="2">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Logs</th>
                        <th>Loaded</th>
                        <th>Dropped</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.total_supply_log_via_user.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td className="xui-font-w-500">{item.User?.firstname} {item.User?.lastname}</td>
                          <td>{item.total_count.toLocaleString()}</td>
                          <td>{item.blocks_loaded.toLocaleString()}</td>
                          <td>{item.blocks_dropped.toLocaleString()}</td>
                        </tr>
                      ))}
                      {stats.total_supply_log_via_user.length === 0 && (
                        <tr>
                          <td colSpan={4} className="xui-text-center xui-py-2">
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

export default LogisticsOverview;
