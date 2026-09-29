import React from 'react';

import { render, screen } from '@testing-library/react';

import NewProduct from '../../src/pages/Dashboard/NewProduct';

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
});
