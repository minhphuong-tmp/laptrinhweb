import React from 'react';
import './DocumentIcon.css';

const DocumentIcon = ({ fileType, className = '' }) => {
    const getIcon = (type) => {
        if (!type) return '📄';
        
        const lowerType = type.toLowerCase();
        
        // PDF files
        if (lowerType === 'pdf') return '📕';
        
        // Word documents
        if (['doc', 'docx'].includes(lowerType)) return '📘';
        
        // PowerPoint presentations
        if (['ppt', 'pptx'].includes(lowerType)) return '📊';
        
        // Excel spreadsheets
        if (['xls', 'xlsx'].includes(lowerType)) return '📈';
        
        // Text files
        if (['txt', 'rtf'].includes(lowerType)) return '📝';
        
        // Image files
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(lowerType)) return '🖼️';
        
        // Video files
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(lowerType)) return '🎥';
        
        // Audio files
        if (['mp3', 'wav', 'flac', 'aac'].includes(lowerType)) return '🎵';
        
        // Archive files
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(lowerType)) return '🗜️';
        
        // Code files
        if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'py', 'java', 'cpp', 'c'].includes(lowerType)) return '💻';
        
        // Default document icon
        return '📄';
    };

    return (
        <span className={`document-icon ${className}`} title={`File type: ${fileType || 'Unknown'}`}>
            {getIcon(fileType)}
        </span>
    );
};

export default DocumentIcon;
