import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

interface Props {
  driverId: string;
  averageRating: number;
}

export function DriverReviewsSection({ driverId, averageRating }: Props) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (driverId) {
      api.get(`/ratings/?rated_user=${driverId}&rating_type=RENTER_TO_OWNER&page_size=3`)
        .then(res => {
          setReviews(res.data.results || res.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [driverId]);

  if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl mb-6"></div>;
  if (reviews.length === 0) return null;

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Driver Reviews</h2>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="font-bold text-gray-900 dark:text-white">{Number(averageRating).toFixed(1)}</span>
          </div>
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
