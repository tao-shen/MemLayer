import { Upload, Edit3, Github } from 'lucide-react';

interface SkillCreationMethodSelectorProps {
  onSelectMethod: (method: 'upload' | 'manual' | 'github') => void;
}

export function SkillCreationMethodSelector({ onSelectMethod }: SkillCreationMethodSelectorProps) {
  const methods = [
    {
      id: 'upload',
      title: 'Upload Files',
      description: 'Upload your local files and let AI analyze them to create a skill',
      icon: Upload,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'manual',
      title: 'Manual Creation',
      description: 'Create a skill by manually entering all the details and configuration',
      icon: Edit3,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'github',
      title: 'Import from GitHub',
      description: 'Import a skill from a GitHub repository (skill.md file)',
      icon: Github,
      color: 'from-gray-700 to-gray-800',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Creation Method</h2>
        <p className="text-gray-600">Select how you'd like to create your new skill</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id as 'upload' | 'manual' | 'github')}
              className="group relative overflow-hidden rounded-xl bg-white border-2 border-gray-200 hover:border-pink-500 transition-all hover:shadow-lg p-6 text-left"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

              {/* Content */}
              <div className="relative z-10 space-y-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center text-white`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                    {method.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.description}
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center text-sm font-medium text-pink-600 group-hover:text-pink-700">
                    Get Started →
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
