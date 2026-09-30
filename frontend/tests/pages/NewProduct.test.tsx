import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import NewProduct from '../../src/pages/Dashboard/NewProduct';
import { server } from '../msw/server';

describe('feature: add a product', () => {
  beforeEach(() => {
    render(<NewProduct />);
  });

  describe('initial render', () => {
    const requiredFieldsText = ['Product name', 'Description'];
    it.for(requiredFieldsText)('renders the %s field', (element) => {
      const descriptionField = screen.getByLabelText(element);

      expect(descriptionField).toBeInTheDocument();
    });

    it.for(requiredFieldsText)('the %s field is required for submission', (element) => {
      const descriptionField = screen.getByLabelText(element);

      expect(descriptionField).toHaveAttribute('required');
    });

    it('renders the submit button', () => {
      const submitButton = screen.getByText('Create product');

      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('posts the form data to `api/products`', async () => {
      let responseBody: unknown;

      server.use(
        http.post('http://localhost:8080/products', async ({ request }) => {
          responseBody = await request.clone().json();
        }),
      );

      const user = userEvent.setup();

      const nameField = screen.getByLabelText('Product name');
      await user.type(nameField, 'Hoodie');

      const detailsField = screen.getByLabelText('Description');
      await user.type(detailsField, 'Keeps you warm');

      const submitButton = screen.getByText('Create product');
      await user.click(submitButton);

      expect(responseBody).toStrictEqual({
        name: 'Hoodie', details: 'Keeps you warm',
      });
    });
  });
});
