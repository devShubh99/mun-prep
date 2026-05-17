import { callDeepSeek, send, sendError, readBody } from './_shared.js'
import type { IncomingMessage, ServerResponse } from 'http'

const SYSTEM_PROMPT = (country: string, committee: string, topic: string) =>
  `You are an expert MUN research agent. Research ${country} for ${committee} on "${topic || 'general topics'}".

Generate JSON matching this schema exactly:
{
  "role": "string describing this country's UN role (e.g., P5 Permanent Member, Elected Member, Observer, etc.)",
  "statChips": [
    { "icon": "users", "label": "Population", "value": "string" },
    { "icon": "dollar-sign", "label": "GDP", "value": "string" },
    { "icon": "trending-down", "label": "Unemployment", "value": "string" },
    { "icon": "bar-chart", "label": "HDI", "value": "string" },
    { "icon": "landmark", "label": "Government", "value": "string" }
  ],
  "sections": [
    {
      "title": "Country Profile",
      "confidence": "high|medium|low",
      "items": [
        { "label": "Government Structure", "content": "...", "list": [] },
        { "label": "Key Economic Indicators", "content": "...", "list": [] }
      ]
    }
  ],
  "votingRecord": [
    { "topic": "Resolution name", "yes": true, "no": false, "abstain": false, "coSponsor": true }
  ],
  "bilateralRelations": [
    { "country": "Country name", "summary": "2-3 sentence summary", "type": "Partner|Rival|Complex|Neutral" }
  ],
  "allyBubbles": [
    { "name": "Country name", "group": "ally|opponent|swing", "importance": "large|medium|small" }
  ]
}

Research these 6 sections (fill sections[]):
1. "Country Profile" — government, economy, demographics, recent news. confidence: high
2. "Foreign Policy & Alliances" — doctrine, bilaterals, major powers, UN stance. confidence: high
3. "Committee-Specific Research" — position, votes, domestic relevance, key arguments. confidence: medium
4. "Historical Context" — UN history, conflicts, treaties. confidence: medium
5. "Bloc Alignment" — allies, opponents, swing states. confidence: medium. Also populate allyBubbles with 8-12 countries.
6. "Delegate Toolkit" — speech points (as list), amendments (as list), red lines (as list), working paper allies (as list). confidence: low

Populate statChips with real data.
Populate votingRecord with 4-5 realistic past resolutions.
Populate bilateralRelations with 4 key countries.
Each item's "list" field should contain bullet points when appropriate, empty array otherwise.
Cite sources inline within content fields.`

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { country, committee, topic } = await readBody(req)
    const content = await callDeepSeek([
      { role: 'system', content: SYSTEM_PROMPT(country, committee, topic) },
      { role: 'user', content: topic
        ? `Generate research JSON for ${country} on ${topic} for ${committee}.`
        : `Generate research JSON for ${country} for ${committee}.` },
    ], { json: true })
    return send(res, JSON.parse(content))
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
