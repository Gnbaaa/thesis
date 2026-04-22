import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the platform heading in Mongolian', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Тэжээвэр амьтдын нэгдсэн платформ/i }),
    ).toBeInTheDocument();
  });
});
