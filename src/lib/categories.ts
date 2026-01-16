
export type Category = {
  id: string;
  nombre: string;
  descripcion: string;
};

export const getAllCategories = async (token: string): Promise<Category[]> => {
  try {
    const response = await fetch('http://localhost:44335/api/events/Categorias', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      console.error('Failed to fetch categories:', response.statusText);
      return [];
    }
    const data: Category[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getCategoryNameById = (categories: Category[], categoryId: string): string => {
  if (!categories || categories.length === 0) {
    return 'Cargando...';
  }
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.nombre : 'Categoría no especificada';
};
