
import { Playlist, Song } from "../types";

const PLAYLISTS_KEY = 'nocturne_playlists';

export const getPlaylists = (): Playlist[] => {
  const data = localStorage.getItem(PLAYLISTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePlaylists = (playlists: Playlist[]) => {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
};

export const createPlaylist = (name: string): Playlist => {
  const playlists = getPlaylists();
  const newPlaylist: Playlist = {
    id: Math.random().toString(36).substring(7),
    name,
    songIds: [],
    createdAt: Date.now()
  };
  savePlaylists([...playlists, newPlaylist]);
  return newPlaylist;
};

export const deletePlaylist = (id: string) => {
  const playlists = getPlaylists();
  savePlaylists(playlists.filter(p => p.id !== id));
};

export const renamePlaylist = (id: string, newName: string) => {
  const playlists = getPlaylists();
  savePlaylists(playlists.map(p => p.id === id ? { ...p, name: newName } : p));
};

export const addSongToPlaylist = (playlistId: string, songId: string) => {
  const playlists = getPlaylists();
  savePlaylists(playlists.map(p => {
    if (p.id === playlistId && !p.songIds.includes(songId)) {
      return { ...p, songIds: [...p.songIds, songId] };
    }
    return p;
  }));
};

export const removeSongFromPlaylist = (playlistId: string, songId: string) => {
  const playlists = getPlaylists();
  savePlaylists(playlists.map(p => {
    if (p.id === playlistId) {
      return { ...p, songIds: p.songIds.filter(id => id !== songId) };
    }
    return p;
  }));
};

export const reorderPlaylistSongs = (playlistId: string, newSongIds: string[]) => {
  const playlists = getPlaylists();
  savePlaylists(playlists.map(p => p.id === playlistId ? { ...p, songIds: newSongIds } : p));
};
