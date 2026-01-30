import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Curriculum.css';

const Curriculum = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedMajor, setSelectedMajor] = useState('cntt'); // 'cntt', 'attm', 'dtvt' - bắt đầu với CNTT
    const [activeTab, setActiveTab] = useState('objectives'); // 'objectives', 'curriculum', 'conditions'

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
        roadmap: [
            {
                semester: 'Học kỳ 1',
                courses: ['Lập trình Cơ bản', 'Database và SQL'],
                duration: '3 tháng'
            },
            {
                semester: 'Học kỳ 2',
                courses: ['Lập trình Hướng đối tượng', 'Web Development (Phần 1)'],
                duration: '3 tháng'
            },
            {
                semester: 'Học kỳ 3',
                courses: ['Web Development (Phần 2)', 'Cấu trúc Dữ liệu và Giải thuật'],
                duration: '3 tháng'
            },
            {
                semester: 'Học kỳ 4',
                courses: ['Mobile App Development', 'Dự án Capstone'],
                duration: '3 tháng'
            }
        ],
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
                        <p className="hero-description">{currentMajor.description}</p>
                    </div>
                </div>

                {/* Filter by Major */}
                <div className="major-filters">
                    {majorOptions.map((option) => (
                        <button
                            key={option.value}
                            className={`major-filter-btn ${selectedMajor === option.value ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedMajor(option.value);
                                setActiveTab('objectives'); // Reset về tab đầu tiên khi đổi ngành
                            }}
                        >
                            <span className="filter-icon">{option.icon}</span>
                            <span className="filter-label">{option.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="curriculum-tabs">
                    <button
                        className={`curriculum-tab ${activeTab === 'objectives' ? 'active' : ''}`}
                        onClick={() => setActiveTab('objectives')}
                    >
                        Mục tiêu đào tạo
                    </button>
                    <button
                        className={`curriculum-tab ${activeTab === 'curriculum' ? 'active' : ''}`}
                        onClick={() => setActiveTab('curriculum')}
                    >
                        Chương trình học
                    </button>
                    <button
                        className={`curriculum-tab ${activeTab === 'conditions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('conditions')}
                    >
                        Điều kiện & Cơ hội
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'objectives' && (
                    <div className="curriculum-section">
                        <h2 className="section-title">Mục tiêu đào tạo</h2>
                        
                        {/* Mục tiêu chung */}
                        <div className="objectives-section">
                            <h3 className="subsection-title">Mục tiêu chung</h3>
                            <div className="objectives-grid">
                                {currentMajor.objectives.general.map((objective, index) => (
                                    <div key={index} className="objective-card">
                                        <div className="objective-icon">🎯</div>
                                        <p className="objective-text">{objective}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mục tiêu về chính trị, đạo đức */}
                        <div className="objectives-section">
                            <h3 className="subsection-title">Mục tiêu về chính trị, đạo đức</h3>
                            <div className="objectives-list">
                                {currentMajor.objectives.political.map((objective, index) => (
                                    <div key={index} className="objective-item">
                                        <span className="objective-number">{objective.code}</span>
                                        <p>{objective.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mục tiêu về kiến thức */}
                        <div className="objectives-section">
                            <h3 className="subsection-title">Mục tiêu về kiến thức</h3>
                            <div className="objectives-list">
                                {currentMajor.objectives.knowledge.map((objective, index) => (
                                    <div key={index} className="objective-item">
                                        <span className="objective-number">{objective.code}</span>
                                        <p>{objective.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'curriculum' && (
                    <div className="curriculum-section">
                        <h2 className="section-title">Chương trình học</h2>

                        <div className="courses-grid">
                            {filteredCourses.map((course) => (
                            <div key={course.id} className="course-card">
                                <div className="course-header">
                                    <div className={`course-level-badge level-${course.level.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {course.level}
                                    </div>
                                    <h3 className="course-title">{course.title}</h3>
                                </div>
                                <p className="course-description">{course.description}</p>
                                <div className="course-info">
                                    <div className="info-item">
                                        <span className="info-icon">⏱️</span>
                                        <span className="info-text">{course.duration}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-icon">👨‍🏫</span>
                                        <span className="info-text">{course.instructor}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-icon">📅</span>
                                        <span className="info-text">{course.schedule}</span>
                                    </div>
                                </div>
                                <div className="course-topics">
                                    <h4 className="topics-title">Nội dung học:</h4>
                                    <ul className="topics-list">
                                        {course.topics.map((topic, index) => (
                                            <li key={index} className="topic-item">
                                                <span className="topic-icon">✓</span>
                                                {topic}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                        </div>

                        {/* Roadmap Section */}
                        <div className="roadmap-section">
                            <h2 className="section-title">Lộ trình học tập</h2>
                            <div className="roadmap-container">
                                {curriculumData.roadmap.map((semester, index) => (
                                    <div key={index} className="roadmap-item">
                                        <div className="roadmap-timeline">
                                            <div className="timeline-dot"></div>
                                            {index < curriculumData.roadmap.length - 1 && (
                                                <div className="timeline-line"></div>
                                            )}
                                        </div>
                                        <div className="roadmap-content">
                                            <div className="roadmap-header">
                                                <h3 className="roadmap-semester">{semester.semester}</h3>
                                                <span className="roadmap-duration">{semester.duration}</span>
                                            </div>
                                            <div className="roadmap-courses">
                                                {semester.courses.map((courseName, courseIndex) => (
                                                    <div key={courseIndex} className="roadmap-course">
                                                        <span className="course-bullet">📚</span>
                                                        {courseName}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'conditions' && (
                    <div className="curriculum-section">
                        <h2 className="section-title">Điều kiện & Cơ hội</h2>
                        
                        {/* Điều kiện tham gia */}
                        <div className="conditions-section">
                            <h3 className="subsection-title">Điều kiện tham gia</h3>
                            <div className="conditions-list">
                                {currentMajor.conditions.requirements.map((requirement, index) => (
                                    <div key={index} className="condition-item">
                                        <span className="condition-icon">✓</span>
                                        <p>{requirement}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cơ hội */}
                        <div className="opportunities-section">
                            <h3 className="subsection-title">Cơ hội</h3>
                            <div className="opportunities-grid">
                                {currentMajor.conditions.opportunities.map((opportunity, index) => (
                                    <div key={index} className="opportunity-card">
                                        <h4 className="opportunity-title">{opportunity.title}</h4>
                                        <ul className="opportunity-list">
                                            {opportunity.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="opportunity-item">
                                                    <span className="opportunity-bullet">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CTA Section */}
                <div className="curriculum-cta">
                    <h2 className="cta-title">Sẵn sàng bắt đầu hành trình học tập?</h2>
                    <p className="cta-description">
                        Tham gia CLB Tin học KMA để được học tập và phát triển cùng các thành viên khác
                    </p>
                    <button className="cta-button">
                        Đăng ký ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Curriculum;

