import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook để implement infinite scroll
 * @param {Function} loadMore - Function để load thêm data
 * @param {boolean} hasMore - Có còn data để load không
 * @param {boolean} loading - Đang loading không
 * @param {number} threshold - Khoảng cách từ bottom để trigger load (px)
 */
export const useInfiniteScroll = (loadMore, hasMore, loading, threshold = 100) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const sentinelRef = useRef(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !loading) {
                    setIsIntersecting(true);
                    loadMore();
                } else {
                    setIsIntersecting(false);
                }
            },
            {
                rootMargin: `${threshold}px`,
                threshold: 0.1
            }
        );

        observer.observe(sentinel);

        return () => {
            observer.unobserve(sentinel);
        };
    }, [loadMore, hasMore, loading, threshold]);

    return sentinelRef;
};

/**
 * Hook để detect scroll position và trigger load more
 * @param {Function} loadMore - Function để load thêm data
 * @param {boolean} hasMore - Có còn data để load không
 * @param {boolean} loading - Đang loading không
 * @param {number} threshold - Khoảng cách từ bottom để trigger load (px)
 */
export const useScrollToLoad = (loadMore, hasMore, loading, threshold = 100) => {
    useEffect(() => {
        const handleScroll = () => {
            if (loading || !hasMore) return;

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Nếu scroll gần đến cuối trang
            if (scrollTop + windowHeight >= documentHeight - threshold) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [loadMore, hasMore, loading, threshold]);
};

export default useInfiniteScroll;

