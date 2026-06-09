import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// A mock simple button component to demonstrate component testing
const ActionButton = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button onClick={onClick} className="bg-blue-500 text-white p-2 rounded">
    {label}
  </button>
);

describe('UI Components - Medium Tests', () => {
  it('renders the button with the correct label', () => {
    render(<ActionButton label="Create Invoice" />);
    
    // Check if the button is in the document
    const button = screen.getByRole('button', { name: /create invoice/i });
    expect(button).toBeInTheDocument();
  });
});
