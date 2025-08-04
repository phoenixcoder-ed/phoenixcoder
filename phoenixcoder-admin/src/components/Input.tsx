import { DetailedHTMLProps, InputHTMLAttributes } from 'react';
import { SxProps, Theme } from '@mui/system';

export interface InputProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  sx?: SxProps<Theme>;
}

export default function Input({ sx, ...props }: InputProps) {
  return <input {...props} />;
}