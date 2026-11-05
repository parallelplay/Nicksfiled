import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

export const maxDuration = 900;

function sanitizeImageForBytePlus(imgDataOrPath: string, isAvatar: boolean = false): string {
  if (!imgDataOrPath || typeof imgDataOrPath !== 'string') return imgDataOrPath;
  if (!imgDataOrPath.startsWith('data:image/') && !imgDataOrPath.startsWith('/')) {
    return imgDataOrPath;
  }

  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'sanitize_image.py');
    let inputArg = '-';
    let inputStdin: string | undefined = undefined;

    if (imgDataOrPath.startsWith('/')) {
      const localPath = path.join(process.cwd(), 'public', imgDataOrPath);
      if (fs.existsSync(localPath)) {
        inputArg = localPath;
      } else {
        return imgDataOrPath;
      }
    } else {
      inputStdin = imgDataOrPath;
    }

    const cmdArgs = [scriptPath, inputArg];
    if (isAvatar) {
      cmdArgs.push('--avatar');
    }

    const output = execFileSync('python', cmdArgs, {
      input: inputStdin,
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 10000,
    });

    if (output && output.startsWith('data:image/')) {
      return output.trim();
    }
  } catch (e) {
    console.warn('[Nickfield AI] Image sanitization warning:', e);
  }

  return imgDataOrPath;
}

function recordLiveTokenDeduction(tokensUsed: number, taskId: string, title: string, resolution: string, duration: number) {
  try {
    const tokensFile = path.join(process.cwd(), 'data', 'tokens.json');
    if (fs.existsSync(tokensFile)) {
      const data = JSON.parse(fs.readFileSync(tokensFile, 'utf-8'));
      
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
          resolution,
          duration,
          tokensUsed,
          deductedTrial,
          deductedPaid: paidToDeduct,
          title,
        },
        ...(data.history || []).slice(0, 49),
      ];
      fs.writeFileSync(tokensFile, JSON.stringify(data, null, 2), 'utf-8');
      return data.currentBalance;
    }
  } catch (e) {
    console.warn('[Nickfield AI] Error recording live token deduction:', e);
  }
  return null;
}

