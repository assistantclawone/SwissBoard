'use client';

import { useState, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { moderateContent } from '@/ai/flows/moderate-content-for-compliance';
import { Plus, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const textFormSchema = z.object({
  text: z.string().min(10, 'Der Beitrag muss mindestens 10 Zeichen lang sein.'),
});

const linkFormSchema = z.object({
  url: z.string().url('Bitte geben Sie eine gültige URL ein.'),
});

type AddPostPayload = {
    type: 'text' | 'image' | 'link';
    data: string;
}

type AddPostFormProps = {
  onAddPost: (payload: AddPostPayload) => Promise<void>;
};

export function AddPostForm({ onAddPost }: AddPostFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const { toast } = useToast();

  const textForm = useForm<z.infer<typeof textFormSchema>>({
    resolver: zodResolver(textFormSchema),
    defaultValues: { text: '' },
  });

  const linkForm = useForm<z.infer<typeof linkFormSchema>>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: { url: '' },
  });

  const handleCreatePost = async (type: 'text' | 'image' | 'link', data: string) => {
    setIsSubmitting(true);
    await onAddPost({ type, data });
    setIsSubmitting(false);
    setIsOpen(false);
    toast({
        title: "Beitrag hinzugefügt",
        description: "Ihr Beitrag wurde auf der Wand platziert.",
    });
  };

  async function onTextSubmit(values: z.infer<typeof textFormSchema>) {
    setIsSubmitting(true);
    try {
      const moderationResult = await moderateContent({ text: values.text });
      if (!moderationResult.isCompliant) {
        toast({
          variant: 'destructive',
          title: 'Inhaltsmoderation',
          description: `Ihr Beitrag wurde aus folgendem Grund gemeldet: ${moderationResult.reason}. Bitte überarbeiten Sie Ihren Inhalt.`,
          duration: 9000,
        });
        return;
      }
      await handleCreatePost('text', values.text);
      textForm.reset();
    } catch (error) {
      console.error('Error adding text post:', error);
      toast({ variant: 'destructive', title: 'Fehler', description: 'Das Hinzufügen Ihres Beitrags ist fehlgeschlagen.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onLinkSubmit(values: z.infer<typeof linkFormSchema>) {
    setIsSubmitting(true);
    try {
      const moderationResult = await moderateContent({ text: values.url });
      if (!moderationResult.isCompliant) {
        toast({
          variant: 'destructive',
          title: 'Inhaltsmoderation',
          description: `Der Link wurde aus folgendem Grund gemeldet: ${moderationResult.reason}.`,
          duration: 9000,
        });
        return;
      }
      await handleCreatePost('link', values.url);
      linkForm.reset();
    } catch (error) {
      console.error('Error adding link post:', error);
      toast({ variant: 'destructive', title: 'Fehler', description: 'Das Hinzufügen Ihres Links ist fehlgeschlagen.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: 'Bild zu gross',
          description: 'Bitte wählen Sie ein Bild, das kleiner als 2 MB ist.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSubmit = async () => {
    if (imageData) {
      await handleCreatePost('image', imageData);
    } else {
      toast({
        variant: 'destructive',
        title: 'Kein Bild ausgewählt',
        description: 'Bitte laden Sie zuerst ein Bild hoch.',
      });
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        textForm.reset();
        linkForm.reset();
        setImageData(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Beitrag hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen Beitrag hinzufügen</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="image">Bild</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
          </TabsList>
          <TabsContent value="text">
            <Form {...textForm}>
              <form onSubmit={textForm.handleSubmit(onTextSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={textForm.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inhalt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Teilen Sie Ihre Gedanken..."
                          className="resize-none"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Abbrechen</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Beitrag hinzufügen
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="image">
            <div className="pt-4 space-y-4">
                <div className="space-y-2">
                    <FormLabel htmlFor='picture'>Bild hochladen</FormLabel>
                    <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer"/>
                    <p className="text-xs text-muted-foreground">Max. Dateigrösse 2MB.</p>
                </div>
                {imageData && (
                    <div className="space-y-2">
                        <FormLabel>Vorschau</FormLabel>
                        <div className="relative w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageData} alt="Vorschau des hochgeladenen Bildes" className="rounded-md border max-h-48 w-auto mx-auto"/>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Abbrechen</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleImageSubmit} disabled={!imageData || isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Bild hinzufügen
                    </Button>
                </DialogFooter>
            </div>
          </TabsContent>
          <TabsContent value="link">
          <Form {...linkForm}>
              <form onSubmit={linkForm.handleSubmit(onLinkSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={linkForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://beispiel.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Abbrechen</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Link hinzufügen
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
