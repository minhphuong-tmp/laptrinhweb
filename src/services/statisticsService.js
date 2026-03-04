import { supabase } from '../lib/supabase';

// ===== STATISTICS SERVICE =====

/**
 * Lấy thống kê thành viên từ database
 * @returns {Promise<Object>} Thống kê thành viên
 */
export const getMembersStats = async () => {
    try {
        // Lấy tất cả thành viên CLB
        const { data: members, error } = await supabase
            .from('clb_members')
            .select(`
                *,
                users (
                    id,
                    name,
                    email,
                    created_at
                )
            `);

        if (error) {
            console.warn('Error fetching clb_members, using fallback:', error);
            // Fallback: use users table if clb_members fails
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('*');

            if (usersError) throw usersError;

            // Mock member data from users
            const mockMembers = (users || []).map(user => ({
                user_id: user.id,
                role: 'Thành viên',
                year: '2024',
                join_date: user.created_at,
                users: user
            }));

            return processMembersData(mockMembers);
        }

        return processMembersData(members || []);
    } catch (error) {
        console.error('Error fetching members stats:', error);
        // Return fallback data
        return {
            total: 0,
            newThisMonth: 0,
            byRole: { 'Thành viên': 0 },
            byYear: { '2024': 0 }
        };
    }
};

/**
 * Xử lý data members để tính thống kê
 * @param {Array} members - Array of member data
 * @returns {Object} Processed statistics
 */
const processMembersData = (members) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Tính tổng thành viên
    const total = members?.length || 0;

    // Tính thành viên mới tháng này
    const newThisMonth = members?.filter(member => {
        const joinDate = new Date(member.join_date);
        return joinDate.getMonth() === currentMonth &&
               joinDate.getFullYear() === currentYear;
    }).length || 0;

    // Phân bố theo vai trò
    const byRole = {};
    members?.forEach(member => {
        const role = member.role || 'Thành viên';
        byRole[role] = (byRole[role] || 0) + 1;
    });

    // Phân bố theo năm
    const byYear = {};
    members?.forEach(member => {
        const year = member.year || '2024';
        byYear[year] = (byYear[year] || 0) + 1;
    });

    return {
        total,
        newThisMonth,
        byRole,
        byYear
    };
};

/**
 * Lấy thống kê hoạt động từ database
 * @returns {Promise<Object>} Thống kê hoạt động
 */
export const getActivitiesStats = async () => {
    try {
        // Lấy tất cả hoạt động
        const { data: activities, error: activitiesError } = await supabase
            .from('activities')
            .select('*');

        if (activitiesError) throw activitiesError;

        // Lấy tất cả người tham gia
        const { data: participants, error: participantsError } = await supabase
            .from('activity_participants')
            .select('*');

        if (participantsError) throw participantsError;

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Tính tổng hoạt động
        const total = activities?.length || 0;

        // Tính hoạt động tháng này
        const thisMonth = activities?.filter(activity => {
            const startDate = new Date(activity.start_date);
            return startDate.getMonth() === currentMonth &&
                   startDate.getFullYear() === currentYear;
        }).length || 0;

        // Phân bố theo loại hoạt động
        const byType = {};
        activities?.forEach(activity => {
            const type = activity.activity_type || 'workshop';
            byType[type] = (byType[type] || 0) + 1;
        });

        // Tính tham gia hoạt động
        const totalParticipants = participants?.length || 0;
        const averagePerActivity = total > 0 ? Math.round(totalParticipants / total) : 0;

        return {
            total,
            thisMonth,
            byType,
            participation: {
                totalParticipants,
                averagePerActivity
            }
        };
    } catch (error) {
        console.error('Error fetching activities stats:', error);
        throw error;
    }
};

/**
 * Lấy thống kê tài liệu từ database
 * @returns {Promise<Object>} Thống kê tài liệu
 */
