'use client';

import { useState, useEffect, useCallback, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Content } from '@/lib/types';
import { GripVertical, Link as LinkIcon, Image as ImageIcon, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';

type ContentCardProps = {
  post: Content;
  onUpdatePost: (postId: string, data: Partial<Omit<Content, 'id'>>) => void;
  onDeleteRequest: (postId: string) => void;
};

export function ContentCard({ post, onUpdatePost, onDeleteRequest }: ContentCardProps) {
  const [position, setPosition] = useState(post.position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.type === 'text' ? post.data : '');
  const { toast } = useToast();

  const handleDragStart = useCallback((clientX: number, clientY: number, target: HTMLElement) => {
    // Do not start dragging if in edit mode or if the target is interactive
    if (isEditing || target.closest('a, button, textarea')) return;

    if (target.closest('[data-drag-handle]')) {
      setIsDragging(true);
      const rect = (target.closest('.absolute') as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
    }
  }, [isEditing]);
  
  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    handleDragStart(e.clientX, e.clientY, e.target as HTMLElement);
  }, [handleDragStart]);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY, e.target as HTMLElement);
  }, [handleDragStart]);


  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (isDragging) {
      // We calculate position relative to parent
      const parent = document.querySelector('.absolute.top-0.left-0');
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const newPos = {
            x: clientX - parentRect.left - dragOffset.x,
            y: clientY - parentRect.top - dragOffset.y,
        };
        setPosition(newPos);
      }
    }
  }, [isDragging, dragOffset]);
  
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onUpdatePost(post.id, { position });
    }
  }, [isDragging, onUpdatePost, post.id, position]);


  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  }, [handleDragMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  }, [handleDragMove]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchend', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd]);
  
  const handleSave = () => {
    if (editText.trim() === '') {
        toast({
            variant: "destructive",
            title: "Fehler",
            description: "Der Beitrag darf nicht leer sein."
        });
        return;
    }
    onUpdatePost(post.id, { data: editText });
    setIsEditing(false);
    toast({
        title: "Gespeichert",
        description: "Ihr Beitrag wurde aktualisiert."
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText(post.data);
  }

  const renderContent = () => {
    if (isEditing && post.type === 'text') {
        return (
            <div className="space-y-2">
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} className="text-sm"/>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>Abbrechen</Button>
                    <Button size="sm" onClick={handleSave}>Speichern</Button>
                </div>
            </div>
        )
    }

    switch (post.type) {
      case 'text':
        return <p className="text-sm whitespace-pre-wrap">{post.data}</p>;
      case 'image':
        const isDataUrl = post.data.startsWith('data:image');
        let imageUrl = post.data;
        let imageAlt = 'Hochgeladenes Bild';
        let imageHint = '';

        if (!isDataUrl) {
            const image = PlaceHolderImages.find(img => img.id === post.data);
            if (!image) return <div className="text-sm text-destructive">Bild nicht gefunden</div>;
            imageUrl = image.imageUrl;
            imageAlt = image.description;
            imageHint = image.imageHint;
        }

        return (
          <div className="relative aspect-video w-full">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover rounded-md"
              data-ai-hint={imageHint}
              unoptimized={isDataUrl} 
            />
          </div>
        );
      case 'link':
        return (
          <Link href={post.data} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-sm text-primary hover:underline">
            <LinkIcon size={16} className="shrink-0 mt-0.5" />
            <span className="break-all">{post.data}</span>
          </Link>
        );
      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (post.type) {
        case 'text': return <FileText size={14} className="text-muted-foreground" />;
        case 'image': return <ImageIcon size={14} className="text-muted-foreground" />;
        case 'link': return <LinkIcon size={14} className="text-muted-foreground" />;
        default: return null;
    }
  }

  return (
    <div
      className="absolute"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
        zIndex: isDragging ? 10 : 1,
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <Card className="w-64 shadow-lg hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getIcon()}
            </div>
             <div className="flex items-center">
                {!isEditing && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {post.type === 'text' && (
                                <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Bearbeiten</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => onDeleteRequest(post.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Löschen</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                 <div data-drag-handle style={{ cursor: isDragging ? 'grabbing' : 'grab' }} className="p-1 -m-1 ml-1">
                    <GripVertical size={16} className="text-muted-foreground" />
                </div>
            </div>
          </div>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
