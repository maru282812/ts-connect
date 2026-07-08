"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { NewsletterForm } from "@/components/screens/NewsletterForm";
import { fetchIssue, type NewsletterIssue } from "@/lib/newsletter";

export default function NewsletterEditPage() {
  const params = useParams();
  const issueId = params.issueId as string;
  const [issue, setIssue] = useState<NewsletterIssue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await fetchIssue(issueId);
      if (active) {
        setIssue(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [issueId]);

  if (loading) {
    return <div className="bg-white rounded-xl h-96 animate-pulse" />;
  }

  if (!issue) {
    return (
      <div className="text-center py-16 text-default-500">
        社内報が見つかりませんでした
      </div>
    );
  }

  return <NewsletterForm issue={issue} />;
}
