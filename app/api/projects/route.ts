import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { initialProjects, initialGlobalElements, initialDirectChats } from '@/data/defaultData';

const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json');

function getStoredData() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (e) {
    console.error('[Nickfield AI] Error reading projects.json:', e);
  }

  return {
    projects: initialProjects,
    globalElements: initialGlobalElements,
    chats: initialDirectChats,
    activeProjectId: initialProjects[0]?.id || '',
    lastUpdated: new Date().toISOString(),
  };
}

function saveStoredData(data: any) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[Nickfield AI] Error writing projects.json:', e);
    return false;
  }
}

export async function GET() {
  const data = getStoredData();
  return NextResponse.json({ success: true, ...data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = getStoredData();

    const updatedData = {
      projects: body.projects !== undefined ? body.projects : current.projects,
      globalElements: body.globalElements !== undefined ? body.globalElements : current.globalElements,
      chats: body.chats !== undefined ? body.chats : current.chats,
      activeProjectId: body.activeProjectId !== undefined ? body.activeProjectId : current.activeProjectId,
      lastUpdated: new Date().toISOString(),
    };

    saveStoredData(updatedData);
    return NextResponse.json({ success: true, ...updatedData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
