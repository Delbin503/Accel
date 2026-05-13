import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect'; 

import Counter from './counter';

test('renders Counter component with initial value of 0', () => {
  render(<Counter />);

  // Check if the initial value is 0
  const counterElement = screen.getByText(/counter: 0/i);
  expect(counterElement).toBeInTheDocument(); // Using jest-dom matcher
});

test('increments the counter when button is clicked', () => {
  render(<Counter />);

  // Get the button element
  const buttonElement = screen.getByText(/increment/i);

  // Click the button
  fireEvent.click(buttonElement);

  // Check if the counter value increased to 1
  const updatedCounterElement = screen.getByText(/counter: 1/i);
  expect(updatedCounterElement).toBeInTheDocument(); // Using jest-dom matcher
});
