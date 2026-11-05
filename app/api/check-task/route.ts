import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'data', 'tokens.json');

function recordLiveTokenDeduction(tokensUsed: number, taskId: string, title: string, resolution: string, duration: number) {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const raw = fs.readFileSync(TOKENS_FILE, 'utf-8');
      const data = JSON.parse(raw);

      // Check if already recorded
      if (data.history && data.history.some((h: any) => h.id === taskId)) {
        return data.currentBalance;
      }

      let deductedTrial = 0;
      if (data.trialQuota && data.trialQuota.enabled && data.trialQuota.remaining > 0) {
        deductedTrial = Math.min(data.trialQuota.remaining, tokensUsed);
        data.trialQuota.remaining -= deductedTrial;
        data.trialQuota.used = (data.trialQuota.used || 0) + deductedTrial;
        if (data.trialQuota.remaining === 0) {
          data.trialQuota.status = 'Trial Exhausted / Paid Active';
        }
      }

      const paidToDeduct = tokensUsed - deductedTrial;
      if (paidToDeduct > 0) {
        data.currentBalance = Math.max(0, (data.currentBalance || 5000000) - paidToDeduct);
      }

      data.totalUsed = (data.totalUsed || 0) + tokensUsed;
      data.lastUpdated = new Date().toISOString();

      data.history = [
        {
          id: taskId,
          timestamp: new Date().toISOString(),
          resolution: resolution || '1080p',
          duration: duration || 5,
          tokensUsed: tokensUsed,
          deductedTrial,
          deductedPaid: paidToDeduct,
          title: title || 'Live Video Generation',
        },
        ...(data.history || []).slice(0, 49),
      ];

      fs.writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return data.currentBalance;
    }
  } catch (e) {
    console.error('[Nickfield AI] Error updating tokens.json from check-task:', e);
  }
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const reqProjectId = searchParams.get('projectId');
  const reqFolderId = searchParams.get('folderId');
  const reqFolderPath = searchParams.get('folderPath');
  const apiKey = process.env.BYTEPLUS_API_KEY;

  if (!taskId) {
    return NextResponse.json({ error: 'taskId parameter is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Error fetching task' }, { status: res.status });
    }

    let videoUrl: string | null = null;
    if (data.status === 'succeeded' || data.status === 'SUCCESS') {
      if (Array.isArray(data.content)) {
        const item = data.content.find((c: any) => c.type === 'video_url' || c.video_url);
        videoUrl = item?.video_url?.url || item?.url || (typeof item?.video_url === 'string' ? item.video_url : null);
      }
      if (!videoUrl && data.content?.video_url) {
        videoUrl = typeof data.content.video_url === 'string' ? data.content.video_url : data.content.video_url?.url;
      }
      if (!videoUrl && data.output?.video_url) {
        videoUrl = typeof data.output.video_url === 'string' ? data.output.video_url : data.output.video_url?.url;
      }
      if (!videoUrl && data.video_url) {
        videoUrl = typeof data.video_url === 'string' ? data.video_url : data.video_url?.url;
      }

      const duration = data.duration || 5;
      const resolution = data.resolution || '1080p';
      const tokensUsed = data.usage?.total_tokens || data.usage?.completion_tokens || 488025;
      const title = `Generated Shot (${resolution} ${duration}s)`;

      const liveRemainingBalance = recordLiveTokenDeduction(tokensUsed, taskId, title, resolution, duration);

      const resolvedFolderId = reqFolderId && reqFolderId !== 'all'
        ? reqFolderId
        : (resolution === '1080p' ? 'renders-1080p' : 'renders-720p');
      const resolvedFolderPath = reqFolderPath && reqFolderPath !== 'All Assets'
        ? reqFolderPath
        : (resolution === '1080p' ? 'Renders & Masters / 1080p Final Cuts' : 'Renders & Masters / 720p Fast Previews');
      const resolvedCategory = resolution === '1080p' ? '1080p Final Cuts' : '720p Fast Previews';

      const asset = {
        id: `gen-${taskId}`,
        title,
        videoUrl,
        thumbnail: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&auto=format&fit=crop&q=80',
        prompt: `BytePlus ModelArk Generation (${taskId})`,
        duration: `${duration}s`,
        aspectRatio: data.ratio || '9:16',
        resolution,
        model: 'Seedance 2.5',
        createdAt: new Date(data.updated_at ? data.updated_at * 1000 : Date.now()).toLocaleTimeString(),
        tokensUsed,
        elementsUsed: [],
        projectId: reqProjectId || undefined,
        folderId: resolvedFolderId,
        folderPath: resolvedFolderPath,
        category: resolvedCategory,
      };

      try {
        const projectsFile = path.join(process.cwd(), 'data', 'projects.json');
        if (fs.existsSync(projectsFile)) {
          const pData = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
          if (Array.isArray(pData.projects) && pData.projects.length > 0) {
            const p = (reqProjectId && pData.projects.find((proj: any) => proj.id === reqProjectId)) || pData.projects[0];
            asset.projectId = p.id;
            asset.projectTitle = p.title;
            p.assets = [asset, ...(p.assets || []).filter((a: any) => a.id !== asset.id)];

            // Update folder asset counts
            if (Array.isArray(p.folders)) {
              p.folders.forEach((f: any) => {
                if (f.id === 'all') f.assetCount = p.assets.length;
                else if (f.parentId) {
                  f.assetCount = p.assets.filter((a: any) => a.folderId === f.id).length;
                } else {
                  const childIds = p.folders.filter((c: any) => c.parentId === f.id).map((c: any) => c.id);
                  f.assetCount = p.assets.filter((a: any) => a.folderId === f.id || childIds.includes(a.folderId)).length;
                }
              });
            }

            fs.writeFileSync(projectsFile, JSON.stringify(pData, null, 2), 'utf-8');
          }
        }
      } catch (e) {}

      return NextResponse.json({
        success: true,
        status: data.status,
        videoUrl,
        asset,
        liveRemainingBalance,
        raw: data,
      });
    }
        liveRemainingBalance,
        raw: data,
      });
    }

    return NextResponse.json({
      success: true,
      status: data.status,
      videoUrl: null,
      raw: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
