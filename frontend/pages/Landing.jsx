import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recipesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RecipeForm from '../src/components/RecipeForm';
import RecipeList from '../src/components/RecipeList';
import SearchBar from '../src/components/SearchBar';
import AuthButton from '../src/components/AuthButton';

export default function Landing() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ['recipes', searchQuery],
    queryFn: () => recipesApi.getAll(searchQuery).then(res => res.data),
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">Recipe Manager</h1>
          <p className="text-xl text-gray-600 mb-8">
            Save, organize, and access your favorite recipes from anywhere
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-600">Recipe Manager</h1>
            <AuthButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-96">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Recipe
          </button>
        </div>

        <RecipeList recipes={recipes} isLoading={isLoading} error={error} />
      </main>

      <RecipeForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
