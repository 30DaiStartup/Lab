// Custom components
export { StatusBadge, type Status } from "./StatusBadge"
export { ProgressBar } from "./ProgressBar"
export { PageHeader } from "./PageHeader"
export { DataTable, type Column } from "./DataTable"
export { KanbanColumn, type KanbanColumnType } from "./KanbanColumn"
export { KanbanCard, type Priority } from "./KanbanCard"
export { SearchOverlay } from "./SearchOverlay"
export { NotificationsPanel } from "./NotificationsPanel"

// Re-export shadcn UI components
export { Button, buttonVariants } from "./ui/button"
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./ui/card"
export { Badge, badgeVariants } from "./ui/badge"
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./ui/table"
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog"
export { Input } from "./ui/input"
export { Label } from "./ui/label"
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./ui/select"
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from "./ui/tabs"
