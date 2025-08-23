import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Upload, X, Image, Camera, Eye, Download } from 'lucide-react';

// 图片上传状态枚举
export enum ImageUploadStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// 图片信息接口
export interface ImageInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  url: string; // 预览URL
  uploadUrl?: string; // 上传后的URL
  status: ImageUploadStatus;
  progress: number;
  error?: string;
  width?: number;
  height?: number;
}

// 图片上传属性接口
export interface ImageUploadProps {
  className?: string;
  multiple?: boolean;
  maxSize?: number; // 字节
  maxFiles?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number; // 宽高比
  quality?: number; // 压缩质量 0-1
  disabled?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  dragAndDrop?: boolean;
  cropEnabled?: boolean;
  resizeEnabled?: boolean;
  value?: ImageInfo[];
  onChange?: (images: ImageInfo[]) => void;
  onUpload?: (file: File) => Promise<string>; // 返回图片URL
  onRemove?: (imageId: string) => void;
  onPreview?: (image: ImageInfo) => void;
  placeholder?: string;
  uploadText?: string;
  browseText?: string;
  removeText?: string;
  previewText?: string;
  downloadText?: string;
  errorMessages?: {
    maxSize?: string;
    maxFiles?: string;
    dimensions?: string;
    aspectRatio?: string;
    uploadError?: string;
  };
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取图片尺寸
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// 压缩图片
const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new window.Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// 图片项组件
const ImageItem: React.FC<{
  image: ImageInfo;
  showPreview: boolean;
  showProgress: boolean;
  onRemove: (id: string) => void;
  onPreview?: (image: ImageInfo) => void;
  removeText: string;
  previewText: string;
  downloadText: string;
}> = ({ 
  image, 
  showPreview, 
  showProgress, 
  onRemove, 
  onPreview,
  removeText, 
  previewText, 
  downloadText 
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.uploadUrl || image.url;
    link.download = image.name;
    link.click();
  };
  
  return (
    <div className="relative group">
      {/* 图片预览 */}
      <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
        {showPreview ? (
          <img
            src={image.url}
            alt={image.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* 上传进度覆盖层 */}
        {showProgress && image.status === ImageUploadStatus.UPLOADING && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Progress value={image.progress} className="w-20 h-2 mb-2" />
              <div className="text-xs">{image.progress}%</div>
            </div>
          </div>
        )}
        
        {/* 错误状态覆盖层 */}
        {image.status === ImageUploadStatus.ERROR && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="text-center text-red-600">
              <X className="w-6 h-6 mx-auto mb-1" />
              <div className="text-xs">上传失败</div>
            </div>
          </div>
        )}
        
        {/* 操作按钮覆盖层 */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {onPreview && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPreview(image)}
              title={previewText}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          
          {image.status === ImageUploadStatus.SUCCESS && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              title={downloadText}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRemove(image.id)}
            title={removeText}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* 图片信息 */}
      <div className="mt-2 text-center">
        <div className="text-xs font-medium truncate">{image.name}</div>
        <div className="text-xs text-muted-foreground">
          {formatFileSize(image.size)}
          {image.width && image.height && (
            <span className="ml-1">
              {image.width}×{image.height}
            </span>
          )}
        </div>
        
        {/* 错误信息 */}
        {image.status === ImageUploadStatus.ERROR && image.error && (
          <div className="text-xs text-red-600 mt-1">{image.error}</div>
        )}
      </div>
    </div>
  );
};

// 图片上传组件
export const ImageUpload: React.FC<ImageUploadProps> = ({
  className,
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 10,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,
  aspectRatio,
  quality = 0.8,
  disabled = false,
  showPreview = true,
  showProgress = true,
  dragAndDrop = true,
  cropEnabled = false,
  resizeEnabled = false,
  value = [],
  onChange,
  onUpload,
  onRemove,
  onPreview,
  placeholder = '点击上传图片或拖拽图片到此处',
  uploadText = '上传图片',
  browseText = '选择图片',
  removeText = '删除图片',
  previewText = '预览图片',
  downloadText = '下载图片',
  errorMessages = {}
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [images, setImages] = useState<ImageInfo[]>(value);
  
  // 验证图片
  const validateImage = async (file: File): Promise<string | null> => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return '请选择图片文件';
    }
    
    // 检查文件大小
    if (file.size > maxSize) {
      return errorMessages.maxSize || `图片大小不能超过 ${formatFileSize(maxSize)}`;
    }
    
    try {
      // 检查图片尺寸
      const { width, height } = await getImageDimensions(file);
      
      if (minWidth && width < minWidth) {
        return errorMessages.dimensions || `图片宽度不能小于 ${minWidth}px`;
      }
      
      if (minHeight && height < minHeight) {
        return errorMessages.dimensions || `图片高度不能小于 ${minHeight}px`;
      }
      
      if (maxWidth && width > maxWidth) {
        return errorMessages.dimensions || `图片宽度不能大于 ${maxWidth}px`;
      }
      
      if (maxHeight && height > maxHeight) {
        return errorMessages.dimensions || `图片高度不能大于 ${maxHeight}px`;
      }
      
      // 检查宽高比
      if (aspectRatio) {
        const ratio = width / height;
        const tolerance = 0.1; // 10% 容差
        if (Math.abs(ratio - aspectRatio) > tolerance) {
          return errorMessages.aspectRatio || `图片宽高比应为 ${aspectRatio.toFixed(2)}`;
        }
      }
    } catch (error) {
      return '无法读取图片信息';
    }
    
    return null;
  };
  
