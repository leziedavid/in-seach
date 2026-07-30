import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface CommentData {
  id: string;
  labelleServies: string;
  userId: string;
  userAddServiesId: string;
  note: number;
  comment: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    storeName: string | null;
    companyName: string | null;
  };
}

export interface CommentStats {
  averageNote: number;
  totalComments: number;
  distribution: { note: number; _count: { note: number } }[];
}

// targetEntityId : sous-cible optionnelle quand targetUserId possède plusieurs entités
// notables (ex. plusieurs Restaurant) — scope la note/l'avis à l'entité précise plutôt
// qu'au propriétaire seul. Absent pour tous les usages existants (Boutique, LogisticService...).
export const useSeriesComment = (labelleServies: string, targetUserId: string, targetEntityId?: string) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const entitySuffix = targetEntityId ? `&targetEntityId=${targetEntityId}` : '';

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get(`/series-comment/stats/${targetUserId}?labelleServies=${labelleServies}${entitySuffix}`);
      setStats(data as any);
    } catch (error) {
      console.error('Error fetching comment stats:', error);
    }
  }, [labelleServies, targetUserId, entitySuffix]);

  const fetchComments = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const res: any = await api.get(`/series-comment/by-target-user/${targetUserId}?labelleServies=${labelleServies}&page=${pageNum}&limit=10${entitySuffix}`);
      if (pageNum === 1) {
        setComments(res.data);
      } else {
        setComments(prev => [...prev, ...res.data]);
      }
      setHasMore(pageNum < res.meta.lastPage);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [labelleServies, targetUserId, entitySuffix]);

  useEffect(() => {
    if (targetUserId) {
      fetchStats();
      fetchComments(1);
    }
  }, [fetchStats, fetchComments, targetUserId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage);
    }
  };

  const createComment = async (note: number, comment: string) => {
    try {
      const newComment = await api.post('/series-comment', {
        labelleServies,
        userAddServiesId: targetUserId,
        ...(targetEntityId && { targetEntityId }),
        note,
        comment
      });
      // Prepend to current comments
      setComments(prev => [newComment as any, ...prev]);
      // Update stats
      fetchStats();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating comment:', error);
      return { success: false, error: error?.response?.data?.message || 'Error' };
    }
  };

  return {
    comments,
    stats,
    loading,
    hasMore,
    loadMore,
    createComment
  };
};
