-- Allow users to delete their own progress (for restart feature)
CREATE POLICY "Users can delete own progress" ON public.progress FOR DELETE USING (auth.uid() = user_id);

-- Allow users to delete their own responses (for restart feature)
CREATE POLICY "Users can delete own responses" ON public.responses FOR DELETE USING (auth.uid() = user_id);