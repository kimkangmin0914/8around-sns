// Types mirror the applied 202609170001_initial.sql (only insertable columns).
export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  created_at: string;
};
export type Post = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
};
export type Comment = Post & { post_id: string; parent_id: string | null };
export type Follow = {
  follower_id: string;
  followee_id: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: { username: string; display_name: string; bio?: string };
        Update: never;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: { content: string };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: Comment;
        Insert: { post_id: string; parent_id?: string | null; content: string };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_parent_id_fkey";
            columns: ["post_id", "parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["post_id", "id"];
          },
        ];
      };
      follows: {
        Row: Follow;
        Insert: { followee_id: string };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_followee_id_fkey";
            columns: ["followee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
