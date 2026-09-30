import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { NewProduct } from '../../src/pages/Dashboard/NewProduct';
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
    describe('successfully creates the product', () => {
      let responseBody: unknown;
      let user: unknown;
      const nameField = () => screen.getByLabelText('Product name');
      const detailsField = () => screen.getByLabelText('Description');
      const submitButton = () => screen.getByText('Create product');

      beforeEach(async () => {
        server.use(
          http.post('http://localhost:8080/products', async ({ request }) => {
            responseBody = await request.clone().json();
            return HttpResponse.json({ status: 200 });
          }),
        );

        user = userEvent.setup();

        await user.type(nameField(), 'Hoodie');
        await user.type(detailsField(), 'Keeps you warm');
      });

      it('posts the form data to `api/products`', async () => {
        await user.click(submitButton());

        expect(responseBody).toStrictEqual({
          name: 'Hoodie',
          details: 'Keeps you warm',
        });
      });

      it('clears the form', async () => {
        await waitFor(() => expect(nameField()).toHaveValue('Hoodie'));

        await user.click(submitButton());

        await waitFor(() => expect(nameField()).toHaveValue(''));
      });
    });
  });
});
