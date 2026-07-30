import React, { useState } from 'react';
import { useSeriesComment } from '@/hooks/useSeriesComment';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewSectionProps {
  labelleServies: string;
  targetUserId: string;
  targetEntityId?: string;
  title?: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ labelleServies, targetUserId, targetEntityId, title = 'Avis clients' }) => {
  const { comments, stats, loading, hasMore, loadMore, createComment } = useSeriesComment(labelleServies, targetUserId, targetEntityId);
  const [newComment, setNewComment] = useState('');
  const [newNote, setNewNote] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newNote < 1 || newNote > 5) return;

    setIsSubmitting(true);
    const res = await createComment(newNote, newComment);
    if (res.success) {
      setNewComment('');
      setNewNote(5);
    }
    setIsSubmitting(false);
  };

  const renderStars = (note: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Icon
        key={i}
        icon={i < note ? "solar:star-bold" : "solar:star-linear"}
        className={i < note ? "text-yellow-400" : "text-zinc-300 dark:text-zinc-600"}
        width={16}
      />
    ));
  };

  return (
    <div className="w-full space-y-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            {title}
          </h2>
          {stats && stats.totalComments > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl font-black text-primary">{stats.averageNote.toFixed(1)}</span>
              <div className="flex flex-col">
                <div className="flex items-center">
                  {renderStars(Math.round(stats.averageNote))}
                </div>
                <span className="text-xs text-zinc-500 font-bold mt-0.5">Sur {stats.totalComments} avis</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <h3 className="text-sm font-bold mb-4">Laissez un avis</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Note:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewNote(star)}
                  className="transition-transform active:scale-90"
                >
                  <Icon
                    icon={star <= newNote ? "solar:star-bold" : "solar:star-linear"}
                    className={`w-6 h-6 ${star <= newNote ? "text-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Partagez votre expérience..."
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Envoi...' : 'Publier l\'avis'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-lg">
                  {comment.user?.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {comment.user?.fullName || 'Utilisateur'}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex">
                {renderStars(comment.note)}
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {comment.comment}
            </p>
          </div>
        ))}

        {loading && <div className="text-center py-4 text-sm text-zinc-500 font-bold animate-pulse">Chargement...</div>}
        
        {!loading && hasMore && comments.length > 0 && (
          <div className="text-center pt-4">
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full font-bold text-xs hover:bg-zinc-200 transition-colors"
            >
              Voir plus d'avis
            </button>
          </div>
        )}
        
        {!loading && comments.length === 0 && (
          <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800 border-dashed">
            <Icon icon="solar:chat-round-dots-line-duotone" width={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm font-bold text-zinc-500">Aucun avis pour le moment.</p>
            <p className="text-xs text-zinc-400 mt-1">Soyez le premier à partager votre expérience !</p>
          </div>
        )}
      </div>
    </div>
  );
};
