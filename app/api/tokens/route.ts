import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'data', 'tokens.json');

function getTokensData() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const raw = fs.readFileSync(TOKENS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[Nickfield AI] Error reading tokens.json:', e);
  }

  return {
    totalPurchased: 5000000,
    currentBalance: 4537175,
    totalUsed: 462825,
    lastUpdated: new Date().toISOString(),
    rates: {
      '480p': { perSec: 9680, per5s: 48400, per10s: 96800 },
      '720p': { perSec: 21780, per5s: 108900, per10s: 217800 },
      '1080p': { perSec: 49000, per5s: 245000, per10s: 490000 },
    },
    history: [],
  };
}

function saveTokensData(data: any) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[Nickfield AI] Error saving tokens.json:', e);
    return false;
  }
}

export async function GET() {
  const data = getTokensData();
  
  // Calculate live remaining runtimes for both balance & trial
  const bal = data.currentBalance || 0;
  const trialRemaining = (data.trialQuota && data.trialQuota.enabled) ? (data.trialQuota.remaining || 0) : 0;
  const totalCombined = bal + trialRemaining;

  const calcMetrics = (tokens: number) => {
    const sec1080 = Math.floor(tokens / 49000);
    const sec720 = Math.floor(tokens / 21780);
    const sec480 = Math.floor(tokens / 9680);
    return {
      remaining1080pMinutes: (sec1080 / 60).toFixed(1),
      remaining1080pVideos5s: Math.floor(tokens / 245000),
      remaining1080pVideos10s: Math.floor(tokens / 490000),
      remaining720pMinutes: (sec720 / 60).toFixed(1),
      remaining720pVideos5s: Math.floor(tokens / 108900),
      remaining720pVideos10s: Math.floor(tokens / 217800),
      remaining480pMinutes: (sec480 / 60).toFixed(1),
      remaining480pVideos5s: Math.floor(tokens / 48400),
    };
  };

  return NextResponse.json({
    success: true,
    ...data,
    totalAvailable: totalCombined,
    metrics: calcMetrics(bal),
    trialMetrics: calcMetrics(trialRemaining),
    combinedMetrics: calcMetrics(totalCombined),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = getTokensData();

    if (body.action === 'set_balance') {
      const newBal = parseInt(body.balance, 10);
      if (!isNaN(newBal) && newBal >= 0) {
        data.currentBalance = newBal;
        if (body.totalUsed !== undefined) {
          const newUsed = parseInt(body.totalUsed, 10);
          if (!isNaN(newUsed)) data.totalUsed = newUsed;
        }
        saveTokensData(data);
        return NextResponse.json({ success: true, currentBalance: data.currentBalance, totalUsed: data.totalUsed, trialQuota: data.trialQuota });
      }
      return NextResponse.json({ success: false, error: 'Invalid balance value' }, { status: 400 });
    }

    if (body.action === 'set_trial') {
      if (!data.trialQuota) {
        data.trialQuota = {
          enabled: true,
          totalLimit: 5000000,
          remaining: 1251025,
          used: 3748975,
          source: 'BytePlus ModelArk Free Trial',
          status: 'Active (Free Trial Consuming)',
        };
      }

      if (body.remaining !== undefined) {
        const newRem = parseInt(body.remaining, 10);
        if (!isNaN(newRem) && newRem >= 0) {
          data.trialQuota.remaining = newRem;
          data.trialQuota.used = Math.max(0, (data.trialQuota.totalLimit || 5000000) - newRem);
        }
      }

      if (body.totalLimit !== undefined) {
        const newLimit = parseInt(body.totalLimit, 10);
        if (!isNaN(newLimit) && newLimit > 0) {
          data.trialQuota.totalLimit = newLimit;
        }
      }

      if (body.enabled !== undefined) {
        data.trialQuota.enabled = Boolean(body.enabled);
      }

      data.trialQuota.status = (data.trialQuota.enabled && data.trialQuota.remaining > 0) 
        ? 'Active (Free Trial Consuming)' 
        : 'Trial Exhausted / Paid Active';

      saveTokensData(data);
      return NextResponse.json({ success: true, trialQuota: data.trialQuota, currentBalance: data.currentBalance });
    }

    if (body.action === 'reset_trial') {
      const limit = data.trialQuota?.totalLimit || 5000000;
      data.trialQuota = {
        enabled: true,
        totalLimit: limit,
        remaining: limit,
        used: 0,
        source: 'BytePlus ModelArk Free Trial',
        status: 'Active (Free Trial Consuming)',
      };
      saveTokensData(data);
      return NextResponse.json({ success: true, trialQuota: data.trialQuota });
    }

    if (body.action === 'deduct') {
      const amount = parseInt(body.amount, 10);
      if (!isNaN(amount) && amount > 0) {
        let deductedTrial = 0;
        if (data.trialQuota && data.trialQuota.enabled && data.trialQuota.remaining > 0) {
          deductedTrial = Math.min(data.trialQuota.remaining, amount);
          data.trialQuota.remaining -= deductedTrial;
          data.trialQuota.used = (data.trialQuota.used || 0) + deductedTrial;
          if (data.trialQuota.remaining === 0) {
            data.trialQuota.status = 'Trial Exhausted / Paid Active';
          }
        }

        const paidToDeduct = amount - deductedTrial;
        if (paidToDeduct > 0) {
          data.currentBalance = Math.max(0, (data.currentBalance || 0) - paidToDeduct);
        }

        data.totalUsed = (data.totalUsed || 0) + amount;

        if (body.entry) {
          data.history = [
            {
              id: body.entry.id || `tx-${Date.now()}`,
              timestamp: new Date().toISOString(),
              resolution: body.entry.resolution || '1080p',
              duration: body.entry.duration || 5,
              tokensUsed: amount,
              deductedTrial,
              deductedPaid: paidToDeduct,
              title: body.entry.title || 'Live Video Generation',
            },
            ...(data.history || []).slice(0, 49),
          ];
        }
        saveTokensData(data);
        return NextResponse.json({ 
          success: true, 
          currentBalance: data.currentBalance, 
          totalUsed: data.totalUsed,
          trialQuota: data.trialQuota,
          deductedTrial,
          deductedPaid: paidToDeduct
        });
      }
    }

    return NextResponse.json({ success: true, ...data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

