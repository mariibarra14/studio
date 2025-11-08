import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Ticket } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const concertBg = PlaceHolderImages.find(p => p.id === 'concert-background-1');

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
       {concertBg && (
        <Image
          src={concertBg.imageUrl}
          alt={concertBg.description}
          data-ai-hint={concertBg.imageHint}
          fill
          className="object-cover -z-10 brightness-50"
        />
      )}
      <div className="w-full max-w-md">
        <Link href="/">
          <div className="mb-8 flex justify-center text-white">
            <Ticket className="h-10 w-10" />
          </div>
        </Link>
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back!</CardTitle>
            <CardDescription>Sign in to your TicketVerse account</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
