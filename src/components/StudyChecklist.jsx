
import React, { useState, useEffect } from 'react';
import './StudyChecklist.css';

const StudyChecklist = ({ subjectId }) => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem(`checklist_${subjectId}`);
        if (saved) {
            setTasks(JSON.parse(saved));
        } else {
            // Default tasks
            setTasks([
                { id: 1, text: 'Xem lại đề cương môn học', done: false },
                { id: 2, text: 'Tổng hợp công thức quan trọng', done: false },
                { id: 3, text: 'Làm đề thi năm ngoái', done: false },
            ]);
        }
    }, [subjectId]);

    useEffect(() => {
        localStorage.setItem(`checklist_${subjectId}`, JSON.stringify(tasks));
    }, [tasks, subjectId]);

    const addTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
        setNewTask('');
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const progress = tasks.length > 0
        ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)
        : 0;

    return (
        <div className="study-checklist">
            <div className="progress-container">
                <div className="progress-label">
                    <span>Tiến độ ôn tập</span>
                    <span>{progress}%</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <form onSubmit={addTask} className="add-task-form">
                <input
                    type="text"
                    placeholder="Thêm việc cần làm..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
                <button type="submit">+</button>
            </form>

            <ul className="task-list">
                {tasks.map(task => (
                    <li key={task.id} className={task.done ? 'done' : ''}>
                        <label>
                            <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => toggleTask(task.id)}
                            />
                            <span className="task-text">{task.text}</span>
                        </label>
                        <button className="btn-delete" onClick={() => deleteTask(task.id)}>&times;</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StudyChecklist;
