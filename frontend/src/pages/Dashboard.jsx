import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ApplicationForm from '../components/ApplicationForm';
import { STATUSES, STATUS_LABELS } from '../constants';

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sort, setSort] = useState('newest');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function loadApplications() {
    try {
      const { data } = await api.get('/applications');
      setApplications(data);
      setError('');
    } catch (err) {
      setError('Could not load applications. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this application?')) return;
    try {
      await api.delete(`/applications/${id}`);
      loadApplications();
    } catch (err) {
      setError('Could not delete the application.');
    }
  }

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(app) {
    setEditing(app);
    setShowForm(true);
  }

  function handleSaved() {
    setShowForm(false);
    setEditing(null);
    loadApplications();
  }

  const counts = useMemo(() => {
    const result = {};
    STATUSES.forEach((s) => (result[s] = 0));
    applications.forEach((a) => (result[a.status] += 1));
    return result;
  }, [applications]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications
      .filter((a) => statusFilter === 'ALL' || a.status === statusFilter)
      .filter(
        (a) =>
          !term ||
          a.company.toLowerCase().includes(term) ||
          a.position.toLowerCase().includes(term)
      )
      .sort((a, b) =>
        sort === 'newest'
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt)
      );
  }, [applications, search, statusFilter, sort]);

  return (
    <div>
      <div className="stats">
        {STATUSES.map((s) => (
          <div
            key={s}
            className={`stat ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}
          >
            <div className="stat-number">{counts[s]}</div>
            <div className="muted">{STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <input
          placeholder="Search company or position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button onClick={openAdd}>+ Add</button>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      {!loading && visible.length === 0 && (
        <p className="muted">
          {applications.length === 0
            ? 'No applications yet. Click "+ Add" to create your first one.'
            : 'No applications match your search or filter.'}
        </p>
      )}

      <div className="list">
        {visible.map((a) => (
          <div key={a.id} className="item">
            <div className="item-main">
              <Link to={`/applications/${a.id}`} className="item-title">{a.position}</Link>
              <div className="muted">
                {a.company}
                {a.location ? ` · ${a.location}` : ''}
                {a.appliedDate
                  ? ` · Applied ${new Date(a.appliedDate).toLocaleDateString()}`
                  : ''}
              </div>
              {a.notes && <div className="notes">{a.notes}</div>}
              {a.jobUrl && (
                <a href={a.jobUrl} target="_blank" rel="noreferrer">View job</a>
              )}
            </div>
            <div className="item-side">
              <span className={`badge ${a.status}`}>{STATUS_LABELS[a.status]}</span>
              <div className="row">
                <button className="secondary small" onClick={() => openEdit(a)}>Edit</button>
                <button className="danger small" onClick={() => handleDelete(a.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <ApplicationForm
          application={editing}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}