function saveAssetToProjectsDb(projectId: string | undefined, asset: any) {
  try {
    const projectsFile = path.join(process.cwd(), 'data', 'projects.json');
    if (fs.existsSync(projectsFile)) {
      const data = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
      if (Array.isArray(data.projects)) {
        const proj = data.projects.find((p: any) => p.id === projectId) || data.projects[0];
        if (proj) {
          asset.projectId = proj.id;
          asset.projectTitle = proj.title;
          proj.assets = [asset, ...(proj.assets || []).filter((a: any) => a.id !== asset.id)];

          // Update folder asset counts
          if (Array.isArray(proj.folders)) {
            proj.folders.forEach((f: any) => {
              if (f.id === 'all') f.assetCount = proj.assets.length;
              else if (f.parentId) {
                f.assetCount = proj.assets.filter((a: any) => a.folderId === f.id).length;
              } else {
                const childIds = proj.folders.filter((c: any) => c.parentId === f.id).map((c: any) => c.id);
                f.assetCount = proj.assets.filter((a: any) => a.folderId === f.id || childIds.includes(a.folderId)).length;
              }
            });
          }

          fs.writeFileSync(projectsFile, JSON.stringify(data, null, 2), 'utf-8');
          console.log(`[Nickfield AI] Permanently saved asset ${asset.id} to project "${proj.title}" in folder "${asset.folderPath || asset.folderId}"`);
        }
      }
    }
  } catch (e) {
    console.warn('[Nickfield AI] Error saving asset to projects.json:', e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      prompt, 
      elements = [], 
      settings, 
      projectId, 
      projectTitle, 
      projectBrief, 
      folderId,
      folderPath,
      previousShots = [] 
    } = body;

    const apiKey = process.env.BYTEPLUS_API_KEY;

    // =========================================================================
    // HIGGSFIELD CINEMA STUDIO: PROJECT MEMORY & CONTINUITY SYNTHESIZER
    // =========================================================================
    // 1. Extract previous shot context for multi-shot narrative continuity
    const lastShot = previousShots && previousShots.length > 0 ? previousShots[0] : null;
    let continuityDirectives: string[] = [];

    if (settings?.referenceMode === 'Sequel' && lastShot) {
      continuityDirectives.push(`Direct sequel continuity from [${lastShot.title}]. Maintain identical camera angle vector, environment lighting temperature, and character wardrobe state.`);
    } else if (settings?.referenceMode === 'Prequel' && lastShot) {
      continuityDirectives.push(`Establishing prequel lead-in sequence preceding [${lastShot.title}]. Match scene lighting and environmental atmosphere.`);
    } else if (lastShot) {
      continuityDirectives.push(`Project narrative continuity: Match color grade, grain, and lighting consistency with previous shot.`);
    }

    // 2. Synthesize locked element definitions (Characters, Props, Locations)
    const elementDirectives: string[] = [];
    if (elements && Array.isArray(elements) && elements.length > 0) {
      elements.forEach((el: any) => {
        const isFaceOrCharacter = 
          el.category === 'character' || 
          el.tag?.startsWith('@char') || 
          el.tag?.startsWith('@avatar') || 
          el.tag?.startsWith('@img') || 
          /lady|woman|man|girl|boy|kabir|model|person|character|avatar|face|image/i.test(el.name || '');

        if (isFaceOrCharacter) {
          elementDirectives.push(
            `[EXACT AVATAR & FACE LOCK: ${el.tag}] Directly USE and ANIMATE the EXACT face and avatar from the uploaded reference photo for "${el.name}". Do NOT generate a new face, do NOT create a lookalike or imitation. The character IS the exact person shown in the uploaded reference photo. Maintain the identical facial anatomy, eyes, nose, lips, facial structure, skin tone, and features directly from the reference photo across all camera angles and motions. 100% 1:1 facial identity lock. Negative: new face, different person, lookalike, imitation, altered facial features, face change, plastic skin, face morphing, mismatched face, facial drift.`
          );
        } else if (el.description) {
          elementDirectives.push(`[Entity Lock: ${el.tag} (${el.category})] ${el.name}: ${el.description}. Proportions, features, and textures strictly preserved.`);
        }
      });
    }

    // 3. Project Brief aesthetic lock (e.g. 35mm film grain, teal-amber grade)
    let aestheticLock = '';
    if (projectBrief && typeof projectBrief === 'string') {
      const aestheticMatch = projectBrief.match(/Aesthetic Lock[:\s]+([^\n]+)/i);
      if (aestheticMatch) {
        aestheticLock = `[Project Aesthetic: ${aestheticMatch[1]}]`;
      }
    }

    // 4. Director Camera Movement, Optical Look & Motion Intensity (Higgsfield Cinema Studio)
    const directorDirectives: string[] = [];
    if (settings?.cameraMovement && settings.cameraMovement !== 'Auto Camera') {
      directorDirectives.push(`[Director Camera Movement: ${settings.cameraMovement}]`);
    }
    if (settings?.opticalLook && settings.opticalLook !== 'Default Neutral') {
      directorDirectives.push(`[Film Look & Optics: ${settings.opticalLook}]`);
    }
    if (settings?.motionStrength) {
      directorDirectives.push(`[Motion Dynamics: ${settings.motionStrength}/10 kinetic energy]`);
    }

    // Full Augmented Seedance 2.5 Cinema Prompt
    const enhancedSeedancePrompt = [
      prompt,
      ...directorDirectives,
      ...continuityDirectives,
      ...elementDirectives,
      aestheticLock,
      `Master render: ${settings?.resolution || '1080p'} ultra-sharp DiT diffusion, 24fps cinema cadence, native volumetric lighting.`
    ].filter(Boolean).join('\n\n');

    console.log(`[Nickfield Engine] Project: "${projectTitle}" | Augmented Prompt:\n`, enhancedSeedancePrompt);

    // =========================================================================
    // BYTEPLUS MODELARK SEEDANCE 2.5 DISPATCH PAYLOAD (Official Schema)
    // =========================================================================
    const targetResolution = settings?.resolution || '1080p';

    const seedancePayload: {
      model: string;
      content: any[];
      generate_audio: boolean;
      ratio: string;
      duration: number;
      resolution: string;
      watermark: boolean;
    } = {
      model: 'dreamina-seedance-2-5-260628',
      content: [
        {
          type: 'text',
          text: enhancedSeedancePrompt,
        },
      ],
      generate_audio: settings?.sound ?? true,
      ratio: settings?.aspectRatio || '16:9',
      duration: parseInt(settings?.duration || '5', 10),
      resolution: targetResolution,
      watermark: false,
    };

    // First-Frame / Start-Frame Keyframe Conditioning (Image-to-Video Mode)
    if (settings?.firstFrameImage) {
      let firstFrameUrl = settings.firstFrameImage;
      if (firstFrameUrl.startsWith('/')) {
        try {
          const localPath = path.join(process.cwd(), 'public', firstFrameUrl);
          if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath);
            const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpeg';
            const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
            firstFrameUrl = `data:${mime};base64,${buf.toString('base64')}`;
          }
        } catch (e) {
          console.warn('[Nickfield Engine] Error reading first frame image locally:', e);
        }
      }
      seedancePayload.content.push({
        type: 'image_url',
        image_url: { url: firstFrameUrl },
        role: 'first_frame',
      });
      console.log('[Nickfield Engine] Conditioned Seedance 2.5 with First-Frame Keyframe condition.');
    }

    // Attach reference images from locked elements (Multimodal Reference Conditioning)
    if (elements && Array.isArray(elements)) {
      elements.forEach((el: any) => {
        if (el.referenceImages && el.referenceImages.length > 0) {
          el.referenceImages.forEach((rawImgUrl: string) => {
            let finalImgUrl = rawImgUrl;

            // Direct support for BytePlus ModelArk Likeness Asset IDs (asset://...)
            if (rawImgUrl && typeof rawImgUrl === 'string' && rawImgUrl.startsWith('asset://')) {
              seedancePayload.content.push({
                type: 'image_url',
                image_url: { url: rawImgUrl },
                role: 'reference_image',
              });
              return;
            }

            // Resolve local public file paths to Base64 Data URL for BytePlus Cloud API
            if (rawImgUrl && typeof rawImgUrl === 'string' && rawImgUrl.startsWith('/')) {
              try {
                const localPath = path.join(process.cwd(), 'public', rawImgUrl);
                if (fs.existsSync(localPath)) {
                  const buf = fs.readFileSync(localPath);
                  const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpeg';
                  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
                  finalImgUrl = `data:${mime};base64,${buf.toString('base64')}`;
                }
              } catch (e) {
                console.warn('[Nickfield AI] Error reading local image for BytePlus:', e);
              }
            }

            // Send the pristine, 100% original high-resolution reference image to Seedance 2.5
            // so ModelArk cross-attention preserves the exact facial likeness, eyes, skin tone and features.
            // If ByteDance ever flags a real-person photo, the retry pass below handles it automatically.
            const sanitizedUrl = sanitizeImageForBytePlus(finalImgUrl, false);

            if (
              sanitizedUrl && 
              typeof sanitizedUrl === 'string' &&
              !sanitizedUrl.startsWith('blob:') && 
              !sanitizedUrl.includes('_thumbnail.webp')
            ) {
              seedancePayload.content.push({
                type: 'image_url',
                image_url: { url: sanitizedUrl },
                role: 'reference_image',
              });
            }
          });
        }
      });
    }

    // =========================================================================
    // REAL BYTEPLUS MODELARK CLOUD CALL (Live Seedance 2.5 Execution)
    // =========================================================================
    if (!apiKey || apiKey === 'your_byteplus_modelark_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'BytePlus API Key is missing. Please configure BYTEPLUS_API_KEY in .env.local',
      }, { status: 400 });
    }

    const endpoint = 'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks';
    console.log('[Nickfield AI] Submitting task to BytePlus ModelArk Seedance 2.5...');
    console.log('[Nickfield AI] Payload content items:', seedancePayload.content.length);

    let activeTaskResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(seedancePayload),
    });

    if (!activeTaskResponse.ok) {
      let currentErrText = await activeTaskResponse.text();
      console.warn('[Nickfield AI] BytePlus Task Dispatch error:', activeTaskResponse.status, currentErrText);

      // SMART SOUL ID RECOVERY (1:1 Higgsfield Fallback Architecture):
      // If BytePlus PrivacyInformation flags a raw photo, do NOT fail the user!
      if (currentErrText.includes('may contain real person') || currentErrText.includes('PrivacyInformation')) {
        console.log('[Nickfield AI] BytePlus flagged raw photo with PrivacyInformation. Activating Soul ID Prompt-Locked Synthesis...');
        const matchParam = currentErrText.match(/content\[(\d+)\]/);
        const flaggedIndex = matchParam ? parseInt(matchParam[1], 10) : 1;

        // Remove only the flagged sensitive real-person image from payload
        if (flaggedIndex > 0 && flaggedIndex < seedancePayload.content.length) {
          seedancePayload.content.splice(flaggedIndex, 1);
        } else {
          // Filter out any image tagged as character/avatar that might trigger privacy check
          seedancePayload.content = seedancePayload.content.filter((c: any) => c.type === 'text' || !c.role || c.role !== 'character');
        }

        console.log('[Nickfield AI] Retrying Seedance 2.5 with remaining content items:', seedancePayload.content.length);

        activeTaskResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(seedancePayload),
        });

        // If another item is flagged, clean down to text prompt + pure props
        if (!activeTaskResponse.ok) {
          currentErrText = await activeTaskResponse.text();
          if (currentErrText.includes('PrivacyInformation') || currentErrText.includes('may contain real person')) {
            console.log('[Nickfield AI] Secondary PrivacyInformation detected. Keeping only text prompt with full character anatomical locks...');
            seedancePayload.content = seedancePayload.content.filter((c: any) => c.type === 'text');
            activeTaskResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify(seedancePayload),
            });

            if (!activeTaskResponse.ok) {
              currentErrText = await activeTaskResponse.text();
            }
          }
        }
      }

      if (!activeTaskResponse.ok) {
        console.warn('[Nickfield AI] Final BytePlus Dispatch Error:', currentErrText);
        let userFriendlyError = currentErrText;
        try {
          const parsed = JSON.parse(currentErrText);
          userFriendlyError = parsed?.error?.message || currentErrText;
          if (parsed?.error?.code === 'AccountOverdueError' || currentErrText.includes('AccountOverdueError') || currentErrText.includes('overdue balance')) {
            userFriendlyError = 'BytePlus ModelArk Account Overdue: The request failed because your account has an overdue balance. Please check your BytePlus console balance or recharge.';
          }
        } catch {}

        return NextResponse.json({
          success: false,
          error: userFriendlyError,
        }, { status: 400 });
      }
    }

    const taskData = await activeTaskResponse.json();
    const taskId = taskData.id || taskData.task_id;
    console.log('[Nickfield AI] BytePlus Task Created with ID:', taskId);

    // Poll for result up to 300 seconds (75 attempts x 4s) for high-res 1080p DiT rendering
    let videoUrl: string | null = null;
    let lastStatusData: any = null;
    let attempts = 0;
    const maxAttempts = 180;

    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(r => setTimeout(r, 4000));
      attempts++;

      try {
        const statusRes = await fetch(`${endpoint}/${taskId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          lastStatusData = statusData;
          console.log(`[Nickfield AI] Polling Task ${taskId} (Attempt ${attempts}):`, statusData.status);

          if (statusData.status === 'succeeded' || statusData.status === 'SUCCESS') {
            // Multi-format extraction for Seedance output video
            if (Array.isArray(statusData.content)) {
              const videoItem = statusData.content.find((c: any) => c.type === 'video_url' || c.video_url);
              videoUrl = videoItem?.video_url?.url || videoItem?.url || (typeof videoItem?.video_url === 'string' ? videoItem.video_url : null);
            }
            if (!videoUrl && statusData.content?.video_url) {
              videoUrl = typeof statusData.content.video_url === 'string' ? statusData.content.video_url : statusData.content.video_url?.url;
            }
            if (!videoUrl && statusData.output?.video_url) {
              videoUrl = typeof statusData.output.video_url === 'string' ? statusData.output.video_url : statusData.output.video_url?.url;
            }
            if (!videoUrl && statusData.video_url) {
              videoUrl = typeof statusData.video_url === 'string' ? statusData.video_url : statusData.video_url?.url;
            }
            break;
          } else if (statusData.status === 'failed' || statusData.status === 'FAILED') {
            const failMsg = statusData.error?.message || statusData.message || 'BytePlus task failed';
            return NextResponse.json({ success: false, error: failMsg }, { status: 400 });
          }
        }
      } catch (pollErr) {
        console.warn(`[Nickfield AI] Transient network error while polling attempt ${attempts}, retrying...`, pollErr);
        // Do not crash, wait for next attempt!
      }
    }

    if (videoUrl) {
      console.log('[Nickfield AI] Live Seedance 2.5 Video Generated Successfully:', videoUrl);
      const shotIndex = (previousShots?.length || 0) + 1;
      const shotTitle = `Shot 0${shotIndex}: ${prompt.slice(0, 30)}...`;

      const targetDuration = parseInt(settings?.duration || '5', 10);
      const fallbackRate = targetResolution === '480p' ? 9680 : targetResolution === '1080p' ? 49000 : 21780;
      const actualTokens = lastStatusData?.usage?.total_tokens || lastStatusData?.usage?.completion_tokens || (targetDuration * fallbackRate);
      const confirmedResolution = lastStatusData?.resolution || targetResolution;

      const liveRemainingBalance = recordLiveTokenDeduction(actualTokens, taskId, shotTitle, confirmedResolution, targetDuration);

      const resolvedFolderId = folderId && folderId !== 'all' 
        ? folderId 
        : (confirmedResolution === '1080p' ? 'renders-1080p' : 'renders-720p');
      const resolvedFolderPath = folderPath && folderPath !== 'All Assets'
        ? folderPath
        : (confirmedResolution === '1080p' ? 'Renders & Masters / 1080p Final Cuts' : 'Renders & Masters / 720p Fast Previews');
      const resolvedCategory = confirmedResolution === '1080p' ? '1080p Final Cuts' : '720p Fast Previews';

      const generatedAsset = {
        id: `gen-${taskId}`,
        title: shotTitle,
        videoUrl: videoUrl,
        thumbnail: elements?.[0]?.thumbnail || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80',
        prompt: prompt,
        duration: settings?.duration || `${seedancePayload.duration}s`,
        aspectRatio: settings?.aspectRatio || seedancePayload.ratio,
        resolution: confirmedResolution,
        model: 'Seedance 2.5',
        createdAt: 'Just now',
        elementsUsed: (elements || []).map((e: any) => e.tag),
        tokensUsed: actualTokens,
        projectId: projectId || undefined,
        projectTitle: projectTitle || undefined,
        folderId: resolvedFolderId,
        folderPath: resolvedFolderPath,
        category: resolvedCategory,
        cameraMovement: settings?.cameraMovement && settings.cameraMovement !== 'Auto Camera' ? settings.cameraMovement : undefined,
        opticalLook: settings?.opticalLook && settings.opticalLook !== 'Default Neutral' ? settings.opticalLook : undefined,
        firstFrameImage: settings?.firstFrameImage || undefined,
        motionStrength: settings?.motionStrength,
      };

      saveAssetToProjectsDb(projectId, generatedAsset);

      return NextResponse.json({
        success: true,
        source: 'byteplus-seedance-2.5-live',
        liveRemainingBalance,
        asset: generatedAsset,
      });
    }

    return NextResponse.json({
      success: false,
      taskId,
      error: `BytePlus task ${taskId} is still rendering on GPU cluster (Seedance 2.5 1080p DiT). Rendering usually completes in 6-8 minutes. Please use 'Check Task' to retrieve the video.`,
    }, { status: 408 });
  } catch (error: any) {
    console.error('Generation API Route Exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
