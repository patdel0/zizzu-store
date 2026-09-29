import React from 'react';

import { render, screen } from '@testing-library/react';

import NewProduct from '../../src/pages/Dashboard/NewProduct';

describe('feature: add a product', () => {
  beforeEach(() => {
    render(<NewProduct />);
  });

  it('renders the name field', () => {
    const nameField = screen.getByLabelText('Product name');
    expect(nameField).toBeInTheDocument();
  });

  it('renders the details field', () => {
    const descriptionField = screen.getByLabelText('Description');
    expect(descriptionField).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    const submitButton = screen.getByText('Create product')
    expect(submitButton).toBeInTheDocument()
  })
});
