import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { getMediaUrl } from '../../utils/media';

interface Props {
  userId: string;
}

export function UserReviewsSection({ userId }: Props) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      api.get(`/ratings/?rated_user=${userId}&page_size=10`)
        .then(res => {
          setReviews(res.data.results || res.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [userId]);

  if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl mb-6"></div>;
  if (reviews.length === 0) return null;

  return (
    <div className="card p-6 mt-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Reviews</h2>
      <div className="space-y-6">
        {reviews.map((review: any) => (
          <div key={review.id} className="space-y-2 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                  {review.reviewer?.avatar ? (
                    <img src={getMediaUrl(review.reviewer.avatar)} alt="Reviewer" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600 font-bold text-xs">
                      {review.reviewer?.first_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {review.reviewer?.first_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {review.created_at ? format(new Date(review.created_at), 'MMM d, yyyy') : 'Unknown date'}
                  </p>
                </div>
              </div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.score
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-200 dark:text-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
