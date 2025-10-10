import React, { useCallback, useRef, useEffect, useState } from 'react';

const VirtualizedPostList = ({ 
    posts = [], 
    hasNextPage = false, 
    isNextPageLoading = false, 
    loadNextPage = () => {},
    renderPost = () => null
}) => {
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const [isNearBottom, setIsNearBottom] = useState(false);
    const lastLoadTimeRef = useRef(0);
    
    // Debounced load function
    const debouncedLoadNext = useCallback(() => {
        const now = Date.now();
        if (now - lastLoadTimeRef.current < 1000) { // 1 second debounce
            console.log('🚫 Load blocked - too soon:', now - lastLoadTimeRef.current, 'ms ago');
            return;
        }
        
        lastLoadTimeRef.current = now;
        console.log('🔄 Calling loadNextPage...');
        loadNextPage();
    }, [loadNextPage]);
    
    // Scroll listener để detect khi gần cuối
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
            
            setIsNearBottom(distanceFromBottom < 100);
            
            // Chỉ trigger load more khi gần cuối và không đang loading
            if (distanceFromBottom < 100 && hasNextPage && !isNextPageLoading) {
                console.log('🔄 Near bottom, triggering load more...');
                debouncedLoadNext();
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [hasNextPage, isNextPageLoading, debouncedLoadNext]);
    
    // IntersectionObserver cho infinite scroll (backup method)
    useEffect(() => {
        if (!hasNextPage || isNextPageLoading) return;
        
        const observer = new IntersectionObserver(
            (entries) => {
            if (entries[0].isIntersecting && !isNextPageLoading) {
                console.log('🔄 IntersectionObserver triggering load more...');
                debouncedLoadNext();
            }
            },
            { threshold: 0.1 }
        );
        
        observerRef.current = observer;
        
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasNextPage, isNextPageLoading, debouncedLoadNext]);
    
    // Kiểm tra props sau khi đã gọi tất cả hooks
    if (!posts || !Array.isArray(posts)) {
        console.error('VirtualizedPostList: posts is not an array:', posts);
        return <div>Không có dữ liệu để hiển thị</div>;
    }
    
    if (!renderPost || typeof renderPost !== 'function') {
        console.error('VirtualizedPostList: renderPost is not a function:', renderPost);
        return <div>Lỗi render function</div>;
    }

    return (
        <div className="virtualized-post-list">
            {posts.length === 0 ? (
                <div className="no-posts">Không có bài viết nào</div>
            ) : (
                <div className="posts-container" ref={containerRef}>
                    <div className="posts-list">
                        {posts.map((post, index) => (
                            <div key={`post-${post.id}-${index}`} className="post-item">
                                {renderPost(post)}
                            </div>
                        ))}
                    </div>
                    
                    {/* Loading indicator */}
                    {isNextPageLoading && (
                        <div className="loading-more">
                            <div className="loading-spinner">Đang tải thêm...</div>
                        </div>
                    )}
                    
                    {/* Intersection trigger */}
                    {hasNextPage && !isNextPageLoading && (
                        <div 
                            ref={(el) => {
                                if (el && observerRef.current) {
                                    observerRef.current.observe(el);
                                }
                            }}
                            className="intersection-trigger"
                        >
                            Kéo xuống để xem thêm
                        </div>
                    )}
                    
                    {/* End indicator */}
                    {!hasNextPage && posts.length > 0 && (
                        <div className="end-of-posts">
                            🎉 Đã xem hết tất cả bài viết!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VirtualizedPostList;
