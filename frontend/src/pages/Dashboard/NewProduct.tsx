import { useNewProductForm } from './useNewProductForm';

import type { FC } from 'react';

export const NewProduct: FC = () => {
  const { handleSubmit } = useNewProductForm();

  return (
    <div>
      <h1>New product</h1>
      <form action={handleSubmit}>
        <div>
          <label htmlFor="name">
            <span>Product name</span>
            <input required id="name" name="name" type="text" />
          </label>

          <label htmlFor="details">
            <span>Description</span>
            <input required id="details" name="details" type="text" />
          </label>
        </div>

        <button type="submit">Create product</button>
      </form>
    </div>
  );
};