export const getDocumentsStats = async () => {
    try {
        // Lấy tất cả tài liệu
        const { data: documents, error } = await supabase
            .from('documents')
            .select('*');

        if (error) throw error;

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Tính tổng tài liệu
        const total = documents?.length || 0;

        // Tính tài liệu tháng này
        const thisMonth = documents?.filter(doc => {
            const uploadDate = new Date(doc.upload_date || doc.created_at);
            return uploadDate.getMonth() === currentMonth &&
                   uploadDate.getFullYear() === currentYear;
        }).length || 0;

        // Phân bố theo danh mục
        const byCategory = {};
        documents?.forEach(doc => {
            const category = doc.category || 'Lập trình';
            byCategory[category] = (byCategory[category] || 0) + 1;
        });

        // Tính lượt tải xuống
        const totalDownloads = documents?.reduce((sum, doc) => sum + (doc.download_count || 0), 0) || 0;

        // Lượt tải tháng này (cần tính từ download history nếu có)
        // Tạm thời tính ước lượng
        const thisMonthDownloads = Math.round(totalDownloads * 0.1); // Ước tính 10% là tháng này

        return {
            total,
            thisMonth,
            byCategory,
            downloads: {
                total: totalDownloads,
                thisMonth: thisMonthDownloads
            }
        };
    } catch (error) {
        console.error('Error fetching documents stats:', error);
        throw error;
    }
};

/**
 * Lấy thống kê tương tác từ database
 * @returns {Promise<Object>} Thống kê tương tác
 */
export const getEngagementStats = async () => {
    try {
        let postsCount = 0;
        let commentsCount = 0;
        let likesCount = 0;

        // Lấy số lượng bài viết (sử dụng body thay vì content)
        try {
            const { count: postsCountResult, error: postsError } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true });

            if (!postsError) {
                postsCount = postsCountResult || 0;
            }
        } catch (error) {
            console.warn('Error fetching posts count:', error);
        }

        // Lấy số lượng bình luận (sử dụng text thay vì content)
        try {
            const { count: commentsCountResult, error: commentsError } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true });

            if (!commentsError) {
                commentsCount = commentsCountResult || 0;
            }
        } catch (error) {
            console.warn('Error fetching comments count:', error);
        }

        // Lấy số lượng lượt thích
        try {
            const { count: likesCountResult, error: likesError } = await supabase
                .from('postLikes')
                .select('*', { count: 'exact', head: true });

            if (!likesError) {
                likesCount = likesCountResult || 0;
            }
        } catch (error) {
            console.warn('Error fetching likes count:', error);
            // If table doesn't exist yet, likesCount remains 0
        }

        return {
            posts: postsCount,
            comments: commentsCount,
            likes: likesCount,
            shares: 0 // Tạm thời chưa có bảng shares
        };
    } catch (error) {
        console.error('Error fetching engagement stats:', error);
        // Return fallback data
        return {
            posts: 0,
            comments: 0,
            likes: 0,
            shares: 0
        };
    }
};

/**
 * Lấy thống kê theo thời gian (7 ngày, 30 ngày, 90 ngày)
 * @returns {Promise<Object>} Thống kê theo thời gian
 */
export const getTimeBasedStats = async () => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // Posts theo thời gian
        const [posts7d, posts30d, posts90d] = await Promise.all([
            supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
            supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
            supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', ninetyDaysAgo.toISOString())
        ]);

        // Comments theo thời gian
        const [comments7d, comments30d, comments90d] = await Promise.all([
            supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
            supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
            supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', ninetyDaysAgo.toISOString())
        ]);

        // Likes theo thời gian
        const [likes7d, likes30d, likes90d] = await Promise.all([
            supabase.from('postLikes').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
            supabase.from('postLikes').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
            supabase.from('postLikes').select('*', { count: 'exact', head: true }).gte('created_at', ninetyDaysAgo.toISOString())
        ]);

        return {
            posts: {
                '7d': posts7d.count || 0,
                '30d': posts30d.count || 0,
                '90d': posts90d.count || 0
            },
            comments: {
                '7d': comments7d.count || 0,
                '30d': comments30d.count || 0,
                '90d': comments90d.count || 0
            },
            likes: {
                '7d': likes7d.count || 0,
                '30d': likes30d.count || 0,
                '90d': likes90d.count || 0
            }
        };
    } catch (error) {
        console.error('Error fetching time-based stats:', error);
        return {
            posts: { '7d': 0, '30d': 0, '90d': 0 },
            comments: { '7d': 0, '30d': 0, '90d': 0 },
            likes: { '7d': 0, '30d': 0, '90d': 0 }
        };
    }
};

