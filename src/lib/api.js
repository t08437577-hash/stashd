import { supabase } from './supabase.js'

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const signUp   = (email, pw) => supabase.auth.signUp({ email, password: pw })
export const signIn   = (email, pw) => supabase.auth.signInWithPassword({ email, password: pw })
export const signOut  = ()          => supabase.auth.signOut()
export const getSession = ()        => supabase.auth.getSession()

// ── PROFILE ───────────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).single()
  return { data, error }
}

export async function upsertProfile(userId, fields) {
  const { data, error } = await supabase
    .from('profiles').upsert({ id: userId, ...fields }).select().single()
  return { data, error }
}

export async function uploadAvatar(userId, file) {
  const ext  = file.name.split('.').pop()
  const path = `avatars/${userId}.${ext}`
  const { error } = await supabase.storage.from('user-photos').upload(path, file, { upsert: true })
  if (error) return { url: null, error }
  const { data } = supabase.storage.from('user-photos').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// ── COLLECTIONS ───────────────────────────────────────────────────────────────
export async function getCollections() {
  const { data, error } = await supabase
    .from('collections').select('*').eq('published', true).order('sort_order')
  return { data: data || [], error }
}

export async function getAllCollectionsAdmin() {
  const { data, error } = await supabase
    .from('collections').select('*').order('sort_order')
  return { data: data || [], error }
}

export async function upsertCollection(fields) {
  const { data, error } = await supabase
    .from('collections').upsert(fields).select().single()
  return { data, error }
}

export async function deleteCollection(id) {
  return supabase.from('collections').delete().eq('id', id)
}

export async function uploadCollectionCover(collectionId, file) {
  const ext  = file.name.split('.').pop()
  const path = `covers/${collectionId}.${ext}`
  const { error } = await supabase.storage.from('collection-covers').upload(path, file, { upsert: true })
  if (error) return { url: null, error }
  const { data } = supabase.storage.from('collection-covers').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// ── ITEMS ─────────────────────────────────────────────────────────────────────
export async function getItems(collectionId) {
  const { data, error } = await supabase
    .from('items')
    .select('*, item_photos(*)')
    .eq('collection_id', collectionId)
    .order('number')
  return { data: data || [], error }
}

export async function upsertItem(fields) {
  const { data, error } = await supabase
    .from('items').upsert(fields).select().single()
  return { data, error }
}

export async function deleteItem(id) {
  return supabase.from('items').delete().eq('id', id)
}

export async function uploadItemPhoto(itemId, file, side = 'front', sort = 0) {
  const ext  = file.name.split('.').pop()
  const path = `items/${itemId}/${side}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('item-photos').upload(path, file, { upsert: false })
  if (error) return { data: null, error }
  const { data: urlData } = supabase.storage.from('item-photos').getPublicUrl(path)
  const { data, error: dbErr } = await supabase
    .from('item_photos').insert({ item_id: itemId, url: urlData.publicUrl, side, sort }).select().single()
  return { data, error: dbErr }
}

export async function deleteItemPhoto(photoId, path) {
  await supabase.storage.from('item-photos').remove([path])
  return supabase.from('item_photos').delete().eq('id', photoId)
}

// ── USER ITEMS ────────────────────────────────────────────────────────────────
export async function getUserItems(userId, collectionId) {
  const { data, error } = await supabase
    .from('user_items')
    .select('*, item:items!inner(collection_id, number), user_item_photos(*)')
    .eq('user_id', userId)
    .eq('item.collection_id', collectionId)
  return { data: data || [], error }
}

export async function getAllUserItems(userId) {
  const { data, error } = await supabase
    .from('user_items')
    .select('*, item:items(collection_id, number, name), user_item_photos(*)')
    .eq('user_id', userId)
  return { data: data || [], error }
}

export async function upsertUserItem(userId, itemId, fields) {
  const { data, error } = await supabase
    .from('user_items')
    .upsert({ user_id: userId, item_id: itemId, ...fields, updated_at: new Date().toISOString() })
    .select().single()
  return { data, error }
}

export async function uploadUserPhoto(userId, itemId, file, side = 'front') {
  const ext  = file.name.split('.').pop()
  const path = `user-photos/${userId}/${itemId}/${side}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('user-photos').upload(path, file)
  if (error) return { data: null, error }
  const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(path)
  const { data, error: dbErr } = await supabase
    .from('user_item_photos')
    .insert({ user_id: userId, item_id: itemId, url: urlData.publicUrl, side })
    .select().single()
  return { data, error: dbErr }
}

export async function deleteUserPhoto(photoId) {
  return supabase.from('user_item_photos').delete().eq('id', photoId)
}

// ── COMMUNITY ─────────────────────────────────────────────────────────────────
export async function getPosts() {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*, profile:profiles(handle, location, avatar_url)')
    .eq('visible', true)
    .order('created_at', { ascending: false })
    .limit(50)
  return { data: data || [], error }
}

export async function createPost(userId, body) {
  const { data, error } = await supabase
    .from('community_posts').insert({ user_id: userId, body }).select().single()
  return { data, error }
}

export async function likePost(postId, currentLikes) {
  return supabase.from('community_posts').update({ likes: currentLikes + 1 }).eq('id', postId)
}

export async function moderatePost(postId, visible) {
  return supabase.from('community_posts').update({ visible }).eq('id', postId)
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: false })
  return { data: data || [], error }
}

export async function setAdminRole(userId, isAdmin) {
  return supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId)
}

export async function getAllPosts() {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*, profile:profiles(handle)')
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}
