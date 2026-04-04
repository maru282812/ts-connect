"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { PostCard } from "@/components/common/PostCard";
import { SearchBar } from "@/components/common/SearchBar";
import { createClient } from "@/lib/supabase/client";
import type { PostWithRelations } from "@/types/database";

interface OfficialPostsListProps {
  postDetailBasePath?: string;
}

export function OfficialPostsList({
  postDetailBasePath = "/app/official-posts",
}: OfficialPostsListProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("post_type", "OFFICIAL")
        .eq("post_status", "PUBLISHED")
        .order("created_at", { ascending: false });

      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%`,
        );
      }

      const { data } = await query;
      setPosts((data as PostWithRelations[]) ?? []);
      setIsLoading(false);
    };

    const debounce = setTimeout(fetchPosts, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div>
      <PageHeader
        title="公式案件"
        description="会社・運営が掲載する公式案件一覧"
      />

      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="タイトル・本文で検索"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-default-400">
          <p className="text-lg">案件が見つかりませんでした</p>
          {search && (
            <p className="text-sm mt-2">検索キーワードを変えてみてください</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              href={`${postDetailBasePath}/${post.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
