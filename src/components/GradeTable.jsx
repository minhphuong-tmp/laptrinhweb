import React, { useMemo } from 'react';
import './GradeTable.css';

const GradeTable = ({ gradesData }) => {
    // Logic to group data by year and semester
    const groupedData = useMemo(() => {
        if (!gradesData || gradesData.length === 0) return { groups: [], keys: [] };

        const grouped = {};
        const keys = [];

        gradesData.forEach(row => {
            // Assuming structure: [Index, Year, Semester, Subject, ...]
            const year = row[1];
            const semester = row[2];
            const key = `${year}-${semester}`;

            if (!grouped[key]) {
                grouped[key] = {
                    year: year,
                    sem: semester,
                    items: [],
                    totalCredits: 0
                };
                keys.push(key);
            }

            grouped[key].items.push(row);
            // Ensure credit is parsed as integer. Index 11 is Credits based on mapping
            const creditCell = row[11];
            const credits = creditCell && !isNaN(parseInt(creditCell)) ? parseInt(creditCell) : 0;
            grouped[key].totalCredits += credits;
        });

        // The input data is expected to be already sorted chronologically by the backend
        // So we just preserve the order of keys as they appear (assuming backend sorts correctly)
        // If we needed to sort keys explicitly we could do it here.

        return { groups: grouped, keys };
    }, [gradesData]);

    if (!gradesData || gradesData.length === 0) {
        return <div className="no-grades">Chưa có dữ liệu điểm.</div>;
    }

    return (
        <div className="grade-table-container">
            {groupedData.keys.map(key => {
                const group = groupedData.groups[key];
                return (
                    <div key={key} className="semester-block">
                        <div className="semester-header">
                            <h4>{group.year} - {group.sem}</h4>
                            <span className="credit-total">(Tổng số tín chỉ: {group.totalCredits})</span>
                        </div>
                        <div className="table-responsive">
                            <table className="grade-table">
                                <thead>
                                    <tr>
                                        <th>Môn học</th>
                                        <th>Tín chỉ</th>
                                        <th>GK(TP1)</th>
                                        <th>CC(TP2)</th>
                                        <th>Điểm CK</th>
                                        <th>Điểm TK</th>
                                        <th>Điểm chữ</th>
                                        <th>Kỳ hiện tại</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.items.map((row, idx) => {
                                        // Index 10 is Letter Grade
                                        const gradeLetter = row[10] ? row[10].trim().toUpperCase() : '';
                                        return (
                                            <tr key={idx} className={`grade-${gradeLetter}`}>
                                                <td>{row[3]}</td> {/* Môn */}
                                                <td>{row[11] || '-'}</td> {/* Tín chỉ */}
                                                <td>{row[5] || '-'}</td> {/* TP1 */}
                                                <td>{row[6] || '-'}</td> {/* TP2 */}
                                                <td>{row[8] || '-'}</td> {/* CK */}
                                                <td>{row[9] || '-'}</td> {/* TK */}
                                                <td>{row[10] || '-'}</td> {/* Chữ */}
                                                <td>-</td> {/* Kỳ hiện tại (Placeholder) */}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GradeTable;
