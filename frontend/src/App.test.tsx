import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

jest.mock('@/features/pets/petsApi', () => ({
  listPets: async () => ({ items: [], total: 0, page: 1, pageSize: 8 }),
}));

function renderWithProviders(ui: ReactElement, initial = '/') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initial]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders landing hero on /', async () => {
    renderWithProviders(<App />, '/');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Тэжээвэр амьтан/i);
    expect(screen.getByRole('link', { name: /Зарууд үзэх/i })).toHaveAttribute('href', '/pets');
  });

  it('renders login title on /login', async () => {
    renderWithProviders(<App />, '/login');
    expect(await screen.findByRole('heading', { name: /^Нэвтрэх$/i })).toBeInTheDocument();
  });
});
