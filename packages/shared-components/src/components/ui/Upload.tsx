import React from 'react';
import { cn } from '../../utils/cn';

export interface UploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFileSelect?: (files: File[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'dropzone';
}

const Upload = React.forwardRef<HTMLInputElement, UploadProps>(
  ({ 
    className,
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    onFileSelect,
    onError,
    disabled = false,
    children,
    variant = 'default',
    ...props 
  }, ref) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const validateFiles = (files: FileList): File[] => {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];

      for (const file of fileArray) {
        // 检查文件大小
        if (maxSize && file.size > maxSize) {
          onError?.(`文件 "${file.name}" 超过最大大小限制 ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
          continue;
        }

        // 检查文件数量
        if (maxFiles && validFiles.length >= maxFiles) {
          onError?.(`最多只能上传 ${maxFiles} 个文件`);
          break;
        }

        validFiles.push(file);
      }

      return validFiles;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFileSelect?.(validFiles);
      }

      // 清空input值，允许重复选择同一文件
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const validFiles = validateFiles(files);
        if (validFiles.length > 0) {
          onFileSelect?.(validFiles);
        }
      }
    };

    const handleClick = () => {
      if (!disabled && inputRef.current) {
        inputRef.current.click();
      }
    };

    if (variant === 'dropzone') {
      return (
        <div
          className={cn(
            'relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-muted-foreground/50',
            isDragOver && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            {...props}
          />
          {children || (
            <div className="space-y-2">
              <div className="text-muted-foreground">
                拖拽文件到此处或点击选择文件
              </div>
              {accept && (
                <div className="text-xs text-muted-foreground">
                  支持格式: {accept}
                </div>
              )}
              {maxSize && (
                <div className="text-xs text-muted-foreground">
                  最大文件大小: {(maxSize / 1024 / 1024).toFixed(1)}MB
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={cn('relative', className)}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          {...props}
        />
        {children || (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
              'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2'
            )}
          >
            选择文件
          </button>
        )}
      </div>
    );
  }
);

Upload.displayName = 'Upload';

export { Upload };