/**
 * Lấy top contributors (người đăng nhiều bài nhất)
 * @param {number} limit - Số lượng top users
 * @returns {Promise<Array>} Top contributors
 */
export const getTopContributors = async (limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                userId,
                users (
                    id,
                    name,
                    image
                ),
                postLikes(count)
            `)
            .order('userId');

        if (error) throw error;

        // Group by user and count posts and likes
        const userStats = {};
        data.forEach(post => {
            const userId = post.userId;
            if (!userStats[userId]) {
                userStats[userId] = {
                    user: post.users,
                    postsCount: 0,
                    likesReceived: 0
                };
            }
            userStats[userId].postsCount += 1;
            userStats[userId].likesReceived += post.postLikes?.length || 0;
        });

        // Convert to array and sort by posts count
        const contributors = Object.values(userStats)
            .sort((a, b) => b.postsCount - a.postsCount)
            .slice(0, limit);

        return contributors;
    } catch (error) {
        console.error('Error fetching top contributors:', error);
        return [];
    }
};

/**
 * Lấy engagement metrics (trung bình, tỷ lệ engagement)
 * @returns {Promise<Object>} Engagement metrics
 */
export const getEngagementMetrics = async () => {
    try {
        const [postsResult, commentsResult, likesResult] = await Promise.all([
            supabase.from('posts').select('*', { count: 'exact', head: true }),
            supabase.from('comments').select('*', { count: 'exact', head: true }),
            supabase.from('postLikes').select('*', { count: 'exact', head: true })
        ]);

        const totalPosts = postsResult.count || 0;
        const totalComments = commentsResult.count || 0;
        const totalLikes = likesResult.count || 0;

        return {
            totalPosts,
            totalComments,
            totalLikes,
            avgCommentsPerPost: totalPosts > 0 ? (totalComments / totalPosts).toFixed(1) : 0,
            avgLikesPerPost: totalPosts > 0 ? (totalLikes / totalPosts).toFixed(1) : 0,
            totalEngagement: totalComments + totalLikes,
            engagementRate: totalPosts > 0 ? (((totalComments + totalLikes) / totalPosts) * 100).toFixed(1) : 0
        };
    } catch (error) {
        console.error('Error fetching engagement metrics:', error);
        return {
            totalPosts: 0,
            totalComments: 0,
            totalLikes: 0,
            avgCommentsPerPost: 0,
            avgLikesPerPost: 0,
            totalEngagement: 0,
            engagementRate: 0
        };
    }
};

/**
 * Lấy dữ liệu bảng xếp hạng (leaderboard) từ database
 * @returns {Promise<Array>} Danh sách thành viên với điểm số và thống kê
 */
export const getLeaderboardData = async () => {
    try {
        // Lấy tất cả thành viên CLB với thông tin user
        const { data: members, error: membersError } = await supabase
            .from('clb_members')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    email,
                    image,
                    created_at
                )
            `);

        if (membersError) throw membersError;

        if (!members || members.length === 0) {
            return [];
        }

        // Lấy tất cả posts để đếm
        const { data: allPosts, error: postsError } = await supabase
            .from('posts')
            .select('id, userId, created_at');

        if (postsError) console.warn('Error fetching posts:', postsError);

        // Lấy tất cả comments để đếm
        const { data: allComments, error: commentsError } = await supabase
            .from('comments')
            .select('id, userId, postId, created_at');

        if (commentsError) console.warn('Error fetching comments:', commentsError);

        // Lấy tất cả likes để đếm likes nhận được
        const { data: allLikes, error: likesError } = await supabase
            .from('postLikes')
            .select('id, postId');

        if (likesError) console.warn('Error fetching likes:', likesError);

        // Lấy tất cả documents để đếm
        const { data: allDocuments, error: documentsError } = await supabase
            .from('documents')
            .select('id, uploader_id, created_at');

        if (documentsError) console.warn('Error fetching documents:', documentsError);

        // Tính toán thống kê cho mỗi thành viên
        const leaderboardData = await Promise.all(
            members.map(async (member) => {
                const userId = member.user_id;
                const userInfo = member.users || {};

                // Đếm bài viết
                const postsCount = (allPosts || []).filter(p => p.userId === userId).length;

                // Đếm bình luận
                const commentsCount = (allComments || []).filter(c => c.userId === userId).length;

                // Đếm lượt thích nhận được (likes trên các bài viết của user này)
                const userPostIds = (allPosts || [])
                    .filter(p => p.userId === userId)
                    .map(p => p.id);
                const likesReceived = (allLikes || [])
                    .filter(like => userPostIds.includes(like.postId))
                    .length;

                // Đếm tài liệu đã upload
                const documentsUploaded = (allDocuments || [])
                    .filter(d => d.uploader_id === userId).length;

                // Đếm tài liệu đã download 
                // Lưu ý: Hiện tại không có bảng download history riêng
                // Nếu có bảng download_history với cột user_id, thì đếm từ đó
                // Tạm thời đặt = 0 hoặc có thể tính từ download_count của documents mà user đã xem/preview
                const documentsDownloaded = 0; // Sẽ cần join với bảng download_history nếu có

                // Tính điểm dựa trên hoạt động
                // Bài viết: 15 điểm/bài
                // Bình luận: 5 điểm/bình luận
                // Lượt thích nhận được: 2 điểm/like
                // Tài liệu upload: 30 điểm/tài liệu
                const postsPoints = postsCount * 15;
                const commentsPoints = commentsCount * 5;
                const likesPoints = likesReceived * 2;
                const documentsUploadPoints = documentsUploaded * 30;

                const totalPoints = postsPoints + commentsPoints + likesPoints + documentsUploadPoints;


                return {
                    id: member.id || userId,
                    userId: userId,
                    name: userInfo.name || 'Chưa có tên',
                    studentId: member.student_id || `USER-${userId.substring(0, 8)}`,
                    avatar: userInfo.image || null,
                    role: member.role || 'Thành viên',
                    totalPoints: totalPoints,
                    activities: {
                        participated: 0, // Sẽ cần join với activity_participants nếu muốn
                        organized: 0, // Sẽ cần join với activities nếu muốn
                        points: 0 // Tạm thời chưa tính điểm hoạt động
                    },
                    documents: {
                        uploaded: documentsUploaded,
                        downloaded: documentsDownloaded,
                        points: documentsUploadPoints
                    },
                    posts: {
                        created: postsCount,
                        comments: commentsCount,
                        likes: likesReceived,
                        points: postsPoints + commentsPoints + likesPoints
                    },
                    achievements: [], // Có thể tính dựa trên điểm số sau
                    rank: 0 // Sẽ được gán sau khi sort
                };
            })
        );

        // Sắp xếp theo điểm và gán rank
        leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);
        leaderboardData.forEach((member, index) => {
            member.rank = index + 1;
        });

        // Tính achievements đơn giản
        leaderboardData.forEach((member) => {
            const achievements = [];
            if (member.posts.created >= 10) achievements.push('🏆 Thành viên tích cực');
            if (member.documents.uploaded >= 5) achievements.push('📚 Chuyên gia tài liệu');
            if (member.posts.comments >= 50) achievements.push('💬 Người dẫn dắt');
            member.achievements = achievements;
        });

        return leaderboardData;
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        return [];
    }
};

