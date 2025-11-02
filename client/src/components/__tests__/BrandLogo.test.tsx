import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandLogo } from '@/components/BrandLogo';

describe('BrandLogo', () => {
  it('renders the logo with accessible alternative text', () => {
    render(<BrandLogo alt="Builder Contractors mark" />);

    const logo = screen.getByRole('img', { name: /builder contractors mark/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src');
  });

  it('applies the correct size classes', () => {
    const { rerender } = render(<BrandLogo size="sm" />);

    const smallLogo = screen.getByRole('img', { name: /builder\.contractors logo/i });
    expect(smallLogo).toHaveClass('h-12');

    rerender(<BrandLogo size="lg" />);

    const largeLogo = screen.getByRole('img', { name: /builder\.contractors logo/i });
    expect(largeLogo).toHaveClass('h-28');
  });
});
