import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the counter', () => {
  render(<App />);
  const linkElement = screen.getByText(/Counter/i);
  expect(linkElement).toBeInTheDocument();
});
