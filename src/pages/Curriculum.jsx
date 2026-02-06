import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import GradeTable from '../components/GradeTable';
import './Curriculum.css';
import './Curriculum.css';
import ReactMarkdown from 'react-markdown';


const Curriculum = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedMajor, setSelectedMajor] = useState('cntt'); // 'cntt', 'attm', 'dtvt' - bắt đầu với CNTT
    const [cachedGrades, setCachedGrades] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [tempGrades, setTempGrades] = useState(null);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);


    const handleEdit = () => {
        if (!cachedGrades) return;
        setTempGrades(JSON.parse(JSON.stringify(cachedGrades)));
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempGrades(null);
    };

    const handleSave = () => {
        setCachedGrades(tempGrades);
        // Persist to local storage so it survives reload
        localStorage.setItem('cached_grades', JSON.stringify(tempGrades));
        setIsEditing(false);
        setTempGrades(null);
    };

    const handleGradeChange = (rowIndex, colIndex, val) => {
        setTempGrades(prev => {
            const newGrades = [...prev];
            newGrades[rowIndex] = [...newGrades[rowIndex]];
            newGrades[rowIndex][colIndex] = val;

            // Mark as manual edit (using index 15 as flag)
            // Ensure array is long enough
            while (newGrades[rowIndex].length <= 15) newGrades[rowIndex].push('');
            newGrades[rowIndex][15] = 'true';

            return newGrades;
        });
    };

    const handleSuggestRoadmap = async () => {
        if (!cachedGrades || cachedGrades.length === 0) {
            alert('Bạn cần có dữ liệu điểm trước khi yêu cầu gợi ý!');
            return;
        }

        const currentMajorInfo = curriculumData.majors[selectedMajor];
        const currentRoadmap = curriculumData.roadmap[selectedMajor];

        setAiLoading(true);
        setAiSuggestion(null);

        try {
            const response = await fetch('http://localhost:3001/api/suggest-roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grades: cachedGrades,
                    major: currentMajorInfo.name,
                    curriculum: { roadmap: currentRoadmap }
                })
            });

            const data = await response.json();
            if (data.success) {
                setAiSuggestion(data.suggestion);
            } else {
                alert('Lỗi AI: ' + data.error);
            }
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            alert('Không thể kết nối đến server AI API.');
        } finally {
            setAiLoading(false);
        }
    };


    useEffect(() => {
        const cached = localStorage.getItem('cached_grades');
        if (cached) {
            try {
                setCachedGrades(JSON.parse(cached));
            } catch (e) {
                console.error("Failed to parse cached grades", e);
            }
        }
    }, []);

    // Mock data - Chương trình học theo ngành
    const [curriculumData, setCurriculumData] = useState({
        majors: {
            cntt: {
                name: 'Công nghệ thông tin',
                icon: '💻',
                description: 'Chương trình học được thiết kế nhằm trang bị cho các thành viên những kiến thức và kỹ năng cần thiết trong lĩnh vực Công nghệ thông tin, từ cơ bản đến nâng cao.',
                objectives: {
                    general: [
                        'Nâng cao kỹ năng lập trình và phát triển phần mềm',
                        'Rèn luyện tư duy logic và giải quyết vấn đề',
                        'Xây dựng nền tảng kiến thức vững chắc về CNTT',
                        'Phát triển kỹ năng làm việc nhóm và giao tiếp',
                        'Chuẩn bị hành trang cho sự nghiệp trong ngành CNTT'
                    ],
                    political: [
                        {
                            code: 'MT1',
                            text: 'Có lòng yêu nước, trung thành với Tổ quốc, với Đảng và Nhà nước Việt Nam'
                        },
                        {
                            code: 'MT2',
                            text: 'Chấp hành nghiêm chỉnh đường lối, chủ trương của Đảng, chính sách, pháp luật của Nhà nước'
                        },
                        {
                            code: 'MT3',
                            text: 'Có thế giới quan, nhân sinh quan đúng đắn, có đạo đức nghề nghiệp và trách nhiệm xã hội'
                        }
                    ],
                    knowledge: [
                        {
                            code: 'MT4',
                            text: 'Nắm vững những nguyên lý cơ bản của chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh'
                        },
                        {
                            code: 'MT5',
                            text: 'Vận dụng được các kiến thức toán học, khoa học máy tính vào việc phân tích và thiết kế hệ thống phần mềm'
                        },
                        {
                            code: 'MT6',
                            text: 'Có trình độ tiếng Anh tương đương Toeic 400 để đọc hiểu tài liệu chuyên ngành'
                        },
                        {
                            code: 'MT7',
                            text: 'Vận dụng được kiến thức cơ sở ngành và chuyên ngành để giải quyết các vấn đề kỹ thuật'
                        }
                    ]
                },
                conditions: {
                    requirements: [
                        'Là sinh viên đang học tại Học viện Kỹ thuật Mật mã',
                        'Có đam mê và quan tâm đến lĩnh vực Công nghệ thông tin',
                        'Cam kết tham gia đầy đủ các hoạt động của CLB',
                        'Có tinh thần học hỏi và hợp tác tốt',
                        'Đóng phí thành viên: 20,000 VNĐ/tháng'
                    ],
                    opportunities: [
                        {
                            title: 'Cơ hội học tập',
                            items: [
                                'Tham gia các khóa học miễn phí do CLB tổ chức',
                                'Tiếp cận với tài liệu học tập phong phú',
                                'Học hỏi từ các thành viên có kinh nghiệm',
                                'Tham gia các workshop và seminar chuyên đề'
                            ]
                        },
                        {
                            title: 'Cơ hội phát triển kỹ năng',
                            items: [
                                'Rèn luyện kỹ năng lập trình thông qua các dự án thực tế',
                                'Phát triển kỹ năng làm việc nhóm và giao tiếp',
                                'Nâng cao khả năng giải quyết vấn đề',
                                'Xây dựng portfolio cá nhân'
                            ]
                        },
                        {
                            title: 'Cơ hội nghề nghiệp',
                            items: [
                                'Kết nối với các doanh nghiệp trong ngành CNTT',
                                'Tham gia các chương trình thực tập và tuyển dụng',
                                'Nhận được giới thiệu việc làm từ CLB',
                                'Tham gia các cuộc thi và hackathon'
                            ]
                        },
                        {
                            title: 'Cơ hội mở rộng mạng lưới',
                            items: [
                                'Gặp gỡ và kết nối với các sinh viên cùng đam mê',
                                'Tham gia các hoạt động ngoại khóa và team building',
                                'Xây dựng mối quan hệ với các mentor và chuyên gia',
                                'Tham gia các sự kiện và hội thảo công nghệ'
                            ]
                        }
                    ]
                }
            },
            attm: {
                name: 'An toàn thông tin',
                icon: '🔒',
                description: 'Chương trình học chuyên sâu về bảo mật thông tin, mật mã học và các kỹ thuật bảo vệ hệ thống khỏi các mối đe dọa an ninh mạng.',
                objectives: {
                    general: [
                        'Nắm vững các nguyên lý và kỹ thuật bảo mật thông tin',
                        'Rèn luyện kỹ năng phân tích và đánh giá rủi ro bảo mật',
                        'Xây dựng nền tảng kiến thức về mật mã học và an ninh mạng',
                        'Phát triển kỹ năng ethical hacking và penetration testing',
                        'Chuẩn bị hành trang cho sự nghiệp trong lĩnh vực an toàn thông tin'
                    ],
                    political: [
                        {
                            code: 'MT1',
                            text: 'Có lòng yêu nước, trung thành với Tổ quốc, với Đảng và Nhà nước Việt Nam'
                        },
                        {
                            code: 'MT2',
                            text: 'Chấp hành nghiêm chỉnh đường lối, chủ trương của Đảng, chính sách, pháp luật của Nhà nước'
                        },
                        {
                            code: 'MT3',
                            text: 'Có thế giới quan, nhân sinh quan đúng đắn, có đạo đức nghề nghiệp và trách nhiệm xã hội'
                        }
                    ],
                    knowledge: [
                        {
                            code: 'MT4',
                            text: 'Nắm vững những nguyên lý cơ bản của chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh'
                        },
                        {
                            code: 'MT5',
                            text: 'Vận dụng được các kiến thức toán học, mật mã học vào việc phân tích và thiết kế hệ thống bảo mật'
                        },
                        {
                            code: 'MT6',
                            text: 'Có trình độ tiếng Anh tương đương Toeic 400 để đọc hiểu tài liệu chuyên ngành'
                        },
                        {
                            code: 'MT7',
                            text: 'Vận dụng được kiến thức về an toàn thông tin để bảo vệ hệ thống khỏi các mối đe dọa'
                        }
                    ]
                },
                conditions: {
                    requirements: [
                        'Là sinh viên đang học tại Học viện Kỹ thuật Mật mã',
                        'Có đam mê và quan tâm đến lĩnh vực An toàn thông tin',
                        'Cam kết tham gia đầy đủ các hoạt động của CLB',
                        'Có tinh thần học hỏi và hợp tác tốt',
                        'Đóng phí thành viên: 20,000 VNĐ/tháng'
                    ],
                    opportunities: [
                        {
                            title: 'Cơ hội học tập',
                            items: [
                                'Tham gia các khóa học về bảo mật và mật mã học',
                                'Tiếp cận với các công cụ và kỹ thuật bảo mật mới nhất',
                                'Học hỏi từ các chuyên gia bảo mật hàng đầu',
                                'Tham gia các cuộc thi CTF (Capture The Flag)'
                            ]
                        },
                        {
                            title: 'Cơ hội phát triển kỹ năng',
                            items: [
                                'Rèn luyện kỹ năng ethical hacking và penetration testing',
                                'Phát triển khả năng phân tích và đánh giá rủi ro',
                                'Nâng cao kỹ năng bảo vệ hệ thống khỏi tấn công',
                                'Xây dựng portfolio về các dự án bảo mật'
                            ]
                        },
                        {
                            title: 'Cơ hội nghề nghiệp',
                            items: [
                                'Kết nối với các công ty bảo mật và an ninh mạng',
                                'Tham gia các chương trình thực tập tại các tổ chức chính phủ',
                                'Nhận được chứng chỉ bảo mật quốc tế',
                                'Tham gia các dự án bảo mật thực tế'
                            ]
                        },
                        {
                            title: 'Cơ hội mở rộng mạng lưới',
                            items: [
                                'Gặp gỡ các chuyên gia bảo mật trong ngành',
                                'Tham gia các hội thảo và sự kiện an ninh mạng',
                                'Xây dựng mối quan hệ với các tổ chức bảo mật',
                                'Tham gia các cộng đồng hacker có đạo đức'
                            ]
                        }
                    ]
                }
            },
            dtvt: {
                name: 'Điện tử viễn thông',
                icon: '📡',
                description: 'Chương trình học về thiết kế và phát triển hệ thống điện tử, viễn thông và các ứng dụng IoT, từ lý thuyết đến thực hành.',
                objectives: {
                    general: [
                        'Nắm vững các nguyên lý và kỹ thuật điện tử, viễn thông',
                        'Rèn luyện kỹ năng thiết kế và phát triển hệ thống nhúng',
                        'Xây dựng nền tảng kiến thức về mạch điện tử và viễn thông',
                        'Phát triển kỹ năng lập trình vi điều khiển và IoT',
                        'Chuẩn bị hành trang cho sự nghiệp trong lĩnh vực điện tử viễn thông'
                    ],
                    political: [
                        {
                            code: 'MT1',
                            text: 'Có lòng yêu nước, trung thành với Tổ quốc, với Đảng và Nhà nước Việt Nam'
                        },
                        {
                            code: 'MT2',
                            text: 'Chấp hành nghiêm chỉnh đường lối, chủ trương của Đảng, chính sách, pháp luật của Nhà nước'
                        },
                        {
                            code: 'MT3',
                            text: 'Có thế giới quan, nhân sinh quan đúng đắn, có đạo đức nghề nghiệp và trách nhiệm xã hội'
                        }
                    ],
                    knowledge: [
                        {
                            code: 'MT4',
                            text: 'Nắm vững những nguyên lý cơ bản của chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh'
                        },
                        {
                            code: 'MT5',
                            text: 'Vận dụng được các kiến thức toán học, vật lý vào việc phân tích và thiết kế các hệ thống điện tử, viễn thông'
                        },
                        {
                            code: 'MT6',
                            text: 'Có trình độ tiếng Anh tương đương Toeic 400 để đọc hiểu tài liệu chuyên ngành'
                        },
                        {
                            code: 'MT7',
                            text: 'Vận dụng được kiến thức về điện tử viễn thông để thiết kế và phát triển hệ thống nhúng'
                        }
                    ]
                },
                conditions: {
                    requirements: [
                        'Là sinh viên đang học tại Học viện Kỹ thuật Mật mã',
                        'Có đam mê và quan tâm đến lĩnh vực Điện tử viễn thông',
                        'Cam kết tham gia đầy đủ các hoạt động của CLB',
                        'Có tinh thần học hỏi và hợp tác tốt',
                        'Đóng phí thành viên: 20,000 VNĐ/tháng'
                    ],
                    opportunities: [
                        {
                            title: 'Cơ hội học tập',
                            items: [
                                'Tham gia các khóa học về mạch điện tử và viễn thông',
                                'Tiếp cận với các thiết bị và công cụ thiết kế chuyên nghiệp',
                                'Học hỏi từ các kỹ sư điện tử có kinh nghiệm',
                                'Tham gia các workshop về IoT và hệ thống nhúng'
                            ]
                        },
                        {
                            title: 'Cơ hội phát triển kỹ năng',
                            items: [
                                'Rèn luyện kỹ năng thiết kế mạch điện tử',
                                'Phát triển khả năng lập trình vi điều khiển',
                                'Nâng cao kỹ năng phát triển hệ thống IoT',
                                'Xây dựng portfolio về các dự án điện tử'
                            ]
                        },
                        {
                            title: 'Cơ hội nghề nghiệp',
                            items: [
                                'Kết nối với các công ty điện tử và viễn thông',
                                'Tham gia các chương trình thực tập tại các nhà máy sản xuất',
                                'Nhận được giới thiệu việc làm từ CLB',
                                'Tham gia các cuộc thi thiết kế điện tử'
                            ]
                        },
                        {
                            title: 'Cơ hội mở rộng mạng lưới',
                            items: [
                                'Gặp gỡ các kỹ sư điện tử trong ngành',
                                'Tham gia các hội thảo và triển lãm công nghệ',
                                'Xây dựng mối quan hệ với các nhà sản xuất',
                                'Tham gia các cộng đồng phát triển IoT'
                            ]
                        }
                    ]
                }
            }
        },
        courses: [
            {
                id: 1,
                title: 'Lập trình Cơ bản',
                level: 'Cơ bản',
                major: 'cntt',
                duration: '12 tuần',
                description: 'Khóa học giới thiệu về lập trình, các khái niệm cơ bản, cú pháp và logic lập trình.',
                topics: [
                    'Giới thiệu về lập trình',
                    'Biến, kiểu dữ liệu và toán tử',
                    'Cấu trúc điều khiển (if/else, switch)',
                    'Vòng lặp (for, while)',
                    'Hàm và thủ tục',
                    'Mảng và chuỗi'
                ],
                instructor: 'Nguyễn Văn A',
                schedule: 'Thứ 2, 4, 6 - 19:00-21:00'
            },
            {
                id: 2,
                title: 'Lập trình Hướng đối tượng',
                level: 'Trung bình',
                major: 'cntt',
                duration: '10 tuần',
                description: 'Học về OOP, các nguyên lý thiết kế và mẫu thiết kế phổ biến.',
                topics: [
                    'Khái niệm OOP',
                    'Class và Object',
                    'Kế thừa và Đa hình',
                    'Encapsulation và Abstraction',
                    'Interface và Abstract Class',
                    'Design Patterns cơ bản'
                ],
                instructor: 'Trần Thị B',
                schedule: 'Thứ 3, 5 - 19:00-21:00'
            },
            {
                id: 3,
                title: 'Web Development',
                level: 'Trung bình - Nâng cao',
                major: 'cntt',
                duration: '16 tuần',
                description: 'Xây dựng ứng dụng web hiện đại với HTML, CSS, JavaScript và các framework.',
                topics: [
                    'HTML5 và CSS3',
                    'JavaScript ES6+',
                    'React.js Framework',
                    'Node.js và Express',
                    'Database và API',
                    'Deployment và DevOps'
                ],
                instructor: 'Lê Văn C',
                schedule: 'Thứ 7, Chủ nhật - 14:00-17:00'
            },
            {
                id: 4,
                title: 'Cấu trúc Dữ liệu và Giải thuật',
                level: 'Nâng cao',
                major: 'cntt',
                duration: '14 tuần',
                description: 'Nâng cao kỹ năng giải quyết vấn đề với các cấu trúc dữ liệu và thuật toán hiệu quả.',
                topics: [
                    'Mảng, Danh sách liên kết',
                    'Stack và Queue',
                    'Tree và Graph',
                    'Sorting và Searching',
                    'Dynamic Programming',
                    'Greedy Algorithms'
                ],
                instructor: 'Phạm Văn D',
                schedule: 'Thứ 2, 4 - 19:00-21:00'
            },
            {
                id: 5,
                title: 'Database và SQL',
                level: 'Trung bình',
                major: 'cntt',
                duration: '8 tuần',
                description: 'Học về thiết kế cơ sở dữ liệu, SQL và quản lý dữ liệu hiệu quả.',
                topics: [
                    'Mô hình dữ liệu quan hệ',
                    'SQL cơ bản và nâng cao',
                    'Normalization',
                    'Indexing và Optimization',
                    'NoSQL Databases',
                    'Database Design Patterns'
                ],
                instructor: 'Hoàng Thị E',
                schedule: 'Thứ 3, 5 - 19:00-21:00'
            },
            {
                id: 6,
                title: 'Mobile App Development',
                level: 'Nâng cao',
                major: 'cntt',
                duration: '12 tuần',
                description: 'Phát triển ứng dụng di động với React Native hoặc Flutter.',
                topics: [
                    'React Native Basics',
                    'Navigation và State Management',
                    'API Integration',
                    'Native Modules',
                    'Testing và Debugging',
                    'Publishing Apps'
                ],
                instructor: 'Vũ Văn F',
                schedule: 'Thứ 6, Chủ nhật - 19:00-21:00'
            },
            // An toàn thông tin
            {
                id: 7,
                title: 'Bảo mật Mạng và Hệ thống',
                level: 'Trung bình',
                major: 'attm',
                duration: '14 tuần',
                description: 'Học về các kỹ thuật bảo mật mạng, firewall, IDS/IPS và bảo vệ hệ thống.',
                topics: [
                    'Nguyên lý bảo mật mạng',
                    'Firewall và Access Control',
                    'Intrusion Detection System',
                    'VPN và Tunneling',
                    'Security Policies',
                    'Network Monitoring'
                ],
                instructor: 'Trần An Toàn',
                schedule: 'Thứ 2, 4 - 19:00-21:00'
            },
            {
                id: 8,
                title: 'Mật mã học và Ứng dụng',
                level: 'Nâng cao',
                major: 'attm',
                duration: '12 tuần',
                description: 'Nghiên cứu về mật mã học, các thuật toán mã hóa và ứng dụng trong bảo mật.',
                topics: [
                    'Mật mã đối xứng và bất đối xứng',
                    'Hash Functions',
                    'Digital Signatures',
                    'Public Key Infrastructure',
                    'SSL/TLS Protocol',
                    'Cryptographic Attacks'
                ],
                instructor: 'Lê Bảo Mật',
                schedule: 'Thứ 3, 5 - 19:00-21:00'
            },
            {
                id: 9,
                title: 'Ethical Hacking và Penetration Testing',
                level: 'Nâng cao',
                major: 'attm',
                duration: '16 tuần',
                description: 'Học về kỹ thuật tấn công và phòng thủ, kiểm thử bảo mật hệ thống.',
                topics: [
                    'Reconnaissance và Scanning',
                    'Vulnerability Assessment',
                    'Exploitation Techniques',
                    'Post-Exploitation',
                    'Web Application Security',
                    'Report Writing'
                ],
                instructor: 'Phạm Hacker',
                schedule: 'Thứ 7, Chủ nhật - 14:00-17:00'
            },
            // Điện tử viễn thông
            {
                id: 10,
                title: 'Mạch Điện tử Cơ bản',
                level: 'Cơ bản',
                major: 'dtvt',
                duration: '10 tuần',
                description: 'Giới thiệu về mạch điện tử, linh kiện và nguyên lý hoạt động.',
                topics: [
                    'Linh kiện điện tử cơ bản',
                    'Mạch điện DC và AC',
                    'Transistor và MOSFET',
                    'Op-Amp và ứng dụng',
                    'Mạch khuếch đại',
                    'Mạch dao động'
                ],
                instructor: 'Hoàng Điện Tử',
                schedule: 'Thứ 2, 4 - 19:00-21:00'
            },
            {
                id: 11,
                title: 'Viễn thông và Truyền dữ liệu',
                level: 'Trung bình',
                major: 'dtvt',
                duration: '12 tuần',
                description: 'Học về hệ thống viễn thông, truyền dữ liệu và các giao thức mạng.',
                topics: [
                    'Nguyên lý truyền thông',
                    'Modulation và Demodulation',
                    'Mạng viễn thông',
                    'Wireless Communication',
                    '5G và IoT',
                    'Network Protocols'
                ],
                instructor: 'Vũ Viễn Thông',
                schedule: 'Thứ 3, 5 - 19:00-21:00'
            },
            {
                id: 12,
                title: 'Thiết kế Hệ thống Nhúng',
                level: 'Nâng cao',
                major: 'dtvt',
                duration: '14 tuần',
                description: 'Thiết kế và phát triển hệ thống nhúng với vi điều khiển và IoT.',
                topics: [
                    'Vi điều khiển ARM',
                    'Embedded Linux',
                    'RTOS và Real-time Systems',
                    'Sensors và Actuators',
                    'IoT Protocols',
                    'Hardware-Software Co-design'
                ],
                instructor: 'Nguyễn Nhúng',
                schedule: 'Thứ 6, Chủ nhật - 19:00-21:00'
            }
        ],
        roadmap: {
            cntt: [
                {
                    semester: 'Học kỳ 1',
                    duration: 'Tổng số tín chỉ: 20',
                    courses: [
                        'Toán cao cấp A1 (3 tín chỉ)',
                        'Toán cao cấp A3 (3 tín chỉ)',
                        'Tin học đại cương (2 tín chỉ)',
                        'Triết học Mác - Lênin (3 tín chỉ)',
                        'Giáo dục quốc phòng an ninh (8 tín chỉ)',
                        'Giáo dục thể chất 1 (1 tín chỉ)'
                    ]
                },
                {
                    semester: 'Học kỳ 2',
                    duration: 'Tổng số tín chỉ: 18',
                    courses: [
                        'Vật lý đại cương A1 (3 tín chỉ)',
                        'Toán cao cấp A2 (3 tín chỉ)',
                        'Lập trình căn bản (3 tín chỉ)',
                        'Kinh tế chính trị Mác - Lênin (2 tín chỉ)',
                        'Khoa học quản lý (2 tín chỉ)',
                        'Lịch sử Đảng Cộng sản Việt Nam (2 tín chỉ)',
                        'Giáo dục thể chất 2 (1 tín chỉ)',
                        'Kỹ năng mềm (2 tín chỉ)'
                    ]
                },
                {
                    semester: 'Học kỳ 3',
                    duration: 'Tổng số tín chỉ: 18',
                    courses: [
                        'Vật lý đại cương A2 (3 tín chỉ)',
                        'Thực hành vật lý đại cương 1&2 (2 tín chỉ)',
                        'Tiếng Anh 1 (3 tín chỉ)',
                        'Toán xác suất thống kê (2 tín chỉ)',
                        'Phương pháp tính (2 tín chỉ)',
                        'Công nghệ mạng máy tính (3 tín chỉ)',
                        'Tư tưởng Hồ Chí Minh (2 tín chỉ)',
                        'Giáo dục thể chất 3 (1 tín chỉ)'
                    ]
                },
                {
                    semester: 'Học kỳ 4',
                    duration: 'Tổng số tín chỉ: 19',
                    courses: [
                        'Tiếng Anh 2 (3 tín chỉ)',
                        'Toán rời rạc (2 tín chỉ)',
                        'Quản trị mạng máy tính (2 tín chỉ)',
                        'Otomat và ngôn ngữ hình thức (2 tín chỉ)',
                        'Chương trình dịch (2 tín chỉ)',
                        'Lý thuyết cơ sở dữ liệu (2 tín chỉ)',
                        'Điện tử tương tự và điện tử số (3 tín chỉ)',
                        'Giáo dục thể chất 4 (1 tín chỉ)',
                        'Chủ Nghĩa xã hội Khoa học (2 tín chỉ)'
                    ]
                },
                {
                    semester: 'Học kỳ 5',
                    duration: 'Tổng số tín chỉ: 19',
                    courses: [
                        'Tiếng Anh 3 (4 tín chỉ)',
                        'Lập trình hướng đối tượng (2 tín chỉ)',
                        'Cấu trúc dữ liệu và giải thuật (2 tín chỉ)',
                        'Hệ quản trị cơ sở dữ liệu (2 tín chỉ)',
                        'Kỹ thuật vi xử lý (2 tín chỉ)',
                        'Cơ sở lý thuyết truyền tin (2 tín chỉ)',
                        'Giáo dục thể chất 5 (1 tín chỉ)'
                    ]
                },
                {
                    semester: 'Học kỳ 6',
                    duration: 'Tổng số tín chỉ: 22',
                    courses: [
                        'Tiếng Anh chuyên ngành (4 tín chỉ)',
                        'Kiến trúc máy tính (2 tín chỉ)',
                        'Nguyên lý hệ điều hành (2 tín chỉ)',
                        'Phát triển ứng dụng web (2 tín chỉ)',
                        'Công nghệ phần mềm (2 tín chỉ)',
                        'Phân tích, thiết kế hệ thống thông tin (2 tín chỉ)',
                        'Xử lý tín hiệu số (2 tín chỉ)',
                        'Kỹ thuật truyền số liệu (2 tín chỉ)',
                        'Hệ thống viễn thông (2 tín chỉ)',

                    ]
                },
                {
                    semester: 'Học kỳ 7',
                    duration: 'Tổng số tín chỉ: 23',
                    courses: [
                        'Thiết kế hệ thống nhúng (3 tín chỉ)',
                        'Công nghệ phần mềm nhúng (2 tín chỉ)',
                        'Lý thuyết độ phức tạp tính toán (2 tín chỉ)',
                        'Hệ thống thông tin di động (2 tín chỉ)',
                        'Linux và phần mềm nguồn mở (2 tín chỉ)',
                        'Lập trình hợp ngữ (3 tín chỉ)',
                        'Quản trị dự án phần mềm (2 tín chỉ)',
                        'Thực tập cơ sở chuyên ngành (3 tín chỉ)',
                        'Phát triển phần mềm ứng dụng (2 tín chỉ)',

                    ]
                },
                {
                    semester: 'Học kỳ 8',
                    duration: 'Tổng số tín chỉ: 20',
                    courses: [
                        'Lập trình nhân Linux (4 tín chỉ)',
                        'Lập trình driver (4 tín chỉ)',
                        'Hệ điều hành nhúng thời gian thực (3 tín chỉ)',
                        'Kiểm thử phần mềm nhúng (2 tín chỉ)',
                        'Lập trình Android cơ bản (3 tín chỉ)',
                        'Cơ sở an toàn và bảo mật thông tin (3 tín chỉ)',

                    ]
                },
                {
                    semester: 'Học kỳ 9',
                    duration: 'Tổng số tín chỉ: 24',
                    courses: [


                        'Phát triển phần mềm trong thẻ thông minh (3 tín chỉ)',
                        'Lập trình Android nâng cao (3 tín chỉ)',
                        'Phát triển game trên Android (3 tín chỉ)',
                        'An toàn và bảo mật trong phát triển phần mềm di động (3 tín chỉ)',
                        'Tối ưu phần mềm di động (3 tín chỉ)'
                    ]
                },
                {
                    semester: 'Học kỳ 10',
                    duration: 'Tổng số tín chỉ: 11',
                    courses: [
                        'Thực tập tốt nghiệp (3 tín chỉ)',
                        'Đồ án tốt nghiệp (8 tín chỉ)'
                    ]
                }
            ],
            attm: [
                {
                    semester: 'Học kỳ 1',
                    courses: ['Lập trình Cơ bản', 'Toán cao cấp A2'],
                    duration: 'Đang cập nhật'
                }
            ],
            dtvt: [
                {
                    semester: 'Học kỳ 1',
                    courses: ['Mạch điện tử', 'Toán cao cấp A1'],
                    duration: 'Đang cập nhật'
                }
            ]
        },
        conditions: {
            requirements: [
                'Là sinh viên đang học tại Học viện Kỹ thuật Mật mã',
                'Có đam mê và quan tâm đến lĩnh vực Công nghệ thông tin',
                'Cam kết tham gia đầy đủ các hoạt động của CLB',
                'Có tinh thần học hỏi và hợp tác tốt',
                'Đóng phí thành viên: 20,000 VNĐ/tháng'
            ],
            opportunities: [
                {
                    title: 'Cơ hội học tập',
                    items: [
                        'Tham gia các khóa học miễn phí do CLB tổ chức',
                        'Tiếp cận với tài liệu học tập phong phú',
                        'Học hỏi từ các thành viên có kinh nghiệm',
                        'Tham gia các workshop và seminar chuyên đề'
                    ]
                },
                {
                    title: 'Cơ hội phát triển kỹ năng',
                    items: [
                        'Rèn luyện kỹ năng lập trình thông qua các dự án thực tế',
                        'Phát triển kỹ năng làm việc nhóm và giao tiếp',
                        'Nâng cao khả năng giải quyết vấn đề',
                        'Xây dựng portfolio cá nhân'
                    ]
                },
                {
                    title: 'Cơ hội nghề nghiệp',
                    items: [
                        'Kết nối với các doanh nghiệp trong ngành CNTT',
                        'Tham gia các chương trình thực tập và tuyển dụng',
                        'Nhận được giới thiệu việc làm từ CLB',
                        'Tham gia các cuộc thi và hackathon'
                    ]
                },
                {
                    title: 'Cơ hội mở rộng mạng lưới',
                    items: [
                        'Gặp gỡ và kết nối với các sinh viên cùng đam mê',
                        'Tham gia các hoạt động ngoại khóa và team building',
                        'Xây dựng mối quan hệ với các mentor và chuyên gia',
                        'Tham gia các sự kiện và hội thảo công nghệ'
                    ]
                }
            ]
        }
    });

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải chương trình học...</p>
                </div>
            </div>
        );
    }

    // Filter courses by major
    const filteredCourses = curriculumData.courses.filter(course => course.major === selectedMajor);

    const majorOptions = [
        { value: 'cntt', label: 'Công nghệ thông tin', icon: '💻' },
        { value: 'attm', label: 'An toàn thông tin', icon: '🔒' },
        { value: 'dtvt', label: 'Điện tử viễn thông', icon: '📡' }
    ];

    const currentMajor = curriculumData.majors[selectedMajor];

    return (
        <div className="page-content">
            <div className="curriculum-container">
                {/* Hero Section */}
                <div className="curriculum-hero">
                    <div className="hero-content">
                        <h1 className="hero-title">Chương trình học CLB Tin học KMA</h1>
                        <p className="hero-description">
                            Khám phá lộ trình học tập chi tiết cho từng chuyên ngành,
                            được thiết kế để giúp bạn phát triển toàn diện.
                        </p>
                    </div>
                </div>

                {/* AI Suggestion Section - Placed prominently */}
                <div className="ai-roadmap-section">
                    <div className="ai-header">
                        <div className="ai-title">
                            <span className="icon-sparkle">✨</span>
                            Gợi ý Lộ trình AI
                        </div>
                        <button
                            className="btn-ai-suggest"
                            onClick={handleSuggestRoadmap}
                            disabled={aiLoading}
                        >
                            {aiLoading ? 'Đang phân tích...' : 'Gợi ý lộ trình cho tôi'}
                        </button>
                    </div>

                    {aiSuggestion && (
                        <div className="ai-result">
                            <ReactMarkdown>{aiSuggestion}</ReactMarkdown>
                        </div>
                    )}
                    {aiLoading && <div className="ai-loading-text">Đang phân tích bảng điểm của bạn... (Có thể mất vài giây)</div>}
                    {!aiSuggestion && !aiLoading && (
                        <p style={{ color: '#718096', fontStyle: 'italic' }}>
                            Nhấn nút để AI phân tích điểm và gợi ý môn học tiếp theo cho bạn.
                        </p>
                    )}
                </div>


                {/* Filter by Major */}
                < div className="major-filters" >
                    {
                        majorOptions.map((option) => (
                            <button
                                key={option.value}
                                className={`major-filter-btn ${selectedMajor === option.value ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedMajor(option.value);
                                }}
                            >
                                <span className="filter-icon">{option.icon}</span>
                                <span className="filter-label">{option.label}</span>
                            </button>
                        ))
                    }
                </div >

                {/* Progress Section (Previously Tabbed) */}
                < div className="curriculum-section" >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="section-title" style={{ marginBottom: 0 }}>Tiến độ học tập (Bảng điểm)</h2>
                        <div className="edit-controls">
                            {!isEditing ? (
                                <button
                                    onClick={handleEdit}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#3182ce',
                                        color: 'white',
                                        borderRadius: '4px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Chỉnh sửa
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={handleSave}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#38a169',
                                            color: 'white',
                                            borderRadius: '4px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Lưu
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#e53e3e',
                                            color: 'white',
                                            borderRadius: '4px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {
                        (() => {
                            // --- CALCULATION LOGIC ---
                            const roadmap = curriculumData.roadmap[selectedMajor] || [];
                            const matchedIndices = new Set();
                            const mapSubjectToGrade = {};
                            const normalize = (str) => str ? str.normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ') : '';
                            const matchedSubjectNames = new Set();

                            // Use tempGrades if editing, else cachedGrades
                            const displayGrades = isEditing ? tempGrades : cachedGrades;

                            const aliases = {
                                'toán cao cấp a3': ['đại số tuyến tính'],
                                'otomat và ngôn ngữ hình thức': ['ôtômát và ngôn ngữ hình thức'],
                                'công nghệ mạng máy tính': ['công nghệ mạng máy tính (mạng máy tính)', 'mạng máy tính']
                            };

                            // 1. Match Grades to Roadmap
                            roadmap.forEach(semester => {
                                semester.courses.forEach(courseStr => {
                                    const match = courseStr.match(/^(.*?)\s*\((\d+)\s*tín chỉ\)$/);
                                    const subjectNameRaw = match ? match[1] : courseStr;
                                    const subjectNameNorm = normalize(subjectNameRaw);

                                    if (displayGrades) {
                                        // Find ALL matching rows
                                        const allMatches = displayGrades.map((row, index) => ({ row, index })).filter(({ row }) => {
                                            const rowSubject = normalize(row[3]);
                                            const rowSubjectClean = rowSubject.replace(/\s*\(.*\).*$/, '');

                                            if (rowSubject === subjectNameNorm || rowSubjectClean === subjectNameNorm) return true;

                                            const subjectAliases = aliases[subjectNameNorm];
                                            if (subjectAliases) {
                                                return subjectAliases.some(alias => rowSubject === alias || rowSubjectClean === alias);
                                            }
                                            return false;
                                        });

                                        if (allMatches.length > 0) {
                                            // Sort to find the "best" match (prioritize valid scores)
                                            allMatches.sort((a, b) => {
                                                const scoreA = parseFloat(a.row[9]); // TK
                                                const scoreB = parseFloat(b.row[9]);
                                                const hasScoreA = !isNaN(scoreA);
                                                const hasScoreB = !isNaN(scoreB);

                                                if (hasScoreA && !hasScoreB) return -1; // A comes first
                                                if (!hasScoreA && hasScoreB) return 1;  // B comes first

                                                if (hasScoreA && hasScoreB) {
                                                    if (scoreA !== scoreB) return scoreB - scoreA; // Descending score

                                                    // Tie-breaker: Prioritize non-F grades
                                                    const letterA = a.row[10] || '';
                                                    const letterB = b.row[10] || '';
                                                    const isFailA = letterA === 'F' || letterA === 'F+';
                                                    const isFailB = letterB === 'F' || letterB === 'F+';

                                                    if (isFailA && !isFailB) return 1; // B is better
                                                    if (!isFailA && isFailB) return -1; // A is better
                                                }
                                                return 0;
                                            });

                                            const bestMatch = allMatches[0];

                                            // Mark ALL matches as used so they don't appear in Unmapped
                                            allMatches.forEach(m => matchedIndices.add(m.index));

                                            mapSubjectToGrade[courseStr] = { row: bestMatch.row, index: bestMatch.index };
                                            matchedSubjectNames.add(normalize(bestMatch.row[3]));
                                        }
                                    }
                                });
                            });

                            // 2. Identify Unmapped & Deduplicate
                            const rawUnmapped = displayGrades ? displayGrades.map((row, idx) => ({ row, index: idx })).filter((item) => {
                                const { row, index: idx } = item;
                                if (matchedIndices.has(idx)) return false;
                                const subject = row[3];
                                if (!subject || subject === '---' || subject === 'Môn học') return false;
                                if (matchedSubjectNames.has(normalize(subject))) return false;
                                return true;
                            }) : [];

                            // Deduplicate Unmapped: Group by name, pick best score
                            const unmappedMap = new Map();
                            rawUnmapped.forEach(item => {
                                const name = normalize(item.row[3]);
                                if (!unmappedMap.has(name)) {
                                    unmappedMap.set(name, []);
                                }
                                unmappedMap.get(name).push(item);
                            });

                            const unmapped = [];
                            unmappedMap.forEach((items) => {
                                // Sort same way as matched: Score Desc, then Pass over Fail
                                items.sort((a, b) => {
                                    const scoreA = parseFloat(a.row[9]);
                                    const scoreB = parseFloat(b.row[9]);
                                    const hasScoreA = !isNaN(scoreA);
                                    const hasScoreB = !isNaN(scoreB);

                                    if (hasScoreA && !hasScoreB) return -1;
                                    if (!hasScoreA && hasScoreB) return 1;
                                    if (hasScoreA && hasScoreB) {
                                        if (scoreA !== scoreB) return scoreB - scoreA;
                                        // letter grade tie breaker
                                        const letterA = a.row[10] || '';
                                        const letterB = b.row[10] || '';
                                        const isFailA = letterA === 'F' || letterA === 'F+';
                                        const isFailB = letterB === 'F' || letterB === 'F+';
                                        if (isFailA && !isFailB) return 1;
                                        if (!isFailA && isFailB) return -1;
                                    }
                                    return 0;
                                });
                                unmapped.push(items[0]);
                            });

                            // 3. Calculate Stats
                            let totalCredits = 0;
                            let learnedCredits = 0;

                            // Roadmap Credits
                            roadmap.forEach(semester => {
                                semester.courses.forEach(courseStr => {
                                    const match = courseStr.match(/\((\d+)\s*tín chỉ\)/);
                                    const credits = match ? parseInt(match[1], 10) : 0;
                                    totalCredits += credits;
                                    if (mapSubjectToGrade[courseStr]) {
                                        learnedCredits += credits;
                                    }
                                });
                            });

                            // Unmapped Credits
                            unmapped.forEach(item => {
                                const row = item.row;
                                const credit = parseInt(row[11], 10);
                                if (!isNaN(credit)) {
                                    learnedCredits += credit;
                                }
                            });

                            // Calculate Avg Score
                            const allGrades = [...Object.values(mapSubjectToGrade).map(x => x.row), ...unmapped.map(x => x.row)];
                            const validScoreGrades = allGrades.filter(g => g && !isNaN(parseFloat(g[9])));
                            const avgScore = validScoreGrades.length > 0
                                ? (validScoreGrades.reduce((sum, g) => sum + (parseFloat(g[9]) || 0), 0) / validScoreGrades.length).toFixed(2)
                                : 0;

                            return (
                                <>
                                    {/* STATS SECTION */}
                                    <div className="progress-stats">
                                        <div className="stats-row">
                                            <div className="stat-box">
                                                <div className="stat-val">{learnedCredits} (Đã học) / {totalCredits} (Tổng)</div>
                                                <div className="stat-lbl">Tín chỉ</div>
                                            </div>
                                            <div className="stat-box">
                                                <div className="stat-val">{avgScore}</div>
                                                <div className="stat-lbl">Điểm trung bình (TK)</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* WARNING / SUMMARY */}
                                    {!displayGrades && (
                                        <div className="no-grades-warning" style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: '8px', border: '1px solid #ffeeba' }}>
                                            ⚠️ Chưa có dữ liệu điểm. <Link to="/grades-login">Cập nhật ngay</Link> để xem kết quả thực tế. Dưới đây là lộ trình mẫu.
                                        </div>
                                    )}
                                    {displayGrades && (
                                        <div className="data-summary" style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#718096' }}>
                                            Đã tải {displayGrades.length} bản ghi. {isEditing && <span style={{ color: 'red', fontWeight: 'bold' }}>Đang chỉnh sửa...</span>}
                                        </div>
                                    )}

                                    {/* ROADMAP SECTION */}
                                    <div className="progress-roadmap">
                                        {/* Render Roadmap */}
                                        {roadmap.map((semester, semIndex) => {
                                            // Calculate dynamic credits
                                            const semTotalCredits = semester.courses.reduce((acc, courseStr) => {
                                                const match = courseStr.match(/\((\d+)\s*tín chỉ\)/);
                                                return acc + (match ? parseInt(match[1], 10) : 0);
                                            }, 0);

                                            const semLearnedCredits = semester.courses.reduce((acc, courseStr) => {
                                                const gradeEntry = mapSubjectToGrade[courseStr];
                                                if (gradeEntry) {
                                                    const match = courseStr.match(/\((\d+)\s*tín chỉ\)/);
                                                    return acc + (match ? parseInt(match[1], 10) : 0);
                                                }
                                                return acc;
                                            }, 0);

                                            return (
                                                <div key={semIndex} className="semester-block">
                                                    <h3 className="semester-title">
                                                        {semester.semester}
                                                        <span className="semester-credits">
                                                            ({semLearnedCredits}/{semTotalCredits} tín chỉ)
                                                        </span>
                                                    </h3>
                                                    <div className="semester-table-wrapper">
                                                        <table className="grades-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Môn học</th>
                                                                    <th>Tín chỉ</th>
                                                                    <th>GK(TP1)</th>
                                                                    <th>CC(TP2)</th>
                                                                    <th>Điểm CK</th>
                                                                    <th>Điểm TK</th>
                                                                    <th>Điểm chữ</th>
                                                                    <th>Trạng thái</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {semester.courses.map((courseStr, cIndex) => {
                                                                    const match = courseStr.match(/^(.*?)\s*\((\d+)\s*tín chỉ\)$/);
                                                                    const subjectName = match ? match[1] : courseStr;
                                                                    const credits = match ? match[2] : '?';

                                                                    const entry = mapSubjectToGrade[courseStr];
                                                                    const gradeRow = entry ? entry.row : null;
                                                                    const gradeIndex = entry ? entry.index : null;

                                                                    const isCompleted = !!gradeRow;
                                                                    const letterGrade = gradeRow ? gradeRow[10] : '';
                                                                    const isFail = letterGrade === 'F' || letterGrade === 'F+';

                                                                    let statusClass = 'status-pending';
                                                                    if (isCompleted) statusClass = isFail ? 'status-fail' : 'status-pass';
                                                                    if (gradeRow && gradeRow[15] === 'true') statusClass += ' manual-edit'; // If we use flag

                                                                    const renderInput = (colIdx, val) => (
                                                                        <input
                                                                            type="text"
                                                                            value={val || ''}
                                                                            onChange={(e) => handleGradeChange(gradeIndex, colIdx, e.target.value)}
                                                                            className="grade-edit-input"
                                                                            style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                                                                        />
                                                                    );

                                                                    return (
                                                                        <tr key={cIndex} className={`grade-row ${statusClass}`} style={gradeRow && gradeRow[15] === 'true' ? { backgroundColor: '#fffaf0' } : {}}>
                                                                            <td className="col-subject">{subjectName}</td>
                                                                            <td className="col-credits">{credits}</td>
                                                                            <td className="col-score">{isEditing && isCompleted ? renderInput(5, gradeRow[5]) : (gradeRow ? gradeRow[5] : '-')}</td>
                                                                            <td className="col-score">{isEditing && isCompleted ? renderInput(6, gradeRow[6]) : (gradeRow ? gradeRow[6] : '-')}</td>
                                                                            <td className="col-score">{isEditing && isCompleted ? renderInput(8, gradeRow[8]) : (gradeRow ? gradeRow[8] : '-')}</td>
                                                                            <td className="col-score font-bold">{isEditing && isCompleted ? renderInput(9, gradeRow[9]) : (gradeRow ? gradeRow[9] : '-')}</td>
                                                                            <td className="col-letter">
                                                                                {gradeRow ? (
                                                                                    <span className={`letter-badge ${letterGrade.replace('+', '-plus')}`}>
                                                                                        {letterGrade}
                                                                                    </span>
                                                                                ) : '-'}
                                                                            </td>
                                                                            <td className="col-term">
                                                                                {isCompleted ? (
                                                                                    <span className={`status-badge ${isFail ? 'status-fail' : (letterGrade ? 'status-pass' : 'status-pending')}`}>
                                                                                        {isFail ? 'Học lại' : (letterGrade ? 'Đạt' : 'Đang học')}
                                                                                    </span>
                                                                                ) : null}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Render Unmapped / Other Subjects */}
                                        {unmapped.length > 0 && (
                                            <div className="semester-block unmapped-block">
                                                <h3 className="semester-title" style={{ background: '#edf2f7', color: '#4a5568' }}>
                                                    Các môn học khác / Tự chọn
                                                    <span className="semester-credits">({unmapped.length} môn)</span>
                                                </h3>
                                                <div className="semester-table-wrapper">
                                                    <table className="grades-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Môn học</th>
                                                                <th>Tín chỉ</th>
                                                                <th>GK(TP1)</th>
                                                                <th>CC(TP2)</th>
                                                                <th>Điểm CK</th>
                                                                <th>Điểm TK</th>
                                                                <th>Điểm chữ</th>
                                                                <th>Trạng thái</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {unmapped.map((item, idx) => {
                                                                const { row, index: gradeIndex } = item;
                                                                const letterGrade = row[10] || '';
                                                                const isFail = letterGrade === 'F' || letterGrade === 'F+';
                                                                const statusClass = isFail ? 'status-fail' : (letterGrade ? 'status-pass' : 'status-pending');

                                                                const renderInput = (colIdx, val) => (
                                                                    <input
                                                                        type="text"
                                                                        value={val || ''}
                                                                        onChange={(e) => handleGradeChange(gradeIndex, colIdx, e.target.value)}
                                                                        className="grade-edit-input"
                                                                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                                                                    />
                                                                );

                                                                return (
                                                                    <tr key={idx} className={`grade-row ${statusClass}`} style={row[15] === 'true' ? { backgroundColor: '#fffaf0' } : {}}>
                                                                        <td className="col-subject">{row[3]}</td>
                                                                        <td className="col-credits">{row[11] || '-'}</td>
                                                                        <td className="col-score">{isEditing ? renderInput(5, row[5]) : (row[5] || '-')}</td>
                                                                        <td className="col-score">{isEditing ? renderInput(6, row[6]) : (row[6] || '-')}</td>
                                                                        <td className="col-score">{isEditing ? renderInput(8, row[8]) : (row[8] || '-')}</td>
                                                                        <td className="col-score font-bold">{isEditing ? renderInput(9, row[9]) : (row[9] || '-')}</td>
                                                                        <td className="col-letter"><span className={`letter-badge ${letterGrade.replace('+', '-plus')}`}>{letterGrade || '-'}</span></td>
                                                                        <td className="col-term"><span className={`status-badge ${isFail ? 'status-fail' : (letterGrade ? 'status-pass' : 'status-pending')}`}>{isFail ? 'Học lại' : (letterGrade ? 'Đạt' : 'Đang học')}</span></td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()
                    }
                </div >


                {/* Debug Section */}
                < div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <details>
                        <summary style={{ cursor: 'pointer', color: '#4a5568', fontWeight: 'bold' }}>🛠️ Debug: Danh sách tất cả môn học đã tải ({cachedGrades ? cachedGrades.length : 0})</summary>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                        <th style={{ padding: '5px' }}>STT</th>
                                        <th style={{ padding: '5px' }}>Tên môn gốc (Raw Name)</th>
                                        <th style={{ padding: '5px' }}>Điểm TK</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cachedGrades && cachedGrades.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '5px' }}>{i + 1}</td>
                                            <td style={{ padding: '5px' }}>{row[3]}</td>
                                            <td style={{ padding: '5px' }}>{row[9]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </div >

                {/* CTA Section */}
                < div className="curriculum-cta" >
                    <h2 className="cta-title">Sẵn sàng bắt đầu hành trình học tập?</h2>
                    <p className="cta-description">
                        Tham gia CLB Tin học KMA để được học tập và phát triển cùng các thành viên khác
                    </p>
                    <button className="cta-button">
                        Đăng ký ngay
                    </button>
                </div >
            </div >
        </div >
    );
};

export default Curriculum;
