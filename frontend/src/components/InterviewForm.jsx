import { useEffect, useState } from 'react';
import api from '../api';
import { INTERVIEW_TYPES } from '../constants';

function pad(n) {
  return String(n).padStart(2, '0');
}

// ISO date from the server -> value for <input type="datetime-local">
function toLocalInput(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function InterviewForm({ interview, defaultDateTime, onClose, onSaved }) {
  const isEdit = Boolean(interview);

  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({
    applicationId: interview?.applicationId || '',
    type: interview?.type || INTERVIEW_TYPES[0],
    dateTime: interview ? toLocalInput(interview.dateTime) : defaultDateTime || '',
    location: interview?.location || '',
    notes: interview?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/applications')
      .then(({ data }) => setApplications(data))
      .catch(() => setError('Could not load your applications.'));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        dateTime: new Date(form.dateTime).toISOString(),
      };
      if (isEdit) {
        await api.put(`/interviews/${interview.id}`, payload);
      } else {
        await api.post('/interviews', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this interview?')) return;
    try {
      await api.delete(`/interviews/${interview.id}`);
      onSaved();
    } catch (err) {
      setError('Could not delete the interview.');
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>{isEdit ? 'Edit interview' : 'Schedule interview'}</h2>

        {error && <div className="error">{error}</div>}

        {!isEdit && applications.length === 0 && (
          <p className="muted">Add an application first, then schedule its interview.</p>
        )}

        <select
          name="applicationId"
          value={form.applicationId}
          onChange={handleChange}
          disabled={isEdit}
          required
        >
          <option value="">Select application *</option>
          {isEdit && interview.application && (
            <option value={interview.applicationId}>
              {interview.application.company} — {interview.application.position}
            </option>
          )}
          {!isEdit &&
            applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.company} — {a.position}
              </option>
            ))}
        </select>

        <div className="row">
          <select name="type" value={form.type} onChange={handleChange}>
            {INTERVIEW_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            name="dateTime"
            value={form.dateTime}
            onChange={handleChange}
            required
          />
        </div>

        <input
          name="location"
          placeholder="Location or meeting link (optional)"
          value={form.location}
          onChange={handleChange}
        />
        <textarea
          name="notes"
          rows="3"
          placeholder="Notes, e.g. topics to prepare (optional)"
          value={form.notes}
          onChange={handleChange}
        />

        <div className="row">
          {isEdit && (
            <button type="button" className="danger" onClick={handleDelete}>Delete</button>
          )}
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}