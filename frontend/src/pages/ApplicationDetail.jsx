import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ApplicationForm from '../components/ApplicationForm';
import { STATUS_LABELS } from '../constants';

function formatDateTime(value) {
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const { data } = await api.get(`/applications/${id}`);
      setApp(data);
      setError('');
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'Application not found.'
          : 'Could not load this application.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Delete this application?')) return;
    try {
      await api.delete(`/applications/${id}`);
      navigate('/');
    } catch (err) {
      setError('Could not delete the application.');
    }
  }

  function handleSaved() {
    setShowForm(false);
    load();
  }

  if (loading) return <p className="muted">Loading...</p>;

  if (error || !app) {
    return (
      <div>
        <div className="error">{error || 'Something went wrong.'}</div>
        <p><Link to="/" className="back-link">← Back to list</Link></p>
      </div>
    );
  }

  return (
    <div className="detail">
      <Link to="/" className="back-link">← Back to list</Link>

      <div className="detail-card">
        <div className="detail-head">
          <div>
            <h1>{app.position}</h1>
            <p className="muted detail-company">{app.company}</p>
          </div>
          <span className={`badge ${app.status}`}>{STATUS_LABELS[app.status]}</span>
        </div>

        <div className="detail-grid">
          <div>
            <div className="label">Location</div>
            <div>{app.location || '—'}</div>
          </div>
          <div>
            <div className="label">Applied on</div>
            <div>
              {app.appliedDate
                ? new Date(app.appliedDate).toLocaleDateString()
                : '—'}
            </div>
          </div>
          <div>
            <div className="label">Added on</div>
            <div>{new Date(app.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="label">Job link</div>
            <div>
              {app.jobUrl ? (
                <a href={app.jobUrl} target="_blank" rel="noreferrer">Open job post</a>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        <div className="label">Notes</div>
        <p className="detail-notes">{app.notes || 'No notes yet.'}</p>

        <div className="row detail-actions">
          <button className="secondary" onClick={() => setShowForm(true)}>Edit</button>
          <button className="danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="detail-card">
        <h2>Status timeline</h2>

        {app.history.length === 0 ? (
          <p className="muted">
            No history was recorded for this application. Changes from now on
            will appear here.
          </p>
        ) : (
          <ul className="timeline">
            {app.history.map((h) => (
              <li key={h.id}>
                <span className={`dot ${h.newStatus}`} />
                <div>
                  <div className="timeline-title">
                    {h.oldStatus
                      ? `${STATUS_LABELS[h.oldStatus]} → ${STATUS_LABELS[h.newStatus]}`
                      : `Added as ${STATUS_LABELS[h.newStatus]}`}
                  </div>
                  <div className="muted">{formatDateTime(h.changedAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <ApplicationForm
          application={app}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}