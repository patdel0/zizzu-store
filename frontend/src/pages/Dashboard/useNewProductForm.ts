import { useState } from 'react';

interface ProductFormHook {
  handleSubmit: (formData: FormData) => Promise<void>;
  status: string;
}

export const useNewProductForm = (): ProductFormHook => {
  const [status, setStatus] = useState('');

  async function handleSubmit(formData: FormData): Promise<void> {
    const data = Object.fromEntries(formData);
    const csrfToken = await cookieStore.get('XSRF-TOKEN');

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/products', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken.value }),
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
