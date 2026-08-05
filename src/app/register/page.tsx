
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { signUp } from '@/firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse.'),
  password: z.string().min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein.'),
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Registrierung fehlgeschlagen',
        description: 'Authentifizierungsdienst nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
      setIsSubmitting(false);
      return;
    }
    const result = await signUp(auth, firestore, values.email, values.password);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Registrierung fehlgeschlagen',
        description: result.error,
      });
       setIsSubmitting(false);
    } else {
      toast({
        title: 'Registrierung erfolgreich',
        description: 'Ihr Konto wurde erstellt.',
      });
      router.push('/');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Registrieren</CardTitle>
          <CardDescription>Geben Sie Ihre Daten ein, um ein Konto zu erstellen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input placeholder="name@beispiel.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konto erstellen
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Haben Sie bereits ein Konto?{' '}
            <Link href="/login" className="underline">
              Anmelden
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
