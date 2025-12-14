import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecipes } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AuthButton from '../components/AuthButton';
import RecipeList from '../components/RecipeList';
import RecipeForm from '../components/RecipeForm';
import SearchBar from '../components/SearchBar';

export default function Landing() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    data: recipes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['recipes', searchQuery],
    queryFn: () => fetchRecipes(searchQuery),
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Recipe Manager
            </h1>
            <p className="text-lg text-gray-600">
              Save and organize your favorite recipes
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-700 mb-6">
              Sign in to start managing your recipes
            </p>
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Recipe Manager</h1>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
            >
              Add Recipe
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading recipes...</div>
          </div>
        ) : (
          <RecipeList recipes={recipes} onUpdate={refetch} />
        )}

        {isFormOpen && (
          <RecipeForm
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              refetch();
            }}
          />
        )}
      </main>
    </div>
  );
}
