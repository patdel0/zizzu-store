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

      if (!response.ok) {
        setStatus(`Error: ${response.status} Please contact the developers.`);
        return;
      }

      setStatus('Product created successfully!');
    } catch (error) {
      console.log(error);
      setStatus('Failed to create the product. Please try again.');
    }
  }

  return { status, handleSubmit };
};
