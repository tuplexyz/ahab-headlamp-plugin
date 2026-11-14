import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { BrandText } from './BrandText';
import { PageHeader } from './PageLayout';

afterEach(cleanup);

it('formats each standalone brand name without changing other text', () => {
  const { container } = render(
    <BrandText text="Ahab and AHAB API at tuple.xyz/solutions/ahab; sahab" />
  );

  expect(container.textContent).toBe('ahab and ahab API at tuple.xyz/solutions/ahab; sahab');
  const words = container.querySelectorAll('span');
  expect(words).toHaveLength(3);
  words.forEach(word => expect(word.style.fontFamily).toContain('Righteous'));
});

it('formats the brand in page headers and descriptions', () => {
  render(<PageHeader title="Ahab jobs" description="Connect to the Ahab API." />);

  expect(
    screen.getByRole('heading', { name: 'ahab jobs' }).querySelector('span')?.style.fontFamily
  ).toContain('Righteous');
  expect(screen.getAllByText('ahab', { selector: 'span' })).toHaveLength(2);
});
