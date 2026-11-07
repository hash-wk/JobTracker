import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../api';
import ApplicationForm from '../components/ApplicationForm';
import { STATUSES, STATUS_LABELS } from '../constants';

export default function Board() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const id = Number(draggableId);
    const newStatus = destination.droppableId;
    const previous = applications;

    // Update the screen immediately
    setApplications((apps) =>
      apps.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );

    // Save to the server; undo if it fails
    api.put(`/applications/${id}`, { status: newStatus }).catch(() => {
      setApplications(previous);
      setError('Could not move the card. Please try again.');
    });
  }

  function handleSaved() {
    setShowForm(false);
    setEditing(null);
    loadApplications();
  }

  return (
    <div>
      <p className="muted board-hint">Drag a card to another column to change its status.</p>
      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board">
          {STATUSES.map((status) => {
            const items = applications.filter((a) => a.status === status);
            return (
              <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <div
                    className={`column ${snapshot.isDraggingOver ? 'over' : ''}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="column-header">
                      <span>{STATUS_LABELS[status]}</span>
                      <span className="count">{items.length}</span>
                    </div>

                    {items.map((a, index) => (
                      <Draggable draggableId={String(a.id)} index={index} key={a.id}>
                        {(drag, dragSnapshot) => (
                          <div
                            className={`kcard ${dragSnapshot.isDragging ? 'dragging' : ''}`}
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            onDoubleClick={() => {
                              setEditing(a);
                              setShowForm(true);
                            }}
                          >
                            <div className="kcard-title">{a.position}</div>
                            <div className="muted">{a.company}</div>
                            {a.appliedDate && (
                              <div className="kcard-date">
                                {new Date(a.appliedDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

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