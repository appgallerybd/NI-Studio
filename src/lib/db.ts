import { supabase } from './supabase';
import type { Chat, Message, Role } from './types';

const CHAT_COLS = 'id,title,model,created_at,updated_at';

export async function listChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select(CHAT_COLS)
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as Chat[];
}

export async function createChat(title: string, model: string): Promise<Chat> {
  const { data, error } = await supabase
    .from('chats')
    .insert({ title, model: model || null })
    .select(CHAT_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as Chat;
}

export async function renameChat(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('chats').update({ title }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function touchChat(id: string): Promise<void> {
  await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', id);
}

export async function deleteChat(id: string): Promise<void> {
  const { error } = await supabase.from('chats').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id,chat_id,role,content,created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

export async function addMessage(chatId: string, role: Role, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, role, content })
    .select('id,chat_id,role,content,created_at')
    .single();
  if (error) throw new Error(error.message);
  return data as Message;
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
