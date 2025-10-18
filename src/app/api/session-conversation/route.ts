import { readFile } from 'node:fs/promises';

import { NextResponse } from 'next/server';

import type { SessionConversationEntry, SessionConversationTurn } from '@/lib/types';

interface RawEvent {
  timestamp?: unknown;
  type?: unknown;
  payload?: {
    type?: unknown;
    message?: unknown;
    text?: unknown;
  };
}

export async function POST(request: Request) {
  try {
    let parsedBody: unknown = null;
    if (request.body) {
      try {
        parsedBody = await request.json();
      } catch {
        parsedBody = null;
      }
    }

    const body = (parsedBody ?? {}) as { sessionPath?: unknown };
    const sessionPath = typeof body.sessionPath === 'string' ? body.sessionPath.trim() : '';

    if (!sessionPath) {
      return NextResponse.json({ error: 'sessionPath is required' }, { status: 400 });
    }

    let content: string;
    try {
      content = await readFile(sessionPath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ error: `Session file not found at ${sessionPath}` }, { status: 404 });
      }
      throw error;
    }

    const events: SessionConversationEntry[] = [];
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      let parsed: RawEvent;
      try {
        parsed = JSON.parse(trimmed) as RawEvent;
      } catch {
        continue;
      }

      if (parsed.type !== 'event_msg') {
        continue;
      }

      const payload = parsed.payload;
      if (
        !payload ||
        (payload.type !== 'user_message' &&
          payload.type !== 'agent_message' &&
          payload.type !== 'agent_reasoning')
      ) {
        continue;
      }

      const timestamp = typeof parsed.timestamp === 'string' ? parsed.timestamp : '';
      let text: string | null = null;

      if ((payload.type === 'user_message' || payload.type === 'agent_message') && typeof payload.message === 'string') {
        text = payload.message;
      } else if (payload.type === 'agent_reasoning' && typeof payload.text === 'string') {
        text = payload.text;
      }

      if (text === null) {
        continue;
      }

      events.push({
        timestamp,
        type: payload.type,
        text,
      });
    }

    const chronologicalEvents = events
      .map((event, index) => ({ event, index }))
      .sort((a, b) => {
        const timeA = Date.parse(a.event.timestamp);
        const timeB = Date.parse(b.event.timestamp);
        const isNaA = Number.isNaN(timeA);
        const isNaB = Number.isNaN(timeB);

        if (isNaA && isNaB) {
          return a.index - b.index;
        }
        if (isNaA) {
          return 1;
        }
        if (isNaB) {
          return -1;
        }
        if (timeA === timeB) {
          return a.index - b.index;
        }
        return timeA - timeB;
      })
      .map((entry) => entry.event);

    const turns: SessionConversationTurn[] = [];

    for (const event of chronologicalEvents) {
      if (event.type === 'user_message') {
        turns.push({
          user: event,
          reasonings: [],
        });
        continue;
      }

      if (event.type === 'agent_reasoning') {
        let targetTurn = turns[turns.length - 1];
        if (!targetTurn) {
          targetTurn = { reasonings: [] };
          turns.push(targetTurn);
        }
        targetTurn.reasonings.push(event);
        continue;
      }

      if (event.type === 'agent_message') {
        const targetTurn = turns[turns.length - 1];
        if (!targetTurn || targetTurn.agent) {
          turns.push({
            reasonings: [],
            agent: event,
          });
        } else {
          targetTurn.agent = event;
        }
      }
    }

    return NextResponse.json({ turns });
  } catch (error) {
    console.error('Failed to load session conversation', error);
    return NextResponse.json({ error: 'Failed to load session conversation' }, { status: 500 });
  }
}
