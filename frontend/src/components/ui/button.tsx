import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const flowHoverClasses =
  'relative z-0 overflow-hidden border border-zinc-300 bg-zinc-100 text-zinc-800 shadow-sm shadow-black/5 transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-zinc-800 before:transition-transform before:duration-1000 before:content-[""] hover:scale-105 hover:text-zinc-100 hover:before:translate-x-[0%] hover:before:translate-y-[0%] active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:before:bg-zinc-200 dark:hover:text-zinc-900'

const buttonVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:text-zinc-800 disabled:hover:before:translate-x-[150%] disabled:hover:before:translate-y-[150%] [&_svg]:pointer-events-none [&_svg]:shrink-0',
    flowHoverClasses,
  ),
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'border-red-200 bg-red-50 text-red-700 before:bg-red-700 hover:text-white dark:border-red-900 dark:bg-red-950 dark:text-red-200 dark:before:bg-red-200 dark:hover:text-red-950',
        outline: 'bg-white text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100',
        secondary: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100',
        ghost: 'border-transparent bg-transparent shadow-none',
        link: 'h-auto border-transparent bg-transparent p-0 text-primary shadow-none before:hidden hover:scale-100 hover:text-primary hover:underline active:scale-100',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-lg px-8',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(!asChild ? { type } : {})}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
