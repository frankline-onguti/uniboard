import React, { useState } from 'react';
import { Notice } from '@shared/types';
import { ApplyButton } from './ApplyButton';

interface NoticeCardProps {
  notice: Notice;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();
  const isExpiringSoon = notice.expiresAt && 
    new Date(notice.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      scholarship: 'bg-green-100 text-green-800',
      job: 'bg-blue-100 text-blue-800',
      internship: 'bg-purple-100 text-purple-800',
      event: 'bg-yellow-100 text-yellow-800',
      career: 'bg-indigo-100 text-indigo-800',
      announcement: 'bg-gray-100 text-gray-800',
      academic: 'bg-red-100 text-red-800',
      housing: 'bg-orange-100 text-orange-800',
      financial_aid: 'bg-emerald-100 text-emerald-800',
      research: 'bg-cyan-100 text-cyan-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${isExpired ? 'opacity-60' : ''}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(notice.category)}`}>
                {notice.category.replace('_', ' ').toUpperCase()}
              </span>
              {isExpired && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  EXPIRED
                </span>
              )}
              {!isExpired && isExpiringSoon && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  EXPIRES SOON
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {notice.title}
            </h3>
            <p className="text-sm text-gray-500">
              Posted on {formatDate(notice.createdAt)}
              {notice.author && ` by ${notice.author.firstName} ${notice.author.lastName}`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {isExpanded ? notice.content : truncateContent(notice.content)}
          </p>
          {notice.content.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {notice.expiresAt && (
              <span>
                Expires: {formatDateTime(notice.expiresAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isExpired && (
              <ApplyButton noticeId={notice.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};