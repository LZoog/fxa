import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// TO DO: Why doesn't this pick up types?
describe('renders without imploding', () => {
  const { queryByTestId } = render(<App />);
  expect(queryByTestId('app')).toBeInTheDocument();
});
