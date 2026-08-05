import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Wall } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type WallWithId = Wall & { id: string };

type WallCardProps = {
  wall: WallWithId;
  onEdit: () => void;
  onDelete: () => void;
};

export function WallCard({ wall, onEdit, onDelete }: WallCardProps) {
  const createdAtDate = wall.createdAt && 'toDate' in wall.createdAt
    ? wall.createdAt.toDate()
    : new Date();

  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true, locale: de });

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-lg relative group">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100"
            onClick={handleDropdownClick}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={handleDropdownClick}>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Namen bearbeiten</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Löschen</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
        
      <Link href={`/wall/${wall.id}`} className="block h-full w-full flex-grow">
        <CardHeader>
          <CardTitle className="truncate pr-8">{wall.title}</CardTitle>
          <CardDescription>
            {timeAgo ? `Erstellt ${timeAgo}` : 'Gerade erstellt'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <FileText className="mr-1 h-4 w-4" />
            <span>Wand öffnen</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
