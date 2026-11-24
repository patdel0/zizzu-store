import type { FC, ReactNode } from 'react';

interface TextInputProps {
  children: ReactNode;
  required?: boolean;
  name: string;
  placeholder?: string;
}

export const TextInput: FC<TextInputProps> = ({ children, required, name, placeholder }) => (
  <label htmlFor={name}>
    <span>{children}</span>
    <input required={required} id={name} name={name} placeholder={placeholder} type="text" />
  </label>
);
