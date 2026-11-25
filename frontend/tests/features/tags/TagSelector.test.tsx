import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';


import { server } from '../../msw/server';

import type { UserEvent } from '@testing-library/user-event';
import { TagSelector } from '../../../src/features/tags/TagSelector';

describe('feature: add tags', () => {
  beforeEach(() => {
    render(<TagSelector />);
  });

  describe('initial render', () => {
    it('renders the tag input field', () => {
      const textbox = screen.getByRole('textbox');

      expect(textbox).toBeInTheDocument();
    });
  });
});
