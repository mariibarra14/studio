
export type Category = {
  _id: string;
  Nombre: string;
  Descripcion: string;
};

const categoriesData: Category[] = [
  {
    _id: "43f8e56b-a2c7-430f-b4c6-e711d950c4e1",
    Nombre: "Deportes",
    Descripcion: "Incluye todos los eventos deportivos profesionales y universitarios. Abarca ligas importantes como fútbol (soccer), baloncesto (NBA), béisbol (MLB), hockey (NHL), fútbol americano (NFL), y también deportes de motor, tenis, golf, y lucha libre."
  },
  {
    _id: "90a1f0d3-3b7c-41c1-9e45-12d83b5c2a9f",
    Nombre: "Conciertos",
    Descripcion: "Eventos musicales que van desde giras de artistas pop internacionales, bandas de rock, hip-hop, música electrónica y festivales de música masivos."
  },
  {
    _id: "c86d790f-5e82-411a-b670-34a94f6e52c8",
    Nombre: "Teatro y Artes Escénicas",
    Descripcion: "Cubre espectáculos dramáticos, musicales de Broadway, obras de teatro, ópera, ballet, danza contemporánea, y producciones de compañías teatrales locales e internacionales."
  },
  {
    _id: "1e6a27e7-b67f-44e9-99a3-5f0d3b4a2d8d",
    Nombre: "Comedia",
    Descripcion: "Presentaciones de comediantes de stand-up, giras de monólogos, festivales de comedia y shows de improvisación. Ideal para buscar un plan de humor."
  },
  {
    _id: "6b4c3e7a-1f8d-42e0-b0b3-0987c6e5a4d2",
    Nombre: "Festivales",
    Descripcion: "Concentra eventos de larga duración que combinan múltiples actos o géneros. Generalmente incluye festivales de música (Lollapalooza, Coachella), festivales gastronómicos o culturales y grandes celebraciones anuales."
  },
  {
    _id: "0a7e3d1c-8b5f-4d6a-9e2c-3f4b5a7d0e91",
    Nombre: "Navideño y Fin de Año",
    Descripcion: "Espectáculos de temporada, conciertos de gaitas y aguinaldos, encendidos de luces, cenas de fin de año, y ferias temáticas de Navidad."
  }
];

export const getCategoryById = (categoryId: string): Category | null => {
  return categoriesData.find(cat => cat._id === categoryId) || null;
};

export const getCategoryNameById = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  return category ? category.Nombre : 'Categoría no especificada';
};

export const getAllCategories = (): Category[] => {
  return categoriesData;
};