  // 处理图片选择
  const handleImages = useCallback(async (selectedFiles: FileList) => {
    const newImages: ImageInfo[] = [];
    
    // 检查图片数量限制
    if (images.length + selectedFiles.length > maxFiles) {
      alert(errorMessages.maxFiles || `最多只能上传 ${maxFiles} 张图片`);
      return;
    }
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const error = await validateImage(file);
      
      let processedFile = file;
      let dimensions = { width: 0, height: 0 };
      
      if (!error) {
        try {
          dimensions = await getImageDimensions(file);
          
          // 压缩图片
          if (resizeEnabled && quality < 1) {
            processedFile = await compressImage(file, quality);
          }
        } catch (err) {
          // 忽略处理错误，使用原文件
        }
      }
      
      const imageInfo: ImageInfo = {
        id: `${Date.now()}-${i}`,
        file: processedFile,
        name: file.name,
        size: processedFile.size,
        url: URL.createObjectURL(processedFile),
        status: error ? ImageUploadStatus.ERROR : ImageUploadStatus.IDLE,
        progress: 0,
        error: error || undefined,
        width: dimensions.width,
        height: dimensions.height
      };
      
      newImages.push(imageInfo);
    }
    
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onChange?.(updatedImages);
    
    // 自动上传图片
    if (onUpload) {
      for (const imageInfo of newImages) {
        if (imageInfo.status === ImageUploadStatus.IDLE) {
          await uploadImage(imageInfo);
        }
      }
    }
  }, [images, maxFiles, maxSize, onChange, onUpload]);
  
  // 上传图片
  const uploadImage = async (imageInfo: ImageInfo) => {
    if (!onUpload) return;
    
    // 更新状态为上传中
    const updatedImages = images.map(img => 
      img.id === imageInfo.id 
        ? { ...img, status: ImageUploadStatus.UPLOADING, progress: 0 }
        : img
    );
    setImages(updatedImages);
    onChange?.(updatedImages);
    
    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setImages(prev => prev.map(img => 
          img.id === imageInfo.id && img.progress < 90
            ? { ...img, progress: img.progress + 10 }
            : img
        ));
      }, 200);
      
      const uploadUrl = await onUpload(imageInfo.file);
      
      clearInterval(progressInterval);
      
      // 更新状态为成功
      const finalImages = images.map(img => 
        img.id === imageInfo.id 
          ? { ...img, status: ImageUploadStatus.SUCCESS, progress: 100, uploadUrl }
          : img
      );
      setImages(finalImages);
      onChange?.(finalImages);
    } catch (error) {
      // 更新状态为失败
      const errorImages = images.map(img => 
        img.id === imageInfo.id 
          ? { 
              ...img, 
              status: ImageUploadStatus.ERROR, 
              progress: 0, 
              error: errorMessages.uploadError || '上传失败，请重试' 
            }
          : img
      );
      setImages(errorImages);
      onChange?.(errorImages);
    }
  };
  
  // 移除图片
  const handleRemove = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      // 释放预览URL
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    onChange?.(updatedImages);
    onRemove?.(imageId);
  };
  
  // 处理文件输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleImages(selectedFiles);
    }
    // 清空输入值以允许重复选择同一文件
    e.target.value = '';
  };
  
  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && dragAndDrop) {
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
    
    if (disabled || !dragAndDrop) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleImages(droppedFiles);
    }
  };
  
  // 打开文件选择器
  const openFileSelector = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* 上传区域 */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          {
            'border-primary bg-primary/5': isDragOver,
            'border-muted-foreground/25 hover:border-muted-foreground/50': !isDragOver && !disabled,
            'border-muted-foreground/10 opacity-50 cursor-not-allowed': disabled
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Camera className="w-6 h-6 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{placeholder}</p>
            
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                openFileSelector();
              }}
            >
              {browseText}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              支持 JPG、PNG、GIF 格式，
              单张图片最大 {formatFileSize(maxSize)}，
              最多 {maxFiles} 张图片
              {aspectRatio && (
                <span className="block mt-1">
                  建议宽高比：{aspectRatio.toFixed(2)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* 图片网格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image) => (
            <ImageItem
              key={image.id}
              image={image}
              showPreview={showPreview}
              showProgress={showProgress}
              onRemove={handleRemove}
              onPreview={onPreview}
              removeText={removeText}
              previewText={previewText}
              downloadText={downloadText}
            />
          ))}
        </div>
      )}
    </div>
  );
};