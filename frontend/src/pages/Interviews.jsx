import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import InterviewForm from '../components/InterviewForm';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function dayKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [formState, setFormState] = useState(null); // { interview, defaultDateTime }

  async function load() {
    try {
      const { data } = await api.get('/interviews');
      setInterviews(data);
      setError('');
    } catch (err) {
      setError('Could not load interviews. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byDay = useMemo(() => {
    const map = {};
    interviews.forEach((i) => {
      const key = dayKey(new Date(i.dateTime));
      if (!map[key]) map[key] = [];
      map[key].push(i);
    });
    return map;
  }, [interviews]);

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const offset = (new Date(year, m, 1).getDay() + 6) % 7; // week starts Monday
    const daysInMonth = new Date(year, m + 1, 0).getDate();

    const list = [];
    for (let i = 0; i < offset; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(year, m, d));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [month]);

  const upcoming = interviews
    .filter((i) => new Date(i.dateTime) >= new Date())
    .slice(0, 8);

  const todayKey = dayKey(new Date());

  function openAdd(date) {
    setFormState({
      interview: null,
      defaultDateTime: date ? `${dayKey(date)}T10:00` : '',
    });
  }

  function handleSaved() {
    setFormState(null);
    load();
  }

  function shiftMonth(delta) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  return (
    <div>
      <div className="page-head">
        <h3>Interviews</h3>
        <button onClick={() => openAdd(null)}>+ Schedule</button>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      <div className="interviews-layout">
        <div className="calendar">
          <div className="cal-head">
            <button className="secondary small" onClick={() => shiftMonth(-1)}>‹</button>
            <h3>
              {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </h3>
            <button className="secondary small" onClick={() => shiftMonth(1)}>›</button>
          </div>

          <div className="cal-grid">
            {WEEKDAYS.map((w) => (
              <div key={w} className="cal-weekday">{w}</div>
            ))}

            {cells.map((date, idx) =>
              date ? (
                <div
                  key={idx}
                  className={`cal-cell ${dayKey(date) === todayKey ? 'today' : ''}`}
                  onClick={() => openAdd(date)}
                >
                  <span className="cal-num">{date.getDate()}</span>
                  {(byDay[dayKey(date)] || []).map((i) => (
                    <div
                      key={i.id}
                      className="chip"
                      title={`${i.application.company} — ${i.type}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormState({ interview: i });
                      }}
                    >
                      {timeLabel(i.dateTime)} {i.application.company}
                    </div>
                  ))}
                </div>
              ) : (
                <div key={idx} className="cal-cell empty" />
              )
            )}
          </div>
          <p className="muted hint">Click a day to schedule, or click an interview to edit it.</p>
        </div>

        <div className="upcoming">
          <h3>Upcoming</h3>
          {upcoming.length === 0 && (
            <p className="muted">No upcoming interviews.</p>
          )}
          {upcoming.map((i) => (
            <div key={i.id} className="up-item" onClick={() => setFormState({ interview: i })}>
              <div className="up-date">
                {new Date(i.dateTime).toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                · {timeLabel(i.dateTime)}
              </div>
              <div className="up-title">{i.application.company}</div>
              <div className="muted">
                {i.application.position} · {i.type}
              </div>
              {i.location && <div className="muted">{i.location}</div>}
              <Link
                to={`/applications/${i.application.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                View application
              </Link>
            </div>
          ))}
        </div>
      </div>

      {formState && (
        <InterviewForm
          interview={formState.interview}
          defaultDateTime={formState.defaultDateTime}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}