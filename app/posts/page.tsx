import type { Metadata } from 'next';
import { PostsBoard } from './posts-board';

export const metadata: Metadata = {
  title: 'Posts',
};

export default function PostsPage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <h1 className="w-full max-w-2xl text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Posts
      </h1>
      <PostsBoard />
    </main>
  );
}
