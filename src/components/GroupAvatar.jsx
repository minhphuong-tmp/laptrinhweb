import { useState, useEffect } from 'react';
import Avatar from './Avatar';
import './GroupAvatar.css';

const GroupAvatar = ({ 
    members = [], 
    size = 40, 
    className = '', 
    style = {},
    maxVisible = 4 
}) => {
    const [memberAvatars, setMemberAvatars] = useState([]);

    useEffect(() => {
        // Lấy tất cả thành viên (có hoặc không có avatar) và giới hạn số lượng
        const allMembers = members
            .filter(member => member?.user) // Chỉ lọc những member có user data
            .slice(0, maxVisible);
        
        setMemberAvatars(allMembers);
    }, [members, maxVisible]);

    // Nếu không có thành viên nào, hiển thị avatar mặc định
    if (memberAvatars.length === 0) {
        return (
            <Avatar 
                src={undefined} 
                name="Group" 
                size={size}
                className={className}
                style={style}
            />
        );
    }

    // Nếu chỉ có 1 thành viên, hiển thị avatar đó
    if (memberAvatars.length === 1) {
        return (
            <Avatar 
                src={memberAvatars[0].user.image} 
                name={memberAvatars[0].user.name} 
                size={size}
                className={className}
                style={style}
            />
        );
    }

    // Nếu có 2 thành viên, hiển thị 2 avatar xếp chồng
    if (memberAvatars.length === 2) {
        return (
            <div className={`group-avatar ${className}`} style={{ width: size, height: size, ...style }}>
                <div className="group-avatar-container two-members">
                    <Avatar 
                        src={memberAvatars[0].user.image} 
                        name={memberAvatars[0].user.name} 
                        size={size * 0.7}
                        className="group-avatar-item first"
                    />
                    <Avatar 
                        src={memberAvatars[1].user.image} 
                        name={memberAvatars[1].user.name} 
                        size={size * 0.7}
                        className="group-avatar-item second"
                    />
                </div>
            </div>
        );
    }

    // Nếu có 3 thành viên, hiển thị 3 avatar
    if (memberAvatars.length === 3) {
        return (
            <div className={`group-avatar ${className}`} style={{ width: size, height: size, ...style }}>
                <div className="group-avatar-container three-members">
                    <Avatar 
                        src={memberAvatars[0].user.image} 
                        name={memberAvatars[0].user.name} 
                        size={size * 0.6}
                        className="group-avatar-item first"
                    />
                    <Avatar 
                        src={memberAvatars[1].user.image} 
                        name={memberAvatars[1].user.name} 
                        size={size * 0.6}
                        className="group-avatar-item second"
                    />
                    <Avatar 
                        src={memberAvatars[2].user.image} 
                        name={memberAvatars[2].user.name} 
                        size={size * 0.6}
                        className="group-avatar-item third"
                    />
                </div>
            </div>
        );
    }

    // Nếu có 4+ thành viên, hiển thị 4 avatar với dấu "+" cho số còn lại
    const remainingCount = members.length - maxVisible;
    return (
        <div className={`group-avatar ${className}`} style={{ width: size, height: size, ...style }}>
            <div className="group-avatar-container four-members">
                <Avatar 
                    src={memberAvatars[0].user.image} 
                    name={memberAvatars[0].user.name} 
                    size={size * 0.5}
                    className="group-avatar-item first"
                />
                <Avatar 
                    src={memberAvatars[1].user.image} 
                    name={memberAvatars[1].user.name} 
                    size={size * 0.5}
                    className="group-avatar-item second"
                />
                <Avatar 
                    src={memberAvatars[2].user.image} 
                    name={memberAvatars[2].user.name} 
                    size={size * 0.5}
                    className="group-avatar-item third"
                />
                <div className="group-avatar-item fourth">
                    {remainingCount > 0 ? (
                        <div className="remaining-count">
                            +{remainingCount}
                        </div>
                    ) : (
                        <Avatar 
                            src={memberAvatars[3].user.image} 
                            name={memberAvatars[3].user.name} 
                            size={size * 0.5}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupAvatar;


