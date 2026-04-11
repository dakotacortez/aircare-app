import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeartPulse } from 'lucide-react';
import type { SiteSetting, Media } from '@/payload-types';

interface LandingPageProps {
  data: SiteSetting;
}

export default function LandingPage({ data }: LandingPageProps) {
  const getMediaUrl = (media?: number | Media | null): string | null => {
    if (!media) return null;
    if (typeof media === 'object' && 'url' in media) {
      return media.url || null;
    }
    return null;
  };

  const heroBackgroundUrl = getMediaUrl(data.heroBackgroundImage);
  const backgroundImageUrl = heroBackgroundUrl || '/media/image-hero1.webp';

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      <Image
        src={backgroundImageUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        quality={90}
      />
      <div className="absolute inset-0 bg-black/65" />

      <div className="relative z-10 text-center text-white px-6 max-w-xs mx-auto">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
            <HeartPulse className="h-9 w-9 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-1">Air Care & Mobile Care</h1>
        <p className="text-sm text-white/60 mb-8">Clinical Reference Platform</p>

        <Link
          href="/login"
          className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-lg shadow-red-600/20"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
