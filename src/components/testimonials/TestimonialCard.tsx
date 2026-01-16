import { Testimonial } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-4">
        <Quote className="h-8 w-8 text-primary/20" />
        
        <p className="text-muted-foreground leading-relaxed">
          "{testimonial.content}"
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="font-semibold text-foreground">{testimonial.user_name}</p>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < testimonial.rating
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
