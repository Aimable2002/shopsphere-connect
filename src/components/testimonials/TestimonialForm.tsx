import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTestimonial } from '@/hooks/useTestimonials';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function TestimonialForm() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const createTestimonial = useCreateTestimonial();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please write your review');
      return;
    }

    try {
      await createTestimonial.mutateAsync();
      toast.success('Thank you for your review!');
      setContent('');
      setRating(5);
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  if (!user) {
    return (
      <div className="text-center p-6 bg-muted/50 rounded-xl">
        <p className="text-muted-foreground mb-3">Sign in to leave a review</p>
        <Link to="/auth">
          <Button className="gradient-primary border-0">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-card rounded-xl border border-border">
      <div>
        <label className="block text-sm font-medium mb-2">Your Rating</label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1)}
              onMouseEnter={() => setHoveredRating(i + 1)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  i < (hoveredRating || rating)
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-muted-foreground/30'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Your Review</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell us about your experience..."
          rows={4}
        />
      </div>

      <Button
        type="submit"
        className="w-full gradient-primary border-0"
        disabled={createTestimonial.isPending}
      >
        {createTestimonial.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
