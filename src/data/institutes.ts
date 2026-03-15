export interface InstituteData {
  id: string;
  name: string;
  sales: number;
  humor: number; // 1-5
  projects: number;
  coordinates: [number, number];
}

export const UFJF_INSTITUTES: InstituteData[] = [
  {
    id: 'ich',
    name: 'Instituto de Ciências Humanas (ICH)',
    sales: 150,
    humor: 4,
    projects: 12,
    coordinates: [-43.3705, -21.7758]
  },
  {
    id: 'ice',
    name: 'Instituto de Ciências Exatas (ICE)',
    sales: 240,
    humor: 3,
    projects: 8,
    coordinates: [-43.3722, -21.7765]
  },
  {
    id: 'engenharia',
    name: 'Faculdade de Engenharia',
    sales: 180,
    humor: 2,
    projects: 22,
    coordinates: [-43.3745, -21.7750]
  },
  {
    id: 'direito',
    name: 'Faculdade de Direito',
    sales: 90,
    humor: 5,
    projects: 5,
    coordinates: [-43.3685, -21.7745]
  }
];
