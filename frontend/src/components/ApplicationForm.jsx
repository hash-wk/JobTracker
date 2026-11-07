import { useState } from 'react';
import api from '../api';
import { STATUSES, STATUS_LABELS } from '../constants';

export default function ApplicationForm({ application, onClose, onSaved }) {
  const isEdit = Boolean(application);

  const [form, setForm] = useState({
    company: application?.company || '',
    position: application?.position || '',
    jobUrl: application?.jobUrl || '',
    status: application?.status || 'WISHLIST',
    appliedDate: application?.appliedDate
      ? application.appliedDate.slice(0, 10)
      : '',
    location: application?.location || '',
    notes: application?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/applications/${application.id}`, form);
      } else {
        await api.post('/applications', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>{isEdit ? 'Edit application' : 'Add application'}</h2>

        {error && <div className="error">{error}</div>}

        <input name="company" placeholder="Company *" value={form.company} onChange={handleChange} required />
        <input name="position" placeholder="Position *" value={form.position} onChange={handleChange} required />
        <input name="jobUrl" placeholder="Job link (optional)" value={form.jobUrl} onChange={handleChange} />
        <input name="location" placeholder="Location (optional)" value={form.location} onChange={handleChange} />

        <div className="row">
          <select name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <input type="date" name="appliedDate" value={form.appliedDate} onChange={handleChange} />
        </div>

        <textarea name="notes" placeholder="Notes (optional)" rows="3" value={form.notes} onChange={handleChange} />

        <div className="row">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}