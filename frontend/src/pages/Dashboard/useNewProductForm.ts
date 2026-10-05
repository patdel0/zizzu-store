import { useState } from 'react';

interface ProductFormHook {
  handleSubmit: (formData: FormData) => Promise<void>;
  status: string;
}

export const useNewProductForm = (): ProductFormHook => {
  const [status, setStatus] = useState('');

  async function handleSubmit(formData: FormData): Promise<void> {
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch('http://localhost:8080/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) setStatus('Product created successfully!');
    } catch (error) {
      setStatus('Product creation failed. Please try again.');
    }
  }

  return { status, handleSubmit };
};
