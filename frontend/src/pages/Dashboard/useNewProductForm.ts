interface ProductFormHook {
  handleSubmit: (formData: FormData) => Promise<void>;
}

export const useNewProductForm = (): ProductFormHook => {
  async function handleSubmit(formData: FormData): Promise<void> {
    const data = Object.fromEntries(formData);

    await fetch('http://localhost:8080/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  return { handleSubmit };
};
