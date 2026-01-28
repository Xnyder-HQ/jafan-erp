import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import { Navbar } from '../../components/layout';
import { MetricCard } from '../../components/overview';
import { Renew, UserMultiple, AppConnectivity, Catalog } from '@carbon/icons-react';
import { useGeneral } from '../../context/GeneralContext';
import analyticsService from '../../services/analytics.service';
import type { AclStats } from '../../services/analytics.service';
import { extractErrorMessage } from '../../utils/formatters';

const AclOverview = () => {
  const { getAccessIds } = useGeneral();
  const [stats, setStats] = useState<AclStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const accessIds = getAccessIds('acls', 'acls-overview');
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
      const response = await analyticsService.getAclStats({
        module_unique_id: moduleId,
        sub_module_unique_id: subModuleId,
      });
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load ACL stats');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load ACL stats'));
    } finally {
      setLoading(false);
    }
  }, [moduleId, subModuleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <Navbar title="ACL Overview" subtitle="Access Control List analytics" />

      <div className="xui-py-1-half">
        {loading ? (
          <div className="xui-py-3 xui-text-center">
            <p>Loading ACL analytics...</p>
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
            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-lg-grid-col-3 xui-grid-gap-1 xui-mb-1-half">
              <MetricCard
                title="Total ACLs"
                value={stats.total_acls}
                icon={<UserMultiple size={24} />}
                iconBgColor="var(--primary-100)"
                iconColor="var(--primary-700)"
              />
              <MetricCard
                title="Modules with ACLs"
                value={stats.total_acls_via_module.length}
                icon={<AppConnectivity size={24} />}
                iconBgColor="var(--info-light)"
                iconColor="var(--info)"
              />
              <MetricCard
                title="Sub Modules with ACLs"
                value={stats.total_acls_via_sub_module.length}
                icon={<Catalog size={24} />}
                iconBgColor="var(--success-light)"
                iconColor="var(--success)"
              />
            </div>

            <div className="xui-d-grid xui-grid-col-1 xui-md-grid-col-2 xui-grid-gap-1 xui-mb-1-half">
              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>ACLs by Role</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_acls_via_role.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_acls_via_role.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_acls_via_role.map((item) => item.Role.name),
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
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>ACLs by Module</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_acls_via_module.length > 0 ? (
                    <Chart
                      type="donut"
                      height={250}
                      series={stats.total_acls_via_module.map((item) => item.total_count)}
                      options={{
                        labels: stats.total_acls_via_module.map((item) => item.Module.name),
                        colors: ['#3a86ff', '#f59e0b', '#ef4444', '#06d6a0', '#8338ec', '#4361ee', '#fca311', '#f72585'],
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

              <div className="xui-bg-white xui-bdr-rad-half xui-overflow-hidden" style={{ border: '1px solid var(--neutral-200)', gridColumn: '1 / -1' }}>
                <div className="xui-p-1" style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                  <h3 className="xui-font-sz-90 xui-font-w-600" style={{ color: 'var(--neutral-900)' }}>ACLs by Sub Module</h3>
                </div>
                <div className="xui-p-1">
                  {stats.total_acls_via_sub_module.length > 0 ? (
                    <Chart
                      type="bar"
                      height={300}
                      series={[{
                        name: 'ACLs',
                        data: stats.total_acls_via_sub_module.map((item) => item.total_count),
                      }]}
                      options={{
                        xaxis: {
                          categories: stats.total_acls_via_sub_module.map((item) => item.SubModule.name),
                          labels: { style: { fontSize: '11px' }, rotate: -45 },
                        },
                        yaxis: { title: { text: 'Count' } },
                        colors: ['#4361ee'],
                        plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
                        dataLabels: { enabled: false },
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

export default AclOverview;
