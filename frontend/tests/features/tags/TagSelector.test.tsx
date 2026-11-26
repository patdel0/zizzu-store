import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { TagSelector } from '../../../src/features/tags/TagSelector';
import { server } from '../../msw/server';

const tags = [
  { id: 0, name: 'lan' },
  { id: 1, name: 'lxn' },
  { id: 2, name: 'lin0' },
];

describe('feature: add tags', () => {
  beforeEach(() => {
    server.use(
      http.get(`${import.meta.env.VITE_API_URL}/taxonomies`, ({ request }) => {
        const name = new URL(request.url).searchParams.get('name') ?? '';
        const matchingTags = tags.filter((tag) => tag.name.toLowerCase().includes(name.toLowerCase()));

        return HttpResponse.json(matchingTags);
      }),
    );

    render(<TagSelector />);
  });

  it('renders the tag input field', () => {
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('narrows the suggestions as the admin types', async () => {
    const user = userEvent.setup();
    const textbox = screen.getByRole('textbox');
    const suggestions = within(screen.getByRole('list'));

    expect(suggestions.queryAllByRole('listitem')).toHaveLength(0);

    await user.type(textbox, 'Lin');

    await waitFor(() => {
      const items = suggestions.getAllByRole('listitem');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('lin0');
    });
  });
});
