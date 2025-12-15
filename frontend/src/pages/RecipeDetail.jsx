import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi, uploadsApi } from '../services/api';
import { useState } from 'react';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [downloadUrl, setDownloadUrl] = useState('');

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesApi.getById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: recipesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/');
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (recipe.isFavorite) {
        await recipesApi.removeFavorite(id);
      } else {
        await recipesApi.addFavorite(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const handleDownload = async () => {
    if (recipe.type === 'document' && recipe.storageKey) {
      const data = await uploadsApi.getPresignedDownloadUrl(id);
      setDownloadUrl(data.presignedUrl);
      window.open(data.presignedUrl, '_blank');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Recipe not found</h2>
        <Link to="/" className="text-blue-600 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold text-blue-600">Recipe Manager</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {recipe.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="capitalize bg-gray-100 px-3 py-1 rounded-full">
                    {recipe.type}
                  </span>
                  <span>
                    Added {new Date(recipe.createdAt).toLocaleDateString()}
                  </span>
                  {recipe.updatedAt !== recipe.createdAt && (
                    <span>
                      Updated {new Date(recipe.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => toggleFavoriteMutation.mutate()}
                className={`transition-colors ${
                  recipe.isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'
                }`}
                disabled={toggleFavoriteMutation.isPending}
              >
                <svg className="w-8 h-8" fill={recipe.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {recipe.type.toLowerCase() === 'link' && recipe.url && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">Recipe Link</h2>
                <a
                  href={recipe.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {recipe.url}
                </a>
              </div>
            )}

            {recipe.type.toLowerCase() === 'document' && recipe.storageKey && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">Recipe Document</h2>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Document
                </button>
              </div>
            )}

            {recipe.type.toLowerCase() === 'manual' && recipe.content && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">Recipe</h2>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed bg-gray-50 p-4 rounded">
                    {recipe.content}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Recipe'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
