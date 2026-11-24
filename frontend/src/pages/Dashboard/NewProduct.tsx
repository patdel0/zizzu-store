import { TextInput } from '../../components/ui/TextInput';
import { useNewProductForm } from './useNewProductForm';

import type { FC } from 'react';

export const NewProduct: FC = () => {
  const { status, handleSubmit } = useNewProductForm();

  return (
    <div>
      <h1>New product</h1>
      {status ? <div>{status}</div> : null}
      <form action={handleSubmit}>
        <div>
          <TextInput name="name" required>Product name</TextInput>
          <TextInput name="details" required>Description</TextInput>
        </div>
        <button type="submit">Create product</button>
      </form>
    </div>
  );
};
