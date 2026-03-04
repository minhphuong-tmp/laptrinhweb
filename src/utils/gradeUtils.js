
// Helper to transform the raw grade array into a structured object
// Assumed structure based on GradeTable.jsx:
// [0: Index, 1: Year, 2: Semester, 3: Subject, ..., 8: CK, 9: TK, 10: Letter, 11: Credits, ...]
export const parseGrade = (row) => {
    if (!row) return null;
    return {
        id: row[0],
        year: row[1],
        semester: row[2],
        subjectName: row[3],
        credits: parseInt(row[11]) || 0,
        score10: parseFloat(row[9]) || 0, // Điểm Tổng kết thang 10
        letterGrade: row[10] ? row[10].trim().toUpperCase() : '',
        isPass: row[10] !== 'F' && row[10] !== ''
    };
};

export const getGradePoint = (letter) => {
    const map = {
        'A+': 4.0, 'A': 4.0,
        'B+': 3.5, 'B': 3.0,
        'C+': 2.5, 'C': 2.0,
        'D+': 1.5, 'D': 1.0,
        'F': 0.0
    };
    return map[letter] !== undefined ? map[letter] : 0.0;
};

export const calculateGPA = (grades) => {
    let totalPoints = 0;
    let totalCredits = 0;

    grades.forEach(g => {
        const parsed = parseGrade(g);
        if (parsed && parsed.credits > 0 && parsed.letterGrade) {
            totalPoints += getGradePoint(parsed.letterGrade) * parsed.credits;
            totalCredits += parsed.credits;
        }
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0.0;
};

export const analyzeGrades = (grades) => {
    const weakSubjects = []; // D, D+
    const failedSubjects = []; // F

    grades.forEach(g => {
        const parsed = parseGrade(g);
        if (!parsed) return;

        if (parsed.letterGrade === 'F') {
            failedSubjects.push(parsed);
        } else if (['D', 'D+'].includes(parsed.letterGrade)) {
            weakSubjects.push(parsed);
        }
    });

    return { weakSubjects, failedSubjects };
};

export const convertScoreToLetter = (score) => {
    const s = parseFloat(score);
    if (isNaN(s)) return '';
    if (s >= 8.5) return 'A'; // A+ is usually distinct but often treated as 4.0 like A. Let's use A for 8.5-10 unless specified. standard is 8.5-10 -> A (4.0), 9.0-10 sometimes A+
    // Actually, KMA (Học viện Kỹ thuật Mật mã) usually follows:
    // 8.5 - 10: A
    // 8.0 - 8.4: B+
    // 7.0 - 7.9: B
    // 6.5 - 6.9: C+
    // 5.5 - 6.4: C
    // 5.0 - 5.4: D+
    // 4.0 - 4.9: D
    // < 4.0: F
    // Let's stick to this common scale.
    if (s >= 8.5) return 'A';
    if (s >= 8.0) return 'B+';
    if (s >= 7.0) return 'B';
    if (s >= 6.5) return 'C+';
    if (s >= 5.5) return 'C';
    if (s >= 5.0) return 'D+';
    if (s >= 4.0) return 'D';
    return 'F';
};
