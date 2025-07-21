import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { LibraryStats, RecentData, IssueWithDetails, Issue } from '@/types';
import { OVERDUE_DAYS } from '@/constants';

export function useLibraryStats(libraryId: string | null) {
  const [stats, setStats] = useState<LibraryStats>({
    totalBooks: 0,
    totalMembers: 0,
    activeIssues: 0,
    overdueBooks: 0,
    returnedIssues: 0,
    availableBooks: 0,
  });

  const [recentData, setRecentData] = useState<RecentData>({
    recentBooks: [],
    recentMembers: [],
    recentIssues: [],
    overdueIssues: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!libraryId) {
      setLoading(false);
      return;
    }

    loadStats(libraryId);
  }, [libraryId]);

  const loadStats = async (libId: string) => {
    try {
      setLoading(true);
      
      // Get accurate counts without limits
      const [booksCountResult, membersCountResult, allIssuesResult, recentBooksResult, recentMembersResult] = await Promise.all([
        supabase
          .from('book_management')
          .select('*', { count: 'exact', head: true })
          .eq('library_id', libId),
        supabase
          .from('member_management')
          .select('*', { count: 'exact', head: true })
          .eq('library_id', libId),
        supabase
          .from('issue_management')
          .select('*')
          .eq('library_id', libId),
        supabase
          .from('book_management')
          .select('*')
          .eq('library_id', libId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('member_management')
          .select('*')
          .eq('library_id', libId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const booksCount = booksCountResult.count || 0;
      const membersCount = membersCountResult.count || 0;
      const allIssues = allIssuesResult.data || [];

      const activeIssues = allIssues.filter((i: Issue) => !i.i_date_of_ret);
      const returnedIssues = allIssues.filter((i: Issue) => i.i_date_of_ret);

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - OVERDUE_DAYS);

      const overdueIssues = activeIssues.filter((i: Issue) => {
        const issueDate = new Date(i.i_date_of_iss);
        return issueDate < fourteenDaysAgo;
      });

      // Get issued book codes (only from active issues)
      const issuedBookCodes = new Set(activeIssues.map((i: Issue) => i.ib_code));
      const availableBooks = booksCount - issuedBookCodes.size;

      setStats({
        totalBooks: booksCount,
        totalMembers: membersCount,
        activeIssues: activeIssues.length,
        overdueBooks: overdueIssues.length,
        returnedIssues: returnedIssues.length,
        availableBooks: Math.max(0, availableBooks),
      });

      // Get recent issues with details (limit to 5 most recent)
      const recentIssues = allIssues
        .sort((a: Issue, b: Issue) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const recentIssuesWithDetails = await Promise.all(
        recentIssues.map(async (issue: Issue) => {
          const [book, member] = await Promise.all([
            supabase
              .from('book_management')
              .select('b_name, b_author')
              .eq('b_code', issue.ib_code)
              .eq('library_id', libId)
              .single(),
            supabase
              .from('member_management')
              .select('m_name')
              .eq('m_code', issue.im_code)
              .eq('library_id', libId)
              .single(),
          ]);
          return {
            ...issue,
            book: book.data,
            member: member.data,
          } as IssueWithDetails;
        })
      );

      setRecentData({
        recentBooks: recentBooksResult.data || [],
        recentMembers: recentMembersResult.data || [],
        recentIssues: recentIssuesWithDetails,
        overdueIssues: await Promise.all(
          overdueIssues.slice(0, 5).map(async (issue: Issue) => {
            const [book, member] = await Promise.all([
              supabase
                .from('book_management')
                .select('b_name, b_author')
                .eq('b_code', issue.ib_code)
                .eq('library_id', libId)
                .single(),
              supabase
                .from('member_management')
                .select('m_name')
                .eq('m_code', issue.im_code)
                .eq('library_id', libId)
                .single(),
            ]);
            return {
              ...issue,
              book: book.data,
              member: member.data,
            } as IssueWithDetails;
          })
        ),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, recentData, loading, refetch: () => libraryId && loadStats(libraryId) };
}

