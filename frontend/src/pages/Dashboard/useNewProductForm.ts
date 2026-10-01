import { useState } from 'react';

interface ProductFormHook {
  handleSubmit: (formData: FormData) => Promise<void>;
  status: string;
}

export const useNewProductForm = (): ProductFormHook => {
  const [status, setStatus] = useState('');

  async function handleSubmit(formData: FormData): Promise<void> {
    const data = Object.fromEntries(formData);

    const response = await fetch('http://localhost:8080/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseStatus = response.status;
    if (responseStatus === 201) {
      setStatus('Product created successfully!');
    }
  }

  return { status, handleSubmit };
};
