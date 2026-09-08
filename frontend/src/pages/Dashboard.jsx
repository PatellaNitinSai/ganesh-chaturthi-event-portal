import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import WelcomeBanner from '../components/WelcomeBanner.jsx';

const DONATION_COLORS = { public: '#16a34a', youth: '#f97316' };
const EXPENSE_COLORS = ['#ef4444', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];

function currency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/summary')
      .then((res) => setData(res.data))
      .catch(() => setErr('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (err) return <div className="form-error">{err}</div>;
  if (!data) return null;

  const donationChartData = data.donationByType.map((d) => ({
    name: d.type === 'youth' ? 'Youth Donations' : 'Public Donations',
    value: d.total,
    color: DONATION_COLORS[d.type] || '#999',
  }));

  const expenseChartData = data.expenseByCategory.map((e, i) => ({
    name: e.category,
    value: e.total,
    color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));

  return (
    <div>
      <WelcomeBanner eventName={data.settings.event_name} tagline={data.settings.committee_tagline} />

      <div className="stat-grid">
        <div className="stat-card green">
          <div className="stat-icon">📅</div>
          <div>
            <div className="stat-label">Total Income</div>
            <div className="stat-value">{currency(data.totalIncome)}</div>
            <div className="stat-sub">From all donations</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🧾</div>
          <div>
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value">{currency(data.totalExpensesPaid)}</div>
            <div className="stat-sub">Advance + settled payments</div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">💰</div>
          <div>
            <div className="stat-label">Balance</div>
            <div className="stat-value">{currency(data.balance)}</div>
            <div className="stat-sub">Available funds</div>
          </div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon">👤</div>
          <div>
            <div className="stat-label">Total Donors</div>
            <div className="stat-value">{data.totalDonors}</div>
            <div className="stat-sub">Public + Youth</div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-header">
            <h3>🙏 Donation Summary</h3>
          </div>
          <div className="donut-row">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={donationChartData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {donationChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => currency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-legend">
              <div className="donut-total">{currency(data.totalIncome)}<span>Total Donations</span></div>
              {donationChartData.map((d) => (
                <div className="legend-row" key={d.name}>
                  <span className="dot" style={{ background: d.color }} /> {d.name}
                  <b>{currency(d.value)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>🧾 Expense Summary</h3>
          </div>
          <div className="donut-row">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={expenseChartData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {expenseChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => currency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-legend">
              <div className="donut-total">{currency(data.totalExpensesPaid)}<span>Total Expenses</span></div>
              {expenseChartData.map((d) => (
                <div className="legend-row" key={d.name}>
                  <span className="dot" style={{ background: d.color }} /> {d.name}
                  <b>{currency(d.value)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-header"><h3>Recent Donations</h3></div>
          <div className="table-scroll"><table className="data-table">
            <thead>
              <tr><th>Date</th><th>Name</th><th>Type</th><th>Amount</th><th>Mode</th></tr>
            </thead>
            <tbody>
              {data.recentDonations.map((d) => (
                <tr key={d.id}>
                  <td>{d.date}</td>
                  <td>{d.donor_name}</td>
                  <td><span className={'badge ' + d.type}>{d.type}</span></td>
                  <td>{currency(d.amount)}</td>
                  <td>{d.payment_mode}</td>
                </tr>
              ))}
              {data.recentDonations.length === 0 && (
                <tr><td colSpan="5" className="empty-row">No donations recorded yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h3>Recent Expenses</h3></div>
          <div className="table-scroll"><table className="data-table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.recentExpenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>{e.description}</td>
                  <td>{currency(e.total_amount)}</td>
                  <td><span className={'status-pill ' + e.status.toLowerCase()}>{e.status}</span></td>
                </tr>
              ))}
              {data.recentExpenses.length === 0 && (
                <tr><td colSpan="4" className="empty-row">No expenses recorded yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {data.pendingVendorPayments.length > 0 && (
        <div className="panel">
          <div className="panel-header"><h3>⚠️ Pending Vendor Payments</h3></div>
          <div className="table-scroll"><table className="data-table">
            <thead>
              <tr><th>Vendor</th><th>Category</th><th>Agreed</th><th>Paid so far</th><th>Balance Due</th></tr>
            </thead>
            <tbody>
              {data.pendingVendorPayments.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td>{v.category}</td>
                  <td>{currency(v.agreed)}</td>
                  <td>{currency(v.paid)}</td>
                  <td className="danger-text">{currency(v.balance_due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header"><h3>🚩 Event Progress</h3></div>
        <div className="phase-track">
          {data.phases.map((p) => (
            <div key={p.id} className={'phase-step ' + p.status}>
              <div className="phase-dot" />
              <div className="phase-name">{p.phase_name}</div>
              <div className="phase-status">{p.status.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      {data.daysLeft !== null && (
        <div className="panel countdown-panel">
          <h3>Event Countdown</h3>
          <div className="countdown-value">{data.daysLeft >= 0 ? data.daysLeft : 0} Days Left</div>
          <div className="countdown-sub">until Visarjan Day</div>
        </div>
      )}
    </div>
  );
}
