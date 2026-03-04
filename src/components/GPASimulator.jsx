
import React, { useState, useEffect } from 'react';
import { getGradePoint } from '../utils/gradeUtils';
import './GPASimulator.css';

const GPASimulator = ({ gradesData, roadmap, mapSubjectToGrade, unmapped, onClose }) => {
    const [simulatedGrades, setSimulatedGrades] = useState([]);
    const [simulatorItems, setSimulatorItems] = useState([]);

    useEffect(() => {
        // Build the list of all subjects (Roadmap + Unmapped)
        const items = [];
        const seen = new Set();

        // 1. Process Roadmap
        roadmap.forEach(semester => {
            semester.courses.forEach(courseStr => {
                const match = courseStr.match(/^(.*?)\s*\((\d+)\s*tín chỉ\)$/);
                const subjectNameRaw = match ? match[1] : courseStr;
                const credits = match ? parseInt(match[2], 10) : 0;

                // Skip non-GPA subjects
                if (['Giáo dục quốc phòng an ninh', 'Giáo dục thể chất'].some(s => subjectNameRaw.includes(s))) {
                    return;
                }

                // Check if mapped
                let letterGrade = '';
                let isGraded = false;

                if (mapSubjectToGrade[courseStr]) {
                    const row = mapSubjectToGrade[courseStr].row;
                    letterGrade = row[10] || '';
                    isGraded = true;
                }

                items.push({
                    id: courseStr, // Use courseStr as unique ID
                    subjectName: subjectNameRaw,
                    credits,
                    letterGrade,
                    isGraded,
                    source: 'roadmap'
                });
                seen.add(courseStr);
            });
        });

        // 2. Process Unmapped
        unmapped.forEach(item => {
            const row = item.row;
            const subjectName = row[3];
            const credits = parseInt(row[11], 10) || 0;
            const letterGrade = row[10] || '';

            // Generate a unique ID for unmapped items
            const uid = `unmapped-${subjectName}`;
            if (!seen.has(uid)) {
                items.push({
                    id: uid,
                    subjectName: subjectName,
                    credits,
                    letterGrade,
                    isGraded: true,
                    source: 'unmapped'
                });
            }
        });

        // Filter out items with 0 credits or invalid data
        const validItems = items.filter(i => i.credits > 0);

        // Sort: Ungraded/Fail first (prioritize improvement), then by name
        // Or simply list them all. User wants to edit ungraded stuff.
        // Let's sort keys: Unfinished > Low Grade > High Grade
        validItems.sort((a, b) => {
            const scoreA = getGradePoint(a.letterGrade);
            const scoreB = getGradePoint(b.letterGrade);
            // If ungraded (empty), treat as -1 for sorting to put at top?
            // Actually, usually users want to fill empty ones first.
            const sA = a.letterGrade ? scoreA : -1;
            const sB = b.letterGrade ? scoreB : -1;

            return sA - sB;
        });

        setSimulatorItems(validItems);

    }, [roadmap, mapSubjectToGrade, unmapped]);

    const handleGradeChange = (subjectId, newLetter) => {
        setSimulatedGrades(prev => {
            const existing = prev.find(p => p.id === subjectId);
            if (existing) {
                if (newLetter === '') {
                    return prev.filter(p => p.id !== subjectId);
                }
                return prev.map(p => p.id === subjectId ? { ...p, letterGrade: newLetter } : p);
            } else {
                if (newLetter === '') return prev;
                return [...prev, { id: subjectId, letterGrade: newLetter }];
            }
        });
    };

    const calculateProjectedGPA = () => {
        let totalPoints = 0;
        let totalCredits = 0;

        simulatorItems.forEach(item => {
            const sim = simulatedGrades.find(s => s.id === item.id);
            // Use simulated grade if valid, else original grade
            const letter = sim ? sim.letterGrade : item.letterGrade;

            if (letter) {
                const points = getGradePoint(letter);
                totalPoints += points * item.credits;
                totalCredits += item.credits;
            }
        });

        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    };

    const calculateCurrentGPA = () => {
        let totalPoints = 0;
        let totalCredits = 0;

        simulatorItems.forEach(item => {
            // Only count items that are actually graded in reality
            if (item.isGraded && item.letterGrade) {
                const points = getGradePoint(item.letterGrade);
                totalPoints += points * item.credits;
                totalCredits += item.credits;
            }
        });

        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
    };

    const currentGPA = calculateCurrentGPA();
    const projectedGPA = calculateProjectedGPA();
    const diff = (parseFloat(projectedGPA) - parseFloat(currentGPA)).toFixed(2);

    return (
        <div className="simulator-overlay">
            <div className="simulator-modal">
                <div className="simulator-header">
                    <h2>📈 Giả lập cải thiện điểm (GPA Simulator)</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="simulator-body">
                    <div className="gpa-comparison">
                        <div className="gpa-card current">
                            <span className="label">GPA Hiện tại</span>
                            <span className="value">{currentGPA}</span>
                        </div>
                        <div className="arrow">➜</div>
                        <div className="gpa-card projected">
                            <span className="label">GPA Dự kiến</span>
                            <span className="value">{projectedGPA}</span>
                            <span className={`diff ${diff > 0 ? 'positive' : ''}`}>
                                {diff > 0 ? `+${diff}` : diff}
                            </span>
                        </div>
                    </div>

                    <div className="subject-list">
                        <p className="instruction">Nhập điểm dự kiến cho các môn học:</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Môn học</th>
                                    <th>TC</th>
                                    <th>Điểm gốc</th>
                                    <th>Điểm giả lập</th>
                                </tr>
                            </thead>
                            <tbody>
                                {simulatorItems.map(sub => {
                                    const sim = simulatedGrades.find(s => s.id === sub.id);
                                    const selected = sim ? sim.letterGrade : '';

                                    return (
                                        <tr key={sub.id} className={sim ? 'edited' : ''}>
                                            <td className="sub-name">{sub.subjectName}</td>
                                            <td>{sub.credits}</td>
                                            <td>
                                                <span className={`badge grade-${sub.letterGrade || 'none'}`}>
                                                    {sub.letterGrade || '--'}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    value={selected}
                                                    onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                                                >
                                                    <option value="">-- Mặc định --</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A">A</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B">B</option>
                                                    <option value="C+">C+</option>
                                                    <option value="C">C</option>
                                                    <option value="D+">D+</option>
                                                    <option value="D">D</option>
                                                    <option value="F">F</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GPASimulator;
