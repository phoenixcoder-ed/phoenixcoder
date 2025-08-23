// 基础组件
export { Button } from './components/ui/Button';
export { Input } from './components/ui/Input';
export { Textarea } from './components/ui/Textarea';
export { Label } from './components/ui/Label';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/Card';
export { Badge } from './components/ui/Badge';
export { Avatar, AvatarImage, AvatarFallback } from './components/ui/Avatar';
export { Separator } from './components/ui/Separator';
export { Progress } from './components/ui/Progress';
export { Skeleton } from './components/ui/Skeleton';
export { Spinner } from './components/ui/Spinner';

// 表单组件
export { Checkbox } from './components/ui/Checkbox';
export { Radio, RadioGroup } from './components/ui/Radio';
export { Switch } from './components/ui/Switch';
export { Select } from './components/ui/Select';
export { Slider } from './components/ui/Slider';

// 反馈组件
export { Alert, AlertDescription, AlertTitle } from './components/ui/Alert';
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './components/ui/Toast';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/Dialog';
export { Tooltip } from './components/ui/Tooltip';
export { Popover, PopoverContent, PopoverTrigger, PopoverClose, SimplePopover } from './components/ui/Popover';

// 导航组件
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/Tabs';
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/Accordion';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/DropdownMenu';
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './components/ui/Breadcrumb';
export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './components/ui/Pagination';

// 数据展示组件
export { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './components/ui/Table';
export { DataTable } from './components/ui/DataTable';
export { EmptyState } from './components/ui/EmptyState';
export { ErrorBoundary } from './components/ui/ErrorBoundary';

// 布局组件
export { Container } from './components/layout/Container';
export { Grid, GridItem } from './components/layout/Grid';
export { Stack } from './components/layout/Stack';
export { Flex, FlexItem, HStack, VStack, Center, Spacer } from './components/layout/Flex';

// 业务组件
export { UserProfile } from './components/business/UserProfile';
export { TaskCard } from './components/business/TaskCard';
export { SkillTag } from './components/business/SkillTag';
export { LevelBadge } from './components/business/LevelBadge';
export { DifficultyIndicator } from './components/business/DifficultyIndicator';
export { RewardDisplay } from './components/business/RewardDisplay';
export { AchievementCard } from './components/business/AchievementCard';
export { ProgressChart } from './components/business/ProgressChart';
export { NotificationItem } from './components/business/NotificationItem';
export { SearchBox } from './components/business/SearchBox';
export { FilterPanel } from './components/business/FilterPanel';
export { SortSelector } from './components/business/SortSelector';

// 表单组件
export { FormField } from './components/form/FormField';
export { FormGroup } from './components/form/FormGroup';
export { FormSection } from './components/form/FormSection';
export { PasswordInput } from './components/form/PasswordInput';
export { FileUpload } from './components/form/FileUpload';
export { ImageUpload } from './components/form/ImageUpload';
export { DatePicker } from './components/form/DatePicker';
export { DateTimePicker } from './components/form/DateTimePicker';
export { TimePicker } from './components/form/TimePicker';
export { ColorPicker } from './components/form/ColorPicker';
export { TagInput } from './components/form/TagInput';
export { RichTextEditor } from './components/form/RichTextEditor';
export { CodeEditor } from './components/form/CodeEditor';

// 导航组件
export { Navbar } from './components/navigation/Navbar';
export { Sidebar } from './components/navigation/Sidebar';
export { Footer } from './components/navigation/Footer';
export { BackButton } from './components/navigation/BackButton';
export { ScrollToTop } from './components/navigation/ScrollToTop';

// 工具组件
export { ThemeProvider } from './components/providers/ThemeProvider';
export { ToastProvider as ToastProviderComponent } from './components/providers/ToastProvider';
export { ModalProvider } from './components/providers/ModalProvider';
export { LoadingProvider } from './components/providers/LoadingProvider';

// Hooks
export { useTheme } from './hooks/useTheme';
export { useToast } from './hooks/useToast';
export { useModal } from './hooks/useModal';
export { useLoading } from './hooks/useLoading';
export { useLocalStorage } from './hooks/useLocalStorage';
export { useSessionStorage } from './hooks/useSessionStorage';
export { useDebounce } from './hooks/useDebounce';
export { useThrottle } from './hooks/useThrottle';
export { useCopyToClipboard } from './hooks/useCopyToClipboard';
export { useClickOutside } from './hooks/useClickOutside';
export { useKeyPress } from './hooks/useKeyPress';
export { useWindowSize } from './hooks/useWindowSize';
export { useMediaQuery } from './hooks/useMediaQuery';
export { useIntersectionObserver } from './hooks/useIntersectionObserver';
export { usePrevious } from './hooks/usePrevious';
export { useToggle } from './hooks/useToggle';
export { useCounter } from './hooks/useCounter';
export { useArray } from './hooks/useArray';
export { useAsync } from './hooks/useAsync';
export { useFetch } from './hooks/useFetch';
export { useForm } from './hooks/useForm';
export { useValidation } from './hooks/useValidation';

// 工具函数
export { cn } from './utils/cn';
export { formatters } from './utils/formatters';
export { validators } from './utils/validators';
export { animations } from './utils/animations';
export { constants } from './utils/constants';

// 类型定义
export type { ComponentProps, ComponentRef } from './types/component';
export type { ThemeConfig, ThemeMode } from './types/theme';
export type { ToastProps, ToastType } from './types/toast';
export type { ModalProps, ModalSize } from './types/modal';
export type { FormFieldProps, FormValidation } from './types/form';
export type { TableColumn, TableData } from './types/table';
export type { ChartData, ChartConfig } from './types/chart';
export type { AnimationConfig, AnimationType } from './types/animation';

// 样式 - 注意：CSS 文件需要在使用时单独导入
// import './styles/globals.css';
// import './styles/components.css';
// import './styles/utilities.css';

// 版本信息
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

// 组件库配置
export const COMPONENT_CONFIG = {
  prefix: 'pc', // PhoenixCoder prefix
  theme: {
    defaultMode: 'auto' as const,
    storageKey: 'phoenixcoder-theme',
  },
  toast: {
    position: 'bottom-right' as const,
    duration: 4000,
    maxToasts: 5,
  },
  modal: {
    closeOnOverlayClick: true,
    closeOnEscape: true,
    preventScroll: true,
  },
  animation: {
    duration: 200,
    easing: 'ease-in-out',
    reducedMotion: false,
  },
} as const;

// 默认导出
export default {
  VERSION,
  BUILD_DATE,
  COMPONENT_CONFIG,
};