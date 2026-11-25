import type { ComponentPropsWithoutRef, FC } from "react"


export const Button: FC<ComponentPropsWithoutRef<'button'>> = ({ children, ...props }) => (
  <button {...props}>{children}</button>
)
