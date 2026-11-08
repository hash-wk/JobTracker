import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import api from '../api';
import { STATUSES, STATUS_LABELS } from '../constants';

const STATUS_COLORS = {
  WISHLIST: '#f0c4ce',
  APPLIED: '#ff9fb3',
  INTERVIEW: '#fcd34d',
  OFFER: '#86efac',
  REJECTED: '#fca5a5',
};

const tooltipStyle = {
  background: '#2a0f18',
  border: '1px solid rgba(240, 196, 206, 0.25)',
  borderRadius: 10,
  color: '#f7e6ea',
};

function shortDate(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Could not load analytics. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading...</p>;
  if (error) return <div className="error">{error}</div>;
  if (!stats || stats.total === 0) {
    return (
      <p className="muted">
        No data yet. Add some applications and your charts will appear here.
      </p>
    );
  }

  const pieData = STATUSES.filter((s) => stats.byStatus[s] > 0).map((s) => ({
    key: s,
    name: STATUS_LABELS[s],
    value: stats.byStatus[s],
  }));

  const weeklyData = stats.weekly.map((w) => ({
    label: shortDate(w.week),
    count: w.count,
  }));

  return (
    <div>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-number">{stats.total}</div>
          <div className="muted">Total tracked</div>
        </div>
        <div className="kpi">
          <div className="kpi-number">{stats.applied}</div>
          <div className="muted">Applications sent</div>
        </div>
        <div className="kpi">
          <div className="kpi-number">{stats.responseRate}%</div>
          <div className="muted">Response rate</div>
        </div>
        <div className="kpi">
          <div className="kpi-number">{stats.interviewRate}%</div>
          <div className="muted">Interview rate</div>
        </div>
        <div className="kpi">
          <div className="kpi-number">{stats.offerRate}%</div>
          <div className="muted">Offer rate</div>
        </div>
      </div>

      <div className="charts">
        <div className="chart-card">
          <h3>Applications by status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                stroke="none"
              >
                {pieData.map((d) => (
                  <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f7e6ea' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Applications sent per week</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid stroke="rgba(240, 196, 206, 0.12)" vertical={false} />
              <XAxis dataKey="label" stroke="#b99aa3" fontSize={12} />
              <YAxis stroke="#b99aa3" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={{ color: '#f7e6ea' }}
                cursor={{ fill: 'rgba(240, 196, 206, 0.08)' }}
              />
              <Bar dataKey="count" name="Applications" fill="#b8546a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="muted hint">
        Response rate counts applications that reached Interview, Offer or
        Rejected, out of everything you have applied to (Wishlist excluded).
      </p>
    </div>
  );
}