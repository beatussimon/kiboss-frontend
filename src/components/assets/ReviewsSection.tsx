import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

interface Props {
  assetId: string;
  averageRating: number;
  totalReviews: number;
}

export function ReviewsSection({ assetId, averageRating, totalReviews }: Props) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (assetId) {
      api.get(`/ratings/?asset=${assetId}&page_size=5`)
        .then(res => {
          setReviews(res.data.results || res.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [assetId]);

  if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl mb-6"></div>;
  if (reviews.length === 0) return null;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-center h-16 w-16 bg-yellow-50 text-yellow-600 rounded-2xl">
          <Star className="h-8 w-8 fill-current" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{Number(averageRating).toFixed(1)}</h2>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{totalReviews} Reviews</p>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review: any) => (
          <div key={review.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                  {review.reviewer?.avatar ? (
                    <img src={review.reviewer.avatar} alt="Reviewer" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500">
                      {review.reviewer?.first_name?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{review.reviewer?.first_name}</p>
                  <p className="text-xs text-gray-500">{format(new Date(review.created_at), 'MMM yyyy')}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-gray-600 dark:text-gray-300 ml-10 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl rounded-tl-none">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