/**
 * Lấy tất cả thống kê tổng hợp (bao gồm chi tiết)
 * @returns {Promise<Object>} Tất cả thống kê
 */
export const getAllStats = async () => {
    console.log('📊 Loading all statistics...');

    try {
        // Load tất cả stats song song nhưng handle errors individually
        const results = await Promise.allSettled([
            getMembersStats(),
            getActivitiesStats(),
            getDocumentsStats(),
            getEngagementStats(),
            getTimeBasedStats(),
            getTopContributors(5),
            getEngagementMetrics()
        ]);

        const [membersResult, activitiesResult, documentsResult, engagementResult,
               timeStatsResult, topContributorsResult, engagementMetricsResult] = results;

        // Extract data or fallback values
        const stats = {
            members: membersResult.status === 'fulfilled' ? membersResult.value : {
                total: 0,
                newThisMonth: 0,
                byRole: { 'Thành viên': 0 },
                byYear: { '2024': 0 }
            },
            activities: activitiesResult.status === 'fulfilled' ? activitiesResult.value : {
                total: 0,
                thisMonth: 0,
                byType: { 'Workshop': 0 },
                participation: { totalParticipants: 0, averagePerActivity: 0 }
            },
            documents: documentsResult.status === 'fulfilled' ? documentsResult.value : {
                total: 0,
                thisMonth: 0,
                byCategory: { 'Lập trình': 0 },
                downloads: { total: 0, thisMonth: 0 }
            },
            engagement: engagementResult.status === 'fulfilled' ? engagementResult.value : {
                posts: 0,
                comments: 0,
                likes: 0,
                shares: 0
            },
            timeBased: timeStatsResult.status === 'fulfilled' ? timeStatsResult.value : {
                posts: { '7d': 0, '30d': 0, '90d': 0 },
                comments: { '7d': 0, '30d': 0, '90d': 0 },
                likes: { '7d': 0, '30d': 0, '90d': 0 }
            },
            topContributors: topContributorsResult.status === 'fulfilled' ? topContributorsResult.value : [],
            engagementMetrics: engagementMetricsResult.status === 'fulfilled' ? engagementMetricsResult.value : {
                totalPosts: 0,
                totalComments: 0,
                totalLikes: 0,
                avgCommentsPerPost: 0,
                avgLikesPerPost: 0,
                totalEngagement: 0,
                engagementRate: 0
            }
        };

        // Log errors for debugging
        results.forEach((result, index) => {
            const names = ['members', 'activities', 'documents', 'engagement', 'time-based', 'top-contributors', 'engagement-metrics'];
            if (result.status === 'rejected') {
                console.error(`❌ Error loading ${names[index]} stats:`, result.reason);
            } else {
                console.log(`✅ ${names[index]} stats loaded`);
            }
        });

        console.log('📊 All statistics loaded successfully');
        return stats;

    } catch (error) {
        console.error('❌ Critical error in getAllStats:', error);
        // Return fallback data
        return {
            members: {
                total: 0,
                newThisMonth: 0,
                byRole: { 'Thành viên': 0 },
                byYear: { '2024': 0 }
            },
            activities: {
                total: 0,
                thisMonth: 0,
                byType: { 'Workshop': 0 },
                participation: { totalParticipants: 0, averagePerActivity: 0 }
            },
            documents: {
                total: 0,
                thisMonth: 0,
                byCategory: { 'Lập trình': 0 },
                downloads: { total: 0, thisMonth: 0 }
            },
            engagement: {
                posts: 0,
                comments: 0,
                likes: 0,
                shares: 0
            },
            timeBased: {
                posts: { '7d': 0, '30d': 0, '90d': 0 },
                comments: { '7d': 0, '30d': 0, '90d': 0 },
                likes: { '7d': 0, '30d': 0, '90d': 0 }
            },
            topContributors: [],
            engagementMetrics: {
                totalPosts: 0,
                totalComments: 0,
                totalLikes: 0,
                avgCommentsPerPost: 0,
                avgLikesPerPost: 0,
                totalEngagement: 0,
                engagementRate: 0
            }
        };
    }
};
