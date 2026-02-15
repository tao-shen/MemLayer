import { Sparkles, Zap, Heart, Star } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface NormalHeroProps {
  onOpenDocs?: () => void;
}

export function NormalHero({ onOpenDocs }: NormalHeroProps) {
  const { t } = useLanguage();

  const features = [
    {
      icon: Sparkles,
      title: t('hero.feature1.title') || 'Smart AI Skills',
      description: t('hero.feature1.description') || 'Discover intelligent AI capabilities tailored for you',
    },
    {
      icon: Zap,
      title: t('hero.feature2.title') || 'Lightning Fast',
      description: t('hero.feature2.description') || 'Instant deployment and execution of your skills',
    },
    {
      icon: Heart,
      title: t('hero.feature3.title') || 'User Friendly',
      description: t('hero.feature3.description') || 'Simple and intuitive interface for everyone',
    },
  ];

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-300/20 dark:bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-300/20 dark:bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-300/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-rose-100 dark:border-gray-700 mb-8 hover:shadow-xl transition-shadow duration-300">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('hero.badge') || 'Trusted by 5,000+ happy users'}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-rose-500 via-purple-500 to-amber-500 bg-clip-text text-transparent animate-gradient bg-300%">
              {t('hero.title') || 'Discover Amazing'}
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              {t('hero.title2') || 'AI Skills'}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitleNormal') || 'Enhance your productivity and creativity with our curated collection of AI-powered skills.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('hero.exploreBtn') || 'Explore Skills'}
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button
              onClick={onOpenDocs}
              className="px-8 py-4 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-lg shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:scale-105 transition-all duration-300"
            >
              {t('hero.learnMoreBtn') || 'Learn More'}
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 hover:-translate-y-2 transition-all duration-300 cursor-default"
                >
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
