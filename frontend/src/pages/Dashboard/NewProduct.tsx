import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { TagSelector } from '../../features/tags/TagSelector';
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
        <TagSelector />
        <Button type="submit">Create product</Button>
      </form>
    </div>
  );
};
