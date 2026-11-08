import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { NewProduct } from '../../src/pages/Dashboard/NewProduct';
import { server } from '../msw/server';

import type { UserEvent } from '@testing-library/user-event';

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
    let responseBody: unknown;
    let user: UserEvent;
    const nameField = () => screen.getByLabelText('Product name');
    const detailsField = () => screen.getByLabelText('Description');
    const submitButton = () => screen.getByText('Create product');

    describe('successfully creates the product', () => {
      beforeEach(async () => {
        server.use(
          http.post(`${import.meta.env.VITE_API_URL}/products`, async ({ request }) => {
            responseBody = await request.clone().json();
            return HttpResponse.json(null, { status: 201 });
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

      it('notifies user of successful submission', async () => {
        await user.click(submitButton());

        const toastContainer = await screen.findByText('Product created successfully!');
        await waitFor(() => expect(toastContainer).toBeInTheDocument());
      });
    });

    describe('form submission fails', () => {
      beforeEach(async () => {
        user = userEvent.setup();

        await user.type(nameField(), 'Hoodie');
        await user.type(detailsField(), 'Keeps you warm');
      });

      it('notifies the user when request errors', async () => {
        server.use(
          http.post(`${import.meta.env.VITE_API_URL}/products`, async ({ request }) => {
            responseBody = await request.clone().json();
            return HttpResponse.error();
          }),
        );

        await user.click(submitButton());

        const toastContainer = await screen.findByText(/Product creation failed/);
        await waitFor(() => expect(toastContainer).toBeInTheDocument());
      });
    });
  });
